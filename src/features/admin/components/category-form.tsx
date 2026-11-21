import { ActionForm, SubmitButton } from "../client-ui";
import { FieldRow, adminInput, primaryButton } from "../ui";
import { saveCategory } from "../actions/catalogue";

export type CategoryFormValues = {
  id?: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
  is_published: boolean;
};

export function CategoryForm({ category }: { category?: CategoryFormValues }) {
  return (
    <ActionForm action={saveCategory} className="space-y-4" resetOnSuccess={!category}>
      {category?.id ? <input type="hidden" name="id" value={category.id} /> : null}
      <FieldRow label="Category name">
        <input name="name" required maxLength={120} defaultValue={category?.name} className={`${adminInput} h-10`} />
      </FieldRow>
      <FieldRow label="Web address (slug)" hint="optional, made from the name">
        <input name="slug" maxLength={100} defaultValue={category?.slug} className={`${adminInput} h-10 font-mono`} />
      </FieldRow>
      <FieldRow label="Description" hint="optional">
        <textarea name="description" rows={3} maxLength={2000} defaultValue={category?.description ?? ""} className={`${adminInput} py-2`} />
      </FieldRow>
      <div className="flex flex-wrap items-center gap-6 text-sm">
        <label className="flex items-center gap-2">
          Display order
          <input type="number" name="displayOrder" min={0} max={9999} defaultValue={category?.display_order ?? 0} className={`${adminInput} h-9 w-20`} />
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="isPublished" defaultChecked={category?.is_published ?? true} className="size-4 accent-navy-800" />
          Published
        </label>
      </div>
      <div className="flex justify-end">
        <SubmitButton className={primaryButton}>{category?.id ? "Save changes" : "Create category"}</SubmitButton>
      </div>
    </ActionForm>
  );
}
