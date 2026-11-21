import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FolderOpen } from "lucide-react";
import { publicStorageUrl } from "@/lib/storage";
import { AdminCard, AdminHeader, EmptyState, StatusBadge } from "@/features/admin/ui";
import { CategoryForm } from "@/features/admin/components/category-form";
import { adminCategories } from "@/features/admin/queries";

export const metadata: Metadata = { title: "Categories" };

export default async function AdminCategoriesPage({ searchParams }: PageProps<"/admin/categories">) {
  const [categories, sp] = await Promise.all([adminCategories(), searchParams]);

  return (
    <>
      <AdminHeader title="Categories" description="Groups shown on the Products page. Click a category to edit it, change its image or add subcategories." />
      {sp.deleted ? <p className="mb-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">Category deleted.</p> : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        {categories.length === 0 ? (
          <EmptyState title="No categories yet" text="Create one with the form, or run the starter catalogue SQL from the setup guide." />
        ) : (
          <div className="overflow-hidden rounded-xl border border-line bg-white">
            <ul className="divide-y divide-line">
              {categories.map((c) => {
                const src = publicStorageUrl("category-images", c.image_path);
                return (
                  <li key={c.id}>
                    <Link href={`/admin/categories/${c.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-steel/60">
                      <div className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-md border border-line bg-steel">
                        {src ? <Image src={src} alt="" fill sizes="48px" className="object-cover" /> : <FolderOpen className="size-5 text-slate-text" aria-hidden />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-ink">{c.name}</p>
                        <p className="text-xs text-slate-text">
                          {c.productCount} {c.productCount === 1 ? "product" : "products"}
                          {c.subcategories.length ? `, ${c.subcategories.length} subcategories` : ""}
                        </p>
                      </div>
                      <StatusBadge status={c.is_published ? "published" : "draft"} label={c.is_published ? "Published" : "Hidden"} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <AdminCard title="New category">
          <CategoryForm />
        </AdminCard>
      </div>
    </>
  );
}
