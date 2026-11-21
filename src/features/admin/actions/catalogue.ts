"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { assertAdmin } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { dbError, fail, ok, slugify, type ActionResult } from "../result";

/** Refresh every cached public page that shows catalogue data. */
function refreshCatalogue(slug?: string) {
  updateTag("products");
  updateTag("categories");
  if (slug) updateTag(`product:${slug}`);
  refresh();
}

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : null));
const checkbox = z.union([z.literal("on"), z.literal("true"), z.undefined(), z.null()]).transform((v) => v === "on" || v === "true");

const specsSchema = z
  .string()
  .optional()
  .transform((raw, ctx) => {
    if (!raw) return [];
    try {
      const parsed = z
        .array(z.object({ label: z.string().trim().max(80), value: z.string().trim().max(300) }))
        .max(40)
        .parse(JSON.parse(raw));
      return parsed.filter((s) => s.label && s.value);
    } catch {
      ctx.addIssue({ code: "custom", message: "Specifications are not valid." });
      return z.NEVER;
    }
  });

const productSchema = z.object({
  id: z.uuid().optional().or(z.literal("").transform(() => undefined)),
  name: z.string().trim().min(1, "Product name is required").max(200),
  slug: z.string().trim().max(100).optional(),
  categoryId: z.uuid("Choose a category"),
  subcategoryId: z.uuid().optional().or(z.literal("").transform(() => undefined)),
  productCode: text(80),
  manufacturer: text(160),
  shortDescription: text(500),
  description: text(20000),
  specifications: specsSchema,
  isFeatured: checkbox,
  featuredOrder: z.coerce.number().int().min(0).max(9999).catch(0),
  isPublished: checkbox,
});

export async function saveProduct(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await assertAdmin();
  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Check the form.");
  const d = parsed.data;
  const slug = slugify(d.slug || d.name);
  if (!slug) return fail("Enter a name that contains letters or numbers.");

  const row = {
    name: d.name,
    slug,
    category_id: d.categoryId,
    subcategory_id: d.subcategoryId ?? null,
    product_code: d.productCode,
    manufacturer: d.manufacturer,
    short_description: d.shortDescription,
    description: d.description,
    specifications: d.specifications,
    is_featured: d.isFeatured,
    featured_order: d.featuredOrder,
    is_published: d.isPublished,
  };

  const supabase = await createClient();
  if (d.id) {
    const { error } = await supabase.from("products").update(row).eq("id", d.id);
    if (error) return dbError(error);
    refreshCatalogue(slug);
    return ok("Product saved.");
  }
  const { data, error } = await supabase.from("products").insert(row).select("id").single();
  if (error || !data) return dbError(error);
  refreshCatalogue(slug);
  redirect(`/admin/products/${data.id}?created=1`);
}

export async function deleteProduct(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = z.uuid().parse(formData.get("id"));
  const supabase = await createClient();
  const { data: images } = await supabase.from("product_images").select("storage_path").eq("product_id", id);
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error("Could not delete the product.");
  if (images?.length) await supabase.storage.from("product-images").remove(images.map((i) => i.storage_path));
  refreshCatalogue();
  redirect("/admin/products?deleted=1");
}

export async function setProductPublished(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = z.uuid().parse(formData.get("id"));
  const value = formData.get("value") === "true";
  const supabase = await createClient();
  await supabase.from("products").update({ is_published: value }).eq("id", id);
  refreshCatalogue();
}

// ── Images ────────────────────────────────────────────────────────────────────

/** Records an image the browser already uploaded to product-images/{productId}/… */
export async function addProductImage(productId: string, storagePath: string, altText: string): Promise<ActionResult> {
  await assertAdmin();
  const id = z.uuid().safeParse(productId);
  if (!id.success || !new RegExp(`^${productId}/[a-f0-9-]{36}\\.(jpg|jpeg|png|webp|avif)$`).test(storagePath)) {
    return fail("Invalid image.");
  }
  const supabase = await createClient();
  const { count } = await supabase.from("product_images").select("id", { count: "exact", head: true }).eq("product_id", productId);
  const { error } = await supabase.from("product_images").insert({
    product_id: productId,
    storage_path: storagePath,
    alt_text: altText.trim().slice(0, 250) || null,
    is_primary: (count ?? 0) === 0,
    display_order: count ?? 0,
  });
  if (error) {
    await supabase.storage.from("product-images").remove([storagePath]);
    return dbError(error);
  }
  refreshCatalogue();
  return ok("Image added.");
}

