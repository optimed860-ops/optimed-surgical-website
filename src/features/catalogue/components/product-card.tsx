import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProductVisual } from "@/components/shared/product-visual";
import { AddToQuoteButton } from "@/features/quote/components/add-to-quote";
import type { ProductSummary } from "../types";

/** Catalogue card: large image, name, code, two clear actions. Never a price. */
export function ProductCard({ product, priority }: { product: ProductSummary; priority?: boolean }) {
  const href = `/products/${product.slug}`;
  return (
    <article className="flex h-full flex-col rounded-lg border border-line bg-white transition-shadow hover:shadow-[0_18px_40px_-24px_rgb(16_20_58/0.35)]">
      <Link href={href} tabIndex={-1} aria-hidden className="block overflow-hidden rounded-t-lg">
        <ProductVisual
          imagePath={product.image?.path ?? null}
          alt={product.image?.alt ?? product.name}
          hints={[product.categorySlug, product.name]}
          priority={priority}
          className="aspect-square"
          iconClassName="size-16"
        />
      </Link>
      <div className="flex flex-1 flex-col border-t border-line p-5">
        {product.productCode ? (
          <p className="text-xs text-slate-text">
            Item code <span className="ml-1 font-semibold tracking-wide text-navy-800 tabular-nums">{product.productCode}</span>
          </p>
        ) : null}
        <h3 className="mt-1.5 font-sans text-base leading-snug font-semibold [font-stretch:100%]">
          <Link href={href} className="text-ink hover:text-navy-800 hover:underline">
            {product.name}
          </Link>
        </h3>
        {product.categoryName ? <p className="mt-1 text-sm text-slate-text">{product.categoryName}</p> : null}
        <div className="mt-auto grid gap-2 pt-5">
          <Button asChild variant="outline" size="lg" className="w-full border-navy-800/25 text-navy-800 hover:border-navy-800">
            <Link href={href}>View details</Link>
          </Button>
          <AddToQuoteButton
            product={{
              id: product.id,
              name: product.name,
              slug: product.slug,
              productCode: product.productCode,
              imagePath: product.image?.path ?? null,
            }}
          />
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({
  products,
  priorityCount = 0,
  columns = 4,
}: {
  products: ProductSummary[];
  priorityCount?: number;
  columns?: 3 | 4;
}) {
  return (
    <ul
      className={
        columns === 4 ? "grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
      }
      role="list"
    >
      {products.map((product, index) => (
        <li key={product.id}>
          <ProductCard product={product} priority={index < priorityCount} />
        </li>
      ))}
    </ul>
  );
}
