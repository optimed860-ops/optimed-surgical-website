import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Trash2, X } from "lucide-react";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { publicStorageUrl } from "@/lib/storage";
import { AdminCard, AdminHeader, FieldRow, adminInput, dangerButton, secondaryButton } from "@/features/admin/ui";
import { ActionForm, SubmitButton } from "@/features/admin/client-ui";
import { CategoryForm } from "@/features/admin/components/category-form";
import { FileUploader } from "@/features/admin/components/file-uploader";
import { addSubcategory, deleteCategory, deleteSubcategory, removeCategoryImage, setCategoryImage } from "@/features/admin/actions/catalogue";

export const metadata: Metadata = { title: "Edit category" };

export default async function EditCategoryPage({ params, searchParams }: PageProps<"/admin/categories/[id]">) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  if (!z.uuid().safeParse(id).success) notFound();

  const supabase = await createClient();
  const [{ data: category }, { data: subcategories }, { count }] = await Promise.all([
    supabase.from("categories").select("id, name, slug, description, image_path, display_order, is_published").eq("id", id).maybeSingle(),
    supabase.from("subcategories").select("id, name").eq("category_id", id).order("name"),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("category_id", id),
  ]);
  if (!category) notFound();
  const src = publicStorageUrl("category-images", category.image_path);

  return (
    <>
      <AdminHeader
        title={category.name}
        description={`${count ?? 0} ${count === 1 ? "product" : "products"} in this category`}
        back={{ href: "/admin/categories", label: "Categories" }}
        actions={
          <form action={deleteCategory}>
            <input type="hidden" name="id" value={category.id} />
            <SubmitButton className={dangerButton} confirm={`Delete the category “${category.name}”?`}>
              <Trash2 className="size-4" aria-hidden /> Delete
            </SubmitButton>
          </form>
        }
      />
      {sp.error === "in-use" ? (
        <p className="mb-5 rounded-md bg-red-50 p-3 text-sm text-red-800">
          This category still has products. Move or delete those products first, then delete the category.
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <AdminCard title="Details">
          <CategoryForm category={category} />
        </AdminCard>

        <div className="space-y-6">
          <AdminCard title="Image">
            {src ? (
              <div className="mb-4 overflow-hidden rounded-lg border border-line">
                <div className="relative aspect-[4/3] bg-steel">
                  <Image src={src} alt="" fill sizes="320px" className="object-cover" />
                </div>
                <form action={removeCategoryImage} className="border-t border-line">
                  <input type="hidden" name="id" value={category.id} />
                  <SubmitButton className="flex h-9 w-full items-center justify-center gap-1 text-xs font-semibold text-red-700 hover:bg-red-50" confirm="Remove this image?">
                    <X className="size-3.5" aria-hidden /> Remove image
                  </SubmitButton>
                </form>
              </div>
            ) : (
              <p className="mb-4 text-sm text-slate-text">No image. The website shows an icon instead.</p>
            )}
            <FileUploader bucket="category-images" folder={category.id} onUploaded={setCategoryImage.bind(null, category.id)} label={src ? "Replace image" : "Upload image"} />
          </AdminCard>

          <AdminCard title="Subcategories">
            {subcategories && subcategories.length > 0 ? (
              <ul className="mb-4 divide-y divide-line rounded-lg border border-line">
                {subcategories.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                    {s.name}
                    <form action={deleteSubcategory}>
                      <input type="hidden" name="id" value={s.id} />
                      <SubmitButton className="grid size-7 place-items-center rounded text-red-700 hover:bg-red-50" confirm={`Delete “${s.name}”?`}>
                        <Trash2 className="size-3.5" aria-label="Delete" />
                      </SubmitButton>
                    </form>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mb-4 text-sm text-slate-text">None yet. Subcategories are optional.</p>
            )}
            <ActionForm action={addSubcategory} resetOnSuccess className="space-y-3">
              <input type="hidden" name="categoryId" value={category.id} />
              <FieldRow label="New subcategory">
                <input name="name" required maxLength={120} className={`${adminInput} h-10`} />
              </FieldRow>
              <SubmitButton className={secondaryButton}>Add subcategory</SubmitButton>
            </ActionForm>
          </AdminCard>
        </div>
      </div>
    </>
  );
}
