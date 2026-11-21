import type { Metadata } from "next";
import { Suspense } from "react";
import { getCategories, listProducts } from "@/features/catalogue/queries";
import { parsePage, sanitizeSearch } from "@/features/catalogue/search";
import { CatalogueLayout } from "@/features/catalogue/components/catalogue-layout";
import {
  CategoryNav,
  EmptyResults,
  GridSkeleton,
  ResultsSummary,
  SearchForm,
} from "@/features/catalogue/components/catalogue-ui";
import { ProductGrid } from "@/features/catalogue/components/product-card";
import { Pagination } from "@/components/shared/pagination";

export const metadata: Metadata = {
  title: "Products",
  description: "Browse the Optimed catalogue of medical equipment, surgical instruments, dental products and hospital supplies.",
  alternates: { canonical: "/products" },
};

type SearchParams = PageProps<"/products">["searchParams"];

export default async function ProductsPage({ searchParams }: PageProps<"/products">) {
  const categories = await getCategories();

  return (
    <CatalogueLayout
      crumbs={[{ label: "Products" }]}
      title="Products"
      lead="A selection from our range. Search by name or item code, then add products to your quote list."
      search={
        <Suspense fallback={<SearchForm action="/products" />}>
          <SearchWithValue searchParams={searchParams} />
        </Suspense>
      }
      sidebar={<CategoryNav categories={categories} />}
    >
      <Suspense fallback={<GridSkeleton />}>
        <Results searchParams={searchParams} />
      </Suspense>
    </CatalogueLayout>
  );
}

async function SearchWithValue({ searchParams }: { searchParams: SearchParams }) {
  const { q } = await searchParams;
  return <SearchForm action="/products" defaultValue={sanitizeSearch(Array.isArray(q) ? q[0] : q)} />;
}

async function Results({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const q = sanitizeSearch(Array.isArray(params.q) ? params.q[0] : params.q);
  const page = parsePage(params.page);
  const result = await listProducts({ q, page });

  if (result.items.length === 0) return <EmptyResults query={q} resetHref="/products" />;

  const hrefFor = (p: number) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (p > 1) sp.set("page", String(p));
    const s = sp.toString();
    return s ? `/products?${s}` : "/products";
  };

  return (
    <div className="space-y-8">
      <ResultsSummary total={result.total} page={result.page} pageSize={result.pageSize} query={q} />
      <ProductGrid products={result.items} columns={3} priorityCount={3} />
      <Pagination page={result.page} pageCount={result.pageCount} hrefFor={hrefFor} />
    </div>
  );
}