export async function deleteProductImage(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = z.uuid().parse(formData.get("id"));
  const supabase = await createClient();
  const { data } = await supabase.from("product_images").select("storage_path, product_id, is_primary").eq("id", id).maybeSingle();
  if (!data) return;
  await supabase.from("product_images").delete().eq("id", id);
  await supabase.storage.from("product-images").remove([data.storage_path]);
  if (data.is_primary) {
    const { data: next } = await supabase.from("product_images").select("id").eq("product_id", data.product_id).order("display_order").limit(1).maybeSingle();
    if (next) await supabase.from("product_images").update({ is_primary: true }).eq("id", next.id);
  }
  refreshCatalogue();
}

export async function setPrimaryImage(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = z.uuid().parse(formData.get("id"));
  const productId = z.uuid().parse(formData.get("productId"));
  const supabase = await createClient();
  await supabase.from("product_images").update({ is_primary: false }).eq("product_id", productId);
  await supabase.from("product_images").update({ is_primary: true }).eq("id", id);
  refreshCatalogue();
}

// ── Categories ────────────────────────────────────────────────────────────────

const categorySchema = z.object({
  id: z.uuid().optional().or(z.literal("").transform(() => undefined)),
  name: z.string().trim().min(1, "Category name is required").max(120),
  slug: z.string().trim().max(100).optional(),
  description: text(2000),
  displayOrder: z.coerce.number().int().min(0).max(9999).catch(0),
  isPublished: checkbox,
});

export async function saveCategory(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await assertAdmin();
  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Check the form.");
  const d = parsed.data;
  const row = {
    name: d.name,
    slug: slugify(d.slug || d.name),
    description: d.description,
    display_order: d.displayOrder,
    is_published: d.isPublished,
  };
  const supabase = await createClient();
  const result = d.id
    ? await supabase.from("categories").update(row).eq("id", d.id)
    : await supabase.from("categories").insert(row);
  if (result.error) return dbError(result.error);
  refreshCatalogue();
  return ok(d.id ? "Category saved." : "Category created.");
}

export async function deleteCategory(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = z.uuid().parse(formData.get("id"));
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) redirect(`/admin/categories/${id}?error=in-use`);
  refreshCatalogue();
  redirect("/admin/categories?deleted=1");
}

export async function setCategoryImage(categoryId: string, storagePath: string | null): Promise<ActionResult> {
  await assertAdmin();
  if (!z.uuid().safeParse(categoryId).success) return fail("Invalid category.");
  if (storagePath && !new RegExp(`^${categoryId}/[a-f0-9-]{36}\\.(jpg|jpeg|png|webp|avif)$`).test(storagePath)) return fail("Invalid image.");
  const supabase = await createClient();
  const { data: current } = await supabase.from("categories").select("image_path").eq("id", categoryId).maybeSingle();
  const { error } = await supabase.from("categories").update({ image_path: storagePath }).eq("id", categoryId);
  if (error) return dbError(error);
  if (current?.image_path && current.image_path !== storagePath) {
    await supabase.storage.from("category-images").remove([current.image_path]);
  }
  refreshCatalogue();
  return ok(storagePath ? "Image updated." : "Image removed.");
}

const subcategorySchema = z.object({
  categoryId: z.uuid(),
  name: z.string().trim().min(1, "Subcategory name is required").max(120),
});

export async function addSubcategory(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await assertAdmin();
  const parsed = subcategorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Check the form.");
  const supabase = await createClient();
  const { error } = await supabase.from("subcategories").insert({
    category_id: parsed.data.categoryId,
    name: parsed.data.name,
    slug: slugify(parsed.data.name),
    is_published: true,
  });
  if (error) return dbError(error);
  refreshCatalogue();
  return ok("Subcategory added.");
}

export async function deleteSubcategory(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = z.uuid().parse(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("subcategories").delete().eq("id", id);
  refreshCatalogue();
}

export async function removeCategoryImage(formData: FormData): Promise<void> {
  const id = z.uuid().parse(formData.get("id"));
  await setCategoryImage(id, null);
}
