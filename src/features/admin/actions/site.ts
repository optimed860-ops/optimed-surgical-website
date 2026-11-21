"use server";

import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_CONTENT, mergeShape, type SiteContent } from "@/content/editable";
import { dbError, fail, ok, type ActionResult } from "../result";
import { SOCIAL_NETWORKS } from "@/components/shared/social-icons";

// ── Website content (all page text) ───────────────────────────────────────────

const SECTION_KEYS = Object.keys(DEFAULT_CONTENT) as (keyof SiteContent)[];

async function readOverride(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data } = await supabase.from("site_settings").select("setting_value").eq("setting_key", "site_content").maybeSingle();
  const value = data?.setting_value;
  return value && typeof value === "object" && !Array.isArray(value) ? { ...(value as Record<string, unknown>) } : {};
}

async function writeOverride(supabase: Awaited<ReturnType<typeof createClient>>, value: Record<string, unknown>) {
  return supabase.from("site_settings").upsert({ setting_key: "site_content", setting_value: value as never, is_public: true }, { onConflict: "setting_key" });
}

/** Saves one section. The value is reshaped to the defaults, so nothing unexpected is stored. */
export async function saveContentSection(section: string, value: unknown): Promise<ActionResult> {
  await assertAdmin();
  const key = SECTION_KEYS.find((k) => k === section);
  if (!key) return fail("Unknown section.");
  if (JSON.stringify(value ?? null).length > 200_000) return fail("This section is too long.");
  const clean = mergeShape(DEFAULT_CONTENT[key] as unknown, value);

  const supabase = await createClient();
  const override = await readOverride(supabase);
  override[key] = clean;
  const { error } = await writeOverride(supabase, override);
  if (error) return dbError(error);
  updateTag("content");
  updateTag("settings");
  refresh();
  return ok("Saved. The website now shows the new text.");
}

/** Removes the saved text for one section so the original wording comes back. */
export async function resetContentSection(section: string): Promise<ActionResult> {
  await assertAdmin();
  const key = SECTION_KEYS.find((k) => k === section);
  if (!key) return fail("Unknown section.");
  const supabase = await createClient();
  const override = await readOverride(supabase);
  delete override[key];
  const { error } = await writeOverride(supabase, override);
  if (error) return dbError(error);
  updateTag("content");
  updateTag("settings");
  refresh();
  return ok("Original text restored.");
}

// ── Company settings ──────────────────────────────────────────────────────────

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : null));

const settingsSchema = z.object({
  companyName: optionalText(160),
  contactEmail: z.union([z.literal(""), z.email("Enter a valid email address").max(254)]).optional().transform((v) => (v ? v.toLowerCase() : null)),
  phoneNumber: optionalText(40),
  address: optionalText(400),
  ...Object.fromEntries(SOCIAL_NETWORKS.map((n) => [`social_${n.key}`, socialUrl(n.label)])),
});

/** Optional https:// link for one social network. */
function socialUrl(label: string) {
  return z
    .string()
    .trim()
    .max(300)
    .optional()
    .refine((v) => !v || /^https:\/\/[^\s]+$/.test(v), `${label} link must start with https://`)
    .transform((v) => v || null);
}

export async function saveSettings(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await assertAdmin();
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Check the form.");
  const d = parsed.data as z.infer<typeof settingsSchema> & Record<string, string | null>;
  const socialLinks = SOCIAL_NETWORKS.flatMap((n) => {
    const url = d[`social_${n.key}`];
    return url ? [{ label: n.label, url }] : [];
  });
  const rows = [
    { setting_key: "company_name", setting_value: d.companyName },
    { setting_key: "contact_email", setting_value: d.contactEmail },
    { setting_key: "phone_number", setting_value: d.phoneNumber },
    { setting_key: "address", setting_value: d.address },
    { setting_key: "social_links", setting_value: socialLinks },
  ].map((r) => ({ ...r, is_public: true }));
  const supabase = await createClient();
  const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "setting_key" });
  if (error) return dbError(error);
  updateTag("settings");
  refresh();
  return ok("Settings saved.");
}

// ── Certifications (private documents) ────────────────────────────────────────

const certSchema = z.object({
  id: z.uuid(),
  title: z.string().trim().min(1, "Title is required").max(200),
  description: optionalText(2000),
  issueDate: z.union([z.literal(""), z.iso.date()]).optional().transform((v) => v || null),
  expiryDate: z.union([z.literal(""), z.iso.date()]).optional().transform((v) => v || null),
  displayOrder: z.coerce.number().int().min(0).max(9999).catch(0),
  isPublished: z.union([z.literal("on"), z.undefined()]).transform((v) => v === "on"),
});

function refreshCerts() {
  updateTag("certifications");
  refresh();
}

/** Records a document the browser uploaded to certifications/new/{uuid}.ext */
export async function addCertification(storagePath: string, title: string, fileType: string): Promise<ActionResult> {
  await assertAdmin();
  if (!/^new\/[a-f0-9-]{36}\.(pdf|jpg|jpeg|png|webp|avif)$/.test(storagePath)) return fail("Invalid file.");
  const supabase = await createClient();
  const { error } = await supabase.from("certifications").insert({
    title: title.trim().slice(0, 200) || "Certificate",
    document_path: storagePath,
    document_type: fileType === "pdf" ? "pdf" : "image",
    is_published: false,
  });
  if (error) {
    await supabase.storage.from("certifications").remove([storagePath]);
    return dbError(error);
  }
  refreshCerts();
  return ok("Uploaded. Fill in the details and publish it.");
}

export async function saveCertification(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await assertAdmin();
  const parsed = certSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Check the form.");
  const d = parsed.data;
  if (d.issueDate && d.expiryDate && d.expiryDate < d.issueDate) return fail("Expiry date must be after the issue date.");
  const supabase = await createClient();
  const { error } = await supabase
    .from("certifications")
    .update({
      title: d.title,
      description: d.description,
      issue_date: d.issueDate,
      expiry_date: d.expiryDate,
      display_order: d.displayOrder,
      is_published: d.isPublished,
    })
    .eq("id", d.id);
  if (error) return dbError(error);
  refreshCerts();
  return ok("Saved.");
}

export async function deleteCertification(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = z.uuid().parse(formData.get("id"));
  const supabase = await createClient();
  const { data } = await supabase.from("certifications").select("document_path").eq("id", id).maybeSingle();
  const { error } = await supabase.from("certifications").delete().eq("id", id);
  if (!error && data?.document_path) await supabase.storage.from("certifications").remove([data.document_path]);
  refreshCerts();
}
