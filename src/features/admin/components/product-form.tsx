import { ActionForm, SubmitButton } from "../client-ui";
import { SpecsEditor } from "./specs-editor";
import { AdminCard, FieldRow, adminInput, primaryButton } from "../ui";
import { saveProduct } from "../actions/catalogue";

export type ProductFormValues = {
  id?: string;
  name: string;
  slug: string;
  category_id: string;
  subcategory_id: string | null;
  product_code: string | null;
  manufacturer: string | null;
  short_description: string | null;
  description: string | null;
  specifications: { label: string; value: string }[];
  is_featured: boolean;
  featured_order: number;
  is_published: boolean;
};

type Category = { id: string; name: string; subcategories: { id: string; name: string }[] };

export function ProductForm({ product, categories }: { product?: ProductFormValues; categories: Category[] }) {
  return (
    <ActionForm action={saveProduct} className="space-y-6">
      {product?.id ? <input type="hidden" name="id" value={product.id} /> : null}

      <AdminCard title="Basic details">
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldRow label="Product name" className="sm:col-span-2">
            <input name="name" required maxLength={200} defaultValue={product?.name} className={`${adminInput} h-10`} />
          </FieldRow>
          <FieldRow label="Category">
            <select name="categoryId" required defaultValue={product?.category_id ?? ""} className={`${adminInput} h-10`}>
              <option value="" disabled>
                Choose a category
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </FieldRow>
          <FieldRow label="Subcategory" hint="optional">
            <select name="subcategoryId" defaultValue={product?.subcategory_id ?? ""} className={`${adminInput} h-10`}>
              <option value="">None</option>
              {categories.map((c) =>
                c.subcategories.length ? (
                  <optgroup key={c.id} label={c.name}>
                    {c.subcategories.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </optgroup>
                ) : null,
              )}
            </select>
          </FieldRow>
          <FieldRow label="Item code" hint="unique; leave empty to create one, e.g. OPM-688-428">
            <input name="productCode" maxLength={80} defaultValue={product?.product_code ?? ""} placeholder="OPM-000-000" className={`${adminInput} h-10 font-mono uppercase`} />
          </FieldRow>
          <FieldRow label="Manufacturer" hint="optional">
            <input name="manufacturer" maxLength={160} defaultValue={product?.manufacturer ?? ""} className={`${adminInput} h-10`} />
          </FieldRow>
          <FieldRow label="Web address (slug)" hint="optional, made from the name" className="sm:col-span-2">
            <input name="slug" maxLength={100} defaultValue={product?.slug} placeholder="mayo-scissors-curved" className={`${adminInput} h-10 font-mono`} />
          </FieldRow>
        </div>
      </AdminCard>

      <AdminCard title="Description">
        <div className="space-y-4">
          <FieldRow label="Short description" hint="shown on product cards, max 500 characters">
            <textarea name="shortDescription" rows={2} maxLength={500} defaultValue={product?.short_description ?? ""} className={`${adminInput} py-2`} />
          </FieldRow>
          <FieldRow label="Full description" hint="shown on the product page">
            <textarea name="description" rows={6} maxLength={20000} defaultValue={product?.description ?? ""} className={`${adminInput} py-2`} />
          </FieldRow>
        </div>
      </AdminCard>

      <AdminCard title="Specifications (Key details)">
        <SpecsEditor name="specifications" initial={product?.specifications ?? []} />
      </AdminCard>

      <AdminCard title="Visibility">
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="isPublished" defaultChecked={product?.is_published ?? true} className="size-4 accent-navy-800" />
            Published (visible on the website)
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="isFeatured" defaultChecked={product?.is_featured ?? false} className="size-4 accent-navy-800" />
            Featured
          </label>
          <label className="flex items-center gap-2">
            Featured order
            <input type="number" name="featuredOrder" min={0} max={9999} defaultValue={product?.featured_order ?? 0} className={`${adminInput} h-9 w-20`} />
          </label>
        </div>
      </AdminCard>

      <div className="flex justify-end">
        <SubmitButton className={primaryButton}>{product?.id ? "Save changes" : "Create product"}</SubmitButton>
      </div>
    </ActionForm>
  );
}
