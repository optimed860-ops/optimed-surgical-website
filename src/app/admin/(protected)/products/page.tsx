import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Plus, Package } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { publicStorageUrl } from "@/lib/storage";
import { AdminHeader, EmptyState, StatusBadge, adminInput, primaryButton, secondaryButton } from "@/features/admin/ui";
import { setProductPublished } from "@/features/admin/actions/catalogue";
import { sanitizeSearch } from "@/features/catalogue/search";

export const metadata: Metadata = { title: "Products" };

type Row = {
  id: string;
  name: string;
  slug: string;
  product_code: string | null;
  is_published: boolean;
  is_featured: boolean;
  categories: { name: string } | null;
  product_images: { storage_path: string; is_primary: boolean }[] | null;
};

export default async function AdminProductsPage({ searchParams }: PageProps<"/admin/products">) {
  const sp = await searchParams;
  const q = sanitizeSearch(Array.isArray(sp.q) ? sp.q[0] : sp.q);
  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select("id, name, slug, product_code, is_published, is_featured, categories(name), product_images(storage_path, is_primary)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (q) query = query.or(`name.ilike.%${q}%,product_code.ilike.%${q}%`);
  const { data } = await query;
  const products = (data ?? []) as unknown as Row[];

  return (
    <>
      <AdminHeader
        title="Products"
        description={`${products.length} ${products.length === 1 ? "product" : "products"}${q ? ` matching “${q}”` : ""}`}
        actions={
          <Link href="/admin/products/new" className={primaryButton}>
            <Plus className="size-4" aria-hidden /> Add product
          </Link>
        }
      />
      {sp.deleted ? <p className="mb-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">Product deleted.</p> : null}

      <form className="mb-5 flex gap-2" action="/admin/products">
        <input name="q" defaultValue={q} placeholder="Search by name or code" className={`${adminInput} h-10 max-w-sm`} />
        <button className={secondaryButton}>Search</button>
      </form>

      {products.length === 0 ? (
        <EmptyState
          title={q ? "No products match your search" : "No products yet"}
          text={q ? undefined : "Add your first product, or run the starter catalogue SQL from the setup guide."}
          action={
            <Link href="/admin/products/new" className={primaryButton}>
              Add product
            </Link>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-white">
          <ul className="divide-y divide-line">
            {products.map((p) => {
              const image = [...(p.product_images ?? [])].sort((a, b) => Number(b.is_primary) - Number(a.is_primary))[0];
              const src = publicStorageUrl("product-images", image?.storage_path);
              return (
                <li key={p.id} className="flex flex-wrap items-center gap-4 px-4 py-3 sm:flex-nowrap">
                  <div className="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-md border border-line bg-steel">
                    {src ? <Image src={src} alt="" fill sizes="56px" className="object-contain p-1" /> : <Package className="size-5 text-slate-text" aria-hidden />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/products/${p.id}`} className="font-semibold text-ink hover:underline">
                      {p.name}
                    </Link>
                    <p className="text-xs text-slate-text">
                      {p.categories?.name ?? "No category"}
                      {p.product_code ? <span className="ml-2 font-mono">{p.product_code}</span> : null}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.is_featured ? <StatusBadge status="approved" label="Featured" /> : null}
                    <StatusBadge status={p.is_published ? "published" : "draft"} label={p.is_published ? "Published" : "Hidden"} />
                  </div>
                  <div className="flex items-center gap-2">
                    <form action={setProductPublished}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="value" value={String(!p.is_published)} />
                      <button className="h-9 rounded-md border border-[#cdd5df] px-3 text-xs font-semibold text-navy-800 hover:bg-steel">
                        {p.is_published ? "Hide" : "Publish"}
                      </button>
                    </form>
                    <Link href={`/admin/products/${p.id}`} className="inline-flex h-9 items-center rounded-md bg-navy-800 px-3 text-xs font-semibold text-white hover:bg-navy-950">
                      Edit
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
}
