import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Star, Trash2 } from "lucide-react";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { publicStorageUrl } from "@/lib/storage";
import { AdminCard, AdminHeader, dangerButton, secondaryButton } from "@/features/admin/ui";
import { SubmitButton } from "@/features/admin/client-ui";
import { ProductForm, type ProductFormValues } from "@/features/admin/components/product-form";
import { FileUploader } from "@/features/admin/components/file-uploader";
import { adminCategories } from "@/features/admin/queries";
import { addProductImage, deleteProduct, deleteProductImage, setPrimaryImage } from "@/features/admin/actions/catalogue";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({ params, searchParams }: PageProps<"/admin/products/[id]">) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  if (!z.uuid().safeParse(id).success) notFound();

  const supabase = await createClient();
  const [{ data: product }, { data: images }, categories] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, slug, category_id, subcategory_id, product_code, manufacturer, short_description, description, specifications, is_featured, featured_order, is_published")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("product_images").select("id, storage_path, alt_text, is_primary, display_order").eq("product_id", id).order("display_order"),
    adminCategories(),
  ]);
  if (!product) notFound();

  const values: ProductFormValues = {
    ...product,
    specifications: Array.isArray(product.specifications)
      ? (product.specifications as { label: string; value: string }[]).filter((s) => typeof s?.label === "string")
      : [],
  };

  return (
    <>
      <AdminHeader
        title={product.name}
        back={{ href: "/admin/products", label: "Products" }}
        actions={
          <>
            <Link href={`/products/${product.slug}`} target="_blank" className={secondaryButton}>
              <ExternalLink className="size-4" aria-hidden /> View on website
            </Link>
            <form action={deleteProduct}>
              <input type="hidden" name="id" value={product.id} />
              <SubmitButton className={dangerButton} confirm={`Delete “${product.name}”? This cannot be undone. Saved quotations keep the product name.`}>
                <Trash2 className="size-4" aria-hidden /> Delete
              </SubmitButton>
            </form>
          </>
        }
      />
      {sp.created ? <p className="mb-5 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">Product created. Now add photos below.</p> : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <ProductForm product={values} categories={categories} />

        <div className="space-y-6">
          <AdminCard title="Photos">
            {images && images.length > 0 ? (
              <ul className="mb-4 grid grid-cols-2 gap-3">
                {images.map((img) => {
                  const src = publicStorageUrl("product-images", img.storage_path);
                  return (
                    <li key={img.id} className="overflow-hidden rounded-lg border border-line">
                      <div className="relative aspect-square bg-white">
                        {src ? <Image src={src} alt={img.alt_text ?? ""} fill sizes="160px" className="object-contain p-2" /> : null}
                        {img.is_primary ? (
                          <span className="absolute top-1.5 left-1.5 rounded bg-navy-800 px-1.5 py-0.5 text-[0.6875rem] font-semibold text-white">Main</span>
                        ) : null}
                      </div>
                      <div className="flex border-t border-line">
                        {!img.is_primary ? (
                          <form action={setPrimaryImage} className="flex-1">
                            <input type="hidden" name="id" value={img.id} />
                            <input type="hidden" name="productId" value={product.id} />
                            <button className="flex h-9 w-full items-center justify-center gap-1 text-xs font-semibold text-navy-800 hover:bg-steel" title="Make main photo">
                              <Star className="size-3.5" aria-hidden /> Main
                            </button>
                          </form>
                        ) : (
                          <span className="flex-1" />
                        )}
                        <form action={deleteProductImage} className="flex-1 border-l border-line">
                          <input type="hidden" name="id" value={img.id} />
                          <SubmitButton className="flex h-9 w-full items-center justify-center gap-1 text-xs font-semibold text-red-700 hover:bg-red-50" confirm="Delete this photo?">
                            <Trash2 className="size-3.5" aria-hidden /> Delete
                          </SubmitButton>
                        </form>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mb-4 text-sm text-slate-text">No photos yet. The website shows an icon until you add one.</p>
            )}
            <FileUploader bucket="product-images" folder={product.id} onUploaded={addProductImage.bind(null, product.id)} withAlt label="Upload photo" />
          </AdminCard>
        </div>
      </div>
    </>
  );
}
