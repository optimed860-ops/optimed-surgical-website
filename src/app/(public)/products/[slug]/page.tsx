import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Check } from "lucide-react";
import { getProductBySlug, getRelatedProducts } from "@/features/catalogue/queries";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ProductGallery } from "@/features/catalogue/components/product-gallery";
import { ProductGrid } from "@/features/catalogue/components/product-card";
import { AddToQuoteWithQuantity } from "@/features/quote/components/add-to-quote";
import { publicStorageUrl } from "@/lib/storage";
import type { ProductDetail } from "@/features/catalogue/types";

type Props = PageProps<"/products/[slug]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found", robots: { index: false } };

  const description =
    product.shortDescription ??
    `${product.name}${product.productCode ? ` (${product.productCode})` : ""}. Request a quotation from Optimed.`;
  const image = publicStorageUrl("product-images", product.images[0]?.path);
  return {
    title: product.productCode ? `${product.name} · ${product.productCode}` : product.name,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: { title: product.name, description, images: image ? [{ url: image }] : undefined },
  };
}

export default function ProductPage({ params }: Props) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductContent params={params} />
    </Suspense>
  );
}

const ASSURANCES = [
  "Written quotation for your quantity",
  "Certificates and specifications on request",
  "International delivery quoted to your destination",
];

async function ProductContent({ params }: Pick<Props, "params">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  return (
    <>
      <section>
        <div className="container-page pt-8 pb-16 lg:pt-10 lg:pb-24">
          <Breadcrumbs
            items={[
              { label: "Products", href: "/products" },
              ...(product.categorySlug && product.categoryName
                ? [{ label: product.categoryName, href: `/categories/${product.categorySlug}` }]
                : []),
              { label: product.name },
            ]}
          />

          <div className="mt-10 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
            <ProductGallery images={product.images} name={product.name} hints={[product.categorySlug, product.name]} />

            <div className="lg:pt-4">
              {product.productCode ? (
                <p className="text-base text-slate-text">
                  Item code: <span className="ref-code text-base font-semibold text-navy-800">{product.productCode}</span>
                </p>
              ) : null}
              <h1 className="mt-3 text-h2">{product.name}</h1>
              {product.shortDescription ? (
                <p className="mt-5 text-lead text-slate-text">{product.shortDescription}</p>
              ) : null}

              <dl className="mt-8 divide-y divide-line border-y border-line text-[0.9375rem]">
                {product.categoryName ? (
                  <Row label="Category">
                    <Link
                      href={`/categories/${product.categorySlug}${product.subcategorySlug ? `?sub=${product.subcategorySlug}` : ""}`}
                      className="text-navy-800 underline-offset-4 hover:underline"
                    >
                      {product.subcategoryName ? `${product.categoryName}, ${product.subcategoryName}` : product.categoryName}
                    </Link>
                  </Row>
                ) : null}
                {product.manufacturer ? <Row label="Manufacturer">{product.manufacturer}</Row> : null}
                <Row label="Price">On quotation</Row>
              </dl>

              <div className="mt-8">
                <AddToQuoteWithQuantity
                  product={{
                    id: product.id,
                    name: product.name,
                    slug: product.slug,
                    productCode: product.productCode,
                    imagePath: product.images[0]?.path ?? null,
                  }}
                />
              </div>

              <ul className="mt-8 space-y-2.5 rounded-lg bg-steel p-5 text-[0.9375rem] text-ink">
                {ASSURANCES.map((item) => (
                  <li key={item} className="flex gap-3">
                    <Check className="mt-0.5 size-4 shrink-0 text-cyan-700" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <ProductInformation product={product} />

      <Suspense fallback={null}>
        <RelatedProducts product={product} />
      </Suspense>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-4 py-3">
      <dt className="text-slate-text">{label}</dt>
      <dd className="font-medium text-ink">{children}</dd>
    </div>
  );
}

function ProductInformation({ product }: { product: ProductDetail }) {
  const hasSpecs = product.specifications.length > 0;
  if (!product.description && !hasSpecs) return null;

  return (
    <section className="border-t border-line bg-steel py-16 lg:py-24">
      <div className="container-page grid gap-14 lg:grid-cols-2 lg:gap-24">
        {product.description ? (
          <div>
            <h2 className="text-h3">About this product</h2>
            <div className="measure mt-5 space-y-4 leading-relaxed whitespace-pre-line text-slate-text">{product.description}</div>
          </div>
        ) : null}
        {hasSpecs ? (
          <div>
            <h2 className="text-h3">Key details</h2>
            <table className="mt-5 w-full border-t-2 border-navy-800 text-[0.9375rem]">
              <caption className="sr-only">Specifications for {product.name}</caption>
              <tbody className="divide-y divide-line">
                {product.specifications.map((spec) => (
                  <tr key={`${spec.label}-${spec.value}`}>
                    <th scope="row" className="w-2/5 py-3.5 pr-4 text-left font-normal text-slate-text">
                      {spec.label}
                    </th>
                    <td className="py-3.5 font-medium text-ink">{spec.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </section>
  );
}

async function RelatedProducts({ product }: { product: ProductDetail }) {
  const related = await getRelatedProducts(product, 4);
  if (related.length === 0) return null;
  return (
    <section className="py-16 lg:py-24">
      <div className="container-page">
        <h2 className="text-h2">You may also like</h2>
        <div className="mt-10">
          <ProductGrid products={related} />
        </div>
      </div>
    </section>
  );
}

function ProductSkeleton() {
  return (
    <div className="container-page grid gap-10 py-12 lg:grid-cols-2" aria-busy="true">
      <span className="sr-only">Loading product…</span>
      <div className="aspect-square animate-pulse rounded-lg bg-steel" />
      <div className="space-y-4">
        <div className="h-4 w-32 animate-pulse rounded bg-steel-2" />
        <div className="h-10 w-3/4 animate-pulse rounded bg-steel-2" />
        <div className="h-24 animate-pulse rounded bg-steel" />
        <div className="h-12 animate-pulse rounded bg-steel" />
      </div>
    </div>
  );
}

