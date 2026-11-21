export type PublicBucket = "product-images" | "category-images" | "site-assets";

/** Public URL for a file in a public Supabase Storage bucket. */
export function publicStorageUrl(bucket: PublicBucket, path: string | null | undefined): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!path || !base) return null;
  const safePath = path.split("/").map(encodeURIComponent).join("/");
  return `${base.replace(/\/$/, "")}/storage/v1/object/public/${bucket}/${safePath}`;
}
