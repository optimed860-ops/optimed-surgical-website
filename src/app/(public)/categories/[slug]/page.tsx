import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { getCategories, getCategoryBySlug, listProducts } from "@/features/catalogue/queries";
import { parsePage, parseSlug, sanitizeSearch } from "@/features/catalogue/search";
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
import { cn } from "@/lib/utils";

type Props = PageProps<"/categories/[slug]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Category not found", robots: { index: false } };
  return {
    title: category.name,
    description:
      category.description ?? `Browse ${category.name.toLowerCase()} from Optimed and request a quotation for your order.`,
    alternates: { canonical: `/categories/${category.slug}` },
    openGraph: { title: category.name, description: category.description ?? undefined },
  };
}

export default function CategoryPage({ params, searchParams }: Props) {
  return (
    <Suspense fallback={<CategorySkeleton />}>
      <CategoryContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function CategoryContent({ params, searchParams }: Pick<Props, "params" | "searchParams">) {
  const [{ slug }, sp, categories] = await Promise.all([params, searchParams, getCategories()]);
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  const subSlug = parseSlug(sp.sub);
  const sub = category.subcategories.find((s) => s.slug === subSlug) ?? null;
  const q = sanitizeSearch(Array.isArray(sp.q) ? sp.q[0] : sp.q);
  const page = parsePage(sp.page);
  const base = `/categories/${category.slug}`;

  const hrefFor = (p: number) => {
    const qs = new URLSearchParams();
    if (sub) qs.set("sub", sub.slug);
    if (q) qs.set("q", q);
    if (p > 1) qs.set("page", String(p));
    const s = qs.toString();
    return s ? `${base}?${s}` : base;
  };

  return (
    <CatalogueLayout
      crumbs={[{ label: "Products", href: "/products" }, { label: category.name, href: sub ? base : undefined }, ...(sub ? [{ label: sub.name }] : [])]}
      title={sub ? sub.name : category.name}
      lead={sub?.description ?? category.description}
      search={<SearchForm action={base} defaultValue={q} hidden={sub ? { sub: sub.slug } : undefined} />}
      sidebar={<CategoryNav categories={categories} activeSlug={category.slug} activeSubSlug={sub?.slug} />}
    >
      {category.subcategories.length > 0 ? (
        <ul className="mb-8 flex flex-wrap gap-2" aria-label={`${category.name} subcategories`}>
          <li>
            <Chip href={base} active={!sub}>
              All {category.name}
            </Chip>
          </li>
          {category.subcategories.map((s) => (
            <li key={s.id}>
              <Chip href={`${base}?sub=${s.slug}`} active={s.id === sub?.id}>
                {s.name}
              </Chip>
            </li>
          ))}
        </ul>
      ) : null}

      <Suspense fallback={<GridSkeleton />}>
        <CategoryResults categoryId={category.id} subcategoryId={sub?.id} q={q} page={page} hrefFor={hrefFor} resetHref={sub ? `${base}?sub=${sub.slug}` : base} />
      </Suspense>
    </CatalogueLayout>
  );
}

async function CategoryResults({
  categoryId,
  subcategoryId,
  q,
  page,
  hrefFor,
  resetHref,
}: {
  categoryId: string;
  subcategoryId?: string;
  q: string;
  page: number;
  hrefFor: (p: number) => string;
  resetHref: string;
}) {
  const result = await listProducts({ categoryId, subcategoryId, q, page });
  if (result.items.length === 0) return <EmptyResults query={q} resetHref={resetHref} />;
  return (
    <div className="space-y-8">
      <ResultsSummary total={result.total} page={result.page} pageSize={result.pageSize} query={q} />
      <ProductGrid products={result.items} columns={3} priorityCount={3} />
      <Pagination page={result.page} pageCount={result.pageCount} hrefFor={hrefFor} />
    </div>
  );
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex h-9 items-center rounded-md border px-3.5 text-sm font-medium transition-colors",
        active ? "border-navy-800 bg-navy-800 text-white" : "border-line bg-white text-ink hover:border-navy-800/30",
      )}
    >
      {children}
    </Link>
  );
}

function CategorySkeleton() {
  return (
    <div className="container-page py-16" aria-busy="true">
      <span className="sr-only">Loading category…</span>
      <div className="h-10 w-72 animate-pulse rounded bg-surface-2" />
      <div className="mt-10">
        <GridSkeleton />
      </div>
    </div>
  );
}
