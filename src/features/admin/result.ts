export type ActionResult = { ok: boolean; message: string };

export const ok = (message: string): ActionResult => ({ ok: true, message });
export const fail = (message: string): ActionResult => ({ ok: false, message });

/** Plain-language message for common database errors. */
export function dbError(error: { code?: string; message?: string } | null | undefined, fallback = "Could not save. Please try again."): ActionResult {
  if (!error) return fail(fallback);
  if (error.code === "23505" && /product_code/.test(error.message ?? "")) return fail("This item code is already used by another product. Choose a different code.");
  if (error.code === "23505") return fail("That name or web address (slug) is already used. Choose a different one.");
  if (error.code === "23503") return fail("This item is still linked to other records (for example products in a category). Move or remove those first.");
  if (error.code === "23514" && /Subcategory/i.test(error.message ?? "")) return fail("The chosen subcategory belongs to a different category. Pick a matching subcategory or None.");
  if (error.code === "23514") return fail("Some values are not allowed. Check lengths and required fields.");
  if (error.code === "42501") return fail("You do not have permission to do this. Sign in again as an admin.");
  console.error("[admin]", error.code, error.message);
  return fail(fallback);
}

/** URL-friendly slug from a name. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}
