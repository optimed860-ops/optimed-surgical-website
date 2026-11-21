import type { Metadata } from "next";
import Link from "next/link";
import { AdminHeader, EmptyState, primaryButton } from "@/features/admin/ui";
import { ProductForm } from "@/features/admin/components/product-form";
import { adminCategories } from "@/features/admin/queries";

export const metadata: Metadata = { title: "Add product" };

export default async function NewProductPage() {
  const categories = await adminCategories();
  return (
    <>
      <AdminHeader title="Add product" description="Photos can be added after the product is created." back={{ href: "/admin/products", label: "Products" }} />
      {categories.length === 0 ? (
        <EmptyState
          title="Create a category first"
          text="Every product belongs to a category."
          action={
            <Link href="/admin/categories" className={primaryButton}>
              Go to categories
            </Link>
          }
        />
      ) : (
        <div className="max-w-4xl">
          <ProductForm categories={categories} />
        </div>
      )}
    </>
  );
}
