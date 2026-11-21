import Link from "next/link";
import { PackageSearch, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CategorySummary } from "../types";

/** GET search form: works without JavaScript and keeps results shareable by URL. */
export function SearchForm({
  action,
  defaultValue,
  hidden,
  className,
}: {
  action: string;
  defaultValue?: string;
  hidden?: Record<string, string>;
  className?: string;
}) {
  return (
    <form action={action} method="get" role="search" className={cn("flex w-full gap-2", className)}>
      {Object.entries(hidden ?? {}).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <label htmlFor="catalogue-search" className="sr-only">
        Search by product name or code
      </label>
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-text" aria-hidden />
        <input
          id="catalogue-search"
          name="q"
          type="search"
          defaultValue={defaultValue}
          maxLength={80}
          placeholder="Search by product name or code"
          className="h-12 w-full rounded-md border border-input bg-white pr-3 pl-10 text-[0.9375rem] text-ink outline-none placeholder:text-slate-text/80 focus-visible:border-medical-500 focus-visible:ring-3 focus-visible:ring-medical-500/20"
        />
      </div>
      <Button type="submit" size="xl" className="px-5">
        Search
      </Button>
    </form>
  );
}

export function CategoryNav({
  categories,
  activeSlug,
  activeSubSlug,
}: {
  categories: CategorySummary[];
  activeSlug?: string | null;
  activeSubSlug?: string | null;
}) {
  return (
    <nav aria-label="Product categories">
      <h2 className="mb-4 font-sans text-base font-semibold text-ink [font-stretch:100%]">Categories</h2>
      <ul className="space-y-0.5">
        <li>
          <Link
            href="/products"
            aria-current={!activeSlug ? "page" : undefined}
            className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-ink hover:bg-surface aria-[current=page]:bg-navy-800 aria-[current=page]:font-semibold aria-[current=page]:text-white"
          >
            All products
          </Link>
        </li>
        {categories.map((category) => {
          const active = category.slug === activeSlug;
          return (
            <li key={category.id}>
              <Link
                href={`/categories/${category.slug}`}
                aria-current={active && !activeSubSlug ? "page" : undefined}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm text-ink hover:bg-surface",
                  active && "font-semibold text-navy-800",
                  "aria-[current=page]:bg-navy-800 aria-[current=page]:text-white",
                )}
              >
                <span className="truncate">{category.name}</span>
                <span className="text-xs tabular-nums opacity-70">{category.productCount}</span>
              </Link>
              {active && category.subcategories.length > 0 ? (
                <ul className="my-1 ml-3 border-l border-line pl-2">
                  {category.subcategories.map((sub) => (
                    <li key={sub.id}>
                      <Link
                        href={`/categories/${category.slug}?sub=${sub.slug}`}
                        aria-current={sub.slug === activeSubSlug ? "page" : undefined}
                        className="block rounded-md px-3 py-1.5 text-sm text-slate-text hover:text-ink aria-[current=page]:bg-cyan-50 aria-[current=page]:font-semibold aria-[current=page]:text-navy-800"
                      >
                        {sub.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function EmptyResults({ query, resetHref }: { query?: string; resetHref: string }) {
  return (
    <div className="grid place-items-center rounded-lg border border-dashed border-line bg-white px-6 py-16 text-center">
      <PackageSearch className="size-10 text-navy-800/30" strokeWidth={1.25} aria-hidden />
      <h2 className="mt-4 text-h3">{query ? `No products match “${query}”` : "No products here yet"}</h2>
      <p className="mt-2 max-w-md text-sm text-slate-text">
        {query
          ? "Try a shorter search, check the product code, or browse by category."
          : "Products will appear here as soon as they are published. You can still send us your requirements."}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {query ? (
          <Button asChild variant="outline" size="lg">
            <Link href={resetHref}>
              <X aria-hidden /> Clear search
            </Link>
          </Button>
        ) : null}
        <Button asChild size="lg">
          <Link href="/quote">Request a quote</Link>
        </Button>
      </div>
    </div>
  );
}

export function GridSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading products…</span>
      <div className="mb-6 h-5 w-40 animate-pulse rounded bg-surface-2" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="border border-line bg-white">
            <div className="aspect-[4/3] animate-pulse bg-surface" />
            <div className="space-y-3 p-5">
              <div className="h-3 w-1/3 animate-pulse rounded bg-surface-2" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-surface-2" />
              <div className="h-11 animate-pulse rounded bg-surface" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ResultsSummary({ total, page, pageSize, query }: { total: number; page: number; pageSize: number; query?: string }) {
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <p className="text-sm text-slate-text" aria-live="polite">
      Showing <span className="font-medium text-ink">{from}–{to}</span> of{" "}
      <span className="font-medium text-ink">{total.toLocaleString("en")}</span> products
      {query ? (
        <>
          {" "}
          for “<span className="font-medium text-ink">{query}</span>”
        </>
      ) : null}
    </p>
  );
}
