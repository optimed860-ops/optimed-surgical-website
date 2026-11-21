import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { CONTACT } from "@/content/site";
import { AdminCard, AdminHeader, FieldRow, adminInput, primaryButton } from "@/features/admin/ui";
import { ActionForm, SubmitButton } from "@/features/admin/client-ui";
import { SOCIAL_NETWORKS, findSocial } from "@/components/shared/social-icons";
import { saveSettings } from "@/features/admin/actions/site";

export const metadata: Metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("setting_key, setting_value");
  const map = new Map((data ?? []).map((r) => [r.setting_key, r.setting_value]));
  const text = (key: string) => {
    const v = map.get(key);
    return typeof v === "string" ? v : "";
  };
  const social = map.get("social_links");
  const socialLinks = Array.isArray(social)
    ? (social as { label?: unknown; url?: unknown }[]).filter((s) => typeof s?.label === "string" && typeof s?.url === "string") as { label: string; url: string }[]
    : [];

  return (
    <>
      <AdminHeader title="Settings" description="Contact details and social links shown in the footer and on the contact page. Leave a field empty to use the default shown in grey." />
      <div className="max-w-3xl">
        <ActionForm action={saveSettings} className="space-y-6">
          <AdminCard title="Company and contact">
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldRow label="Company name" className="sm:col-span-2">
                <input name="companyName" maxLength={160} defaultValue={text("company_name")} placeholder="Optimed Surgical" className={`${adminInput} h-10`} />
              </FieldRow>
              <FieldRow label="Email" hint="the footer mail icon opens Gmail to this address">
                <input type="email" name="contactEmail" maxLength={254} defaultValue={text("contact_email")} placeholder={CONTACT.email} className={`${adminInput} h-10`} />
              </FieldRow>
              <FieldRow label="Phone">
                <input name="phoneNumber" maxLength={40} defaultValue={text("phone_number")} placeholder={CONTACT.phone} className={`${adminInput} h-10`} />
              </FieldRow>
              <FieldRow label="Address" className="sm:col-span-2">
                <textarea name="address" rows={3} maxLength={400} defaultValue={text("address")} placeholder={CONTACT.address} className={`${adminInput} py-2`} />
              </FieldRow>
            </div>
          </AdminCard>

          <AdminCard title="Social links">
            <p className="mb-4 text-sm text-slate-text">Paste the full page link. An icon appears in the footer only for the links you fill in.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {SOCIAL_NETWORKS.map((n) => (
                <FieldRow key={n.key} label={n.label}>
                  <input
                    type="url"
                    name={`social_${n.key}`}
                    maxLength={300}
                    defaultValue={findSocial(socialLinks, n.key)?.url ?? ""}
                    placeholder={n.placeholder}
                    className={`${adminInput} h-10`}
                  />
                </FieldRow>
              ))}
            </div>
          </AdminCard>

          <div className="flex justify-end">
            <SubmitButton className={primaryButton}>Save settings</SubmitButton>
          </div>
        </ActionForm>
      </div>
    </>
  );
}
