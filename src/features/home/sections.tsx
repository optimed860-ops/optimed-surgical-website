import Link from "next/link";
import { ArrowUpRight, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductVisual } from "@/components/shared/product-visual";
import { CategoryIcon } from "@/components/shared/category-icon";
import { ProductGrid } from "@/features/catalogue/components/product-card";
import type { CategorySummary, ProductSummary } from "@/features/catalogue/types";
import { ABOUT, CERTIFICATES_SECTION, CERTIFICATIONS, FAQ, FINAL_CTA, PROCESS, WHAT_WE_MAKE } from "@/content/site";
import { FaqJsonLd } from "@/components/shared/json-ld";
import { CONTENT_ICONS } from "./icons";

// ── About ─────────────────────────────────────────────────────────────────────
export function AboutSection({ withLink = true }: { withLink?: boolean }) {
  return (
    <section className="py-section">
      <div className="container-page grid gap-14 lg:grid-cols-[1.1fr_1fr] lg:gap-24">
        <div>
          <h2 className="text-h2">{ABOUT.title}</h2>
          <div className="measure mt-7 space-y-5 text-lead text-slate-text">
            {ABOUT.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          {withLink ? (
            <Link href="/about" className="mt-8 inline-block font-semibold text-navy-800 underline decoration-cyan-500 decoration-2 underline-offset-[6px] hover:decoration-navy-800">
              More about Optimed
            </Link>
          ) : null}
        </div>
        <dl className="grid grid-cols-2 self-end border-t-2 border-navy-800">
          {ABOUT.facts.map((fact) => (
            <div key={fact.value} className="border-b border-line py-7 pr-4 odd:pr-6">
              <dt className="sr-only">{fact.label}</dt>
              <dd>
                <span className="font-wide block text-[1.75rem] leading-none font-bold text-navy-800 sm:text-[2rem]">{fact.value}</span>
                <span className="mt-3 block text-[0.9375rem] leading-snug text-slate-text">{fact.label}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

// ── What we make (category index) ────────────────────────────────────────────
export function WhatWeMake({ categories }: { categories: CategorySummary[] }) {
  if (categories.length === 0) return null;
  return (
    <section className="bg-steel py-section">
      <div className="container-page">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-h2">{WHAT_WE_MAKE.title}</h2>
            <p className="measure mt-5 text-lead text-slate-text">{WHAT_WE_MAKE.lead}</p>
          </div>
          <Link href="/products" className="shrink-0 font-semibold text-navy-800 underline decoration-cyan-500 decoration-2 underline-offset-[6px] hover:decoration-navy-800">
            View all products
          </Link>
        </div>
        <ul className="mt-14 border-t-2 border-navy-800">
          {categories.map((category) => (
            <li key={category.id} className="border-b border-line">
              <CategoryRow category={category} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function CategoryRow({ category }: { category: CategorySummary }) {
  return (
    <Link
      href={`/categories/${category.slug}`}
      className="group grid grid-cols-[auto_1fr_auto] items-center gap-5 py-7 transition-colors sm:gap-8 md:grid-cols-[5.5rem_1fr_14rem_auto]"
    >
      {category.imagePath ? (
        <ProductVisual
          imagePath={category.imagePath}
          bucket="category-images"
          alt=""
          hints={[category.slug]}
          sizes="88px"
          className="size-16 rounded-md md:size-[5.5rem]"
        />
      ) : (
        <span className="grid size-16 place-items-center rounded-md bg-white text-navy-800 transition-colors group-hover:bg-navy-800 group-hover:text-white md:size-[5.5rem]">
          <CategoryIcon hints={[category.slug, category.name]} className="size-7" strokeWidth={1.5} aria-hidden />
        </span>
      )}
      <span className="min-w-0">
        <span className="font-wide block text-xl leading-tight font-bold text-navy-800 sm:text-2xl">{category.name}</span>
        {category.description ? (
          <span className="mt-1.5 line-clamp-2 block text-[0.9375rem] text-slate-text md:hidden">{category.description}</span>
        ) : null}
      </span>
      <span className="hidden text-[0.9375rem] leading-snug text-slate-text md:line-clamp-2">{category.description}</span>
      <span className="flex items-center gap-3 text-sm text-slate-text">
        <span className="hidden sm:inline">
          {category.productCount} {category.productCount === 1 ? "product" : "products"}
        </span>
        <ArrowUpRight
          className="size-6 text-navy-800 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
          aria-hidden
        />
      </span>
    </Link>
  );
}

// ── Featured products ────────────────────────────────────────────────────────
export function FeaturedProducts({ products }: { products: ProductSummary[] }) {
  if (products.length === 0) return null;
  return (
    <section className="py-section">
      <div className="container-page">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-h2">Selected products</h2>
            <p className="measure mt-5 text-lead text-slate-text">
              Add products to your quote list and set the quantity you need.
            </p>
          </div>
          <Link href="/catalogue" className="shrink-0 font-semibold text-navy-800 underline decoration-cyan-500 decoration-2 underline-offset-[6px] hover:decoration-navy-800">
            Get the full catalogue
          </Link>
        </div>
        <div className="mt-14">
          <ProductGrid products={products} />
        </div>
      </div>
    </section>
  );
}

// ── How it works ─────────────────────────────────────────────────────────────
function Hexagon({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative grid size-[7.5rem] place-items-center">
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" aria-hidden>
        <polygon
          points="50,3 91,26.5 91,73.5 50,97 9,73.5 9,26.5"
          className="fill-white stroke-navy-800 transition-[fill] group-hover:fill-cyan-50"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
      <span className="relative text-navy-800">{children}</span>
    </span>
  );
}

export function ProcessSection() {
  return (
    <section className="border-t border-line py-section">
      <div className="container-page">
        <h2 className="text-h2">How it works</h2>
        <p className="measure mt-5 text-lead text-slate-text">
          From your first list to dispatch, every order follows the same five steps.
        </p>
        <ol className="mt-16 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-5">
          {PROCESS.map((step, index) => {
            const Icon = CONTENT_ICONS[step.icon];
            return (
              <li key={step.title} className="group relative">
                <Hexagon>
                  <Icon className="size-9" strokeWidth={1.4} aria-hidden />
                </Hexagon>
                {index < PROCESS.length - 1 ? (
                  <ChevronRight
                    className="absolute top-[3.25rem] right-0 hidden size-5 text-slate-text/60 lg:block"
                    aria-hidden
                  />
                ) : null}
                <p className="mt-6 text-sm font-semibold text-cyan-700">Step {index + 1}</p>
                <h3 className="mt-1 text-lg">{step.title}</h3>
                <p className="mt-2 pr-4 text-[0.9375rem] leading-relaxed text-slate-text">{step.text}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

// ── Certificates ─────────────────────────────────────────────────────────────
export function CertificatesSection() {
  return (
    <section className="bg-navy-800 py-section text-white">
      <div className="container-page grid gap-14 lg:grid-cols-[1fr_1.15fr] lg:gap-24">
        <div className="lg:self-center">
          <h2 className="text-h2 text-white">{CERTIFICATES_SECTION.title}</h2>
          <p className="measure mt-6 text-lead text-white/75">{CERTIFICATES_SECTION.text}</p>
          <Button asChild size="xl" className="mt-10 bg-cyan-500 text-navy-950 hover:bg-cyan-300">
            <Link href="/contact?topic=certificates">Request certificates</Link>
          </Button>
        </div>
        <div>
          <ul className="border-t border-white/20">
            {CERTIFICATIONS.map((cert) => (
              <li key={cert.mark} className="flex flex-col gap-1 border-b border-white/20 py-5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8">
                <span className="font-wide text-lg font-bold text-white">{cert.name}</span>
                <span className="text-[0.9375rem] text-white/70 sm:text-right">
                  {cert.number ? `${cert.detail}, no. ${cert.number}` : cert.detail}
                </span>
              </li>
            ))}
          </ul>
          <Link href="/certifications" className="mt-6 inline-block font-semibold text-white underline decoration-cyan-500 decoration-2 underline-offset-[6px] hover:decoration-white">
            All certificates and documents
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── FAQ ──────────────────────────────────────────────────────────────────────
export function FaqSection({ items = FAQ, title = "Frequently asked questions" }: { items?: readonly { q: string; a: string }[]; title?: string }) {
  return (
    <section className="py-section">
      <div className="container-page grid gap-12 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
        <div>
          <h2 className="text-h2">{title}</h2>
          <p className="mt-5 text-lead text-slate-text">
            Can&apos;t find your answer?{" "}
            <Link href="/contact" className="font-semibold text-navy-800 underline decoration-cyan-500 decoration-2 underline-offset-4">
              Send us a message
            </Link>
            .
          </p>
        </div>
        <FaqList items={items} />
      </div>
    </section>
  );
}

export function FaqList({ items }: { items: readonly { q: string; a: string }[] }) {
  return (
    <div className="border-t-2 border-navy-800">
      {items.map((item) => (
        <details key={item.q} className="faq-item group border-b border-line [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-lg font-semibold text-ink hover:text-navy-800">
            {item.q}
            <Plus className="size-5 shrink-0 text-navy-800 transition-transform duration-200 group-open:rotate-45" aria-hidden />
          </summary>
          <p className="faq-answer measure -mt-2 pb-7 leading-relaxed text-slate-text">{item.a}</p>
        </details>
      ))}
      <FaqJsonLd items={items} />
    </div>
  );
}

// ── Final call to action ─────────────────────────────────────────────────────
export function FinalCta() {
  return (
    <section className="border-t border-line bg-steel">
      <div className="container-page flex flex-col gap-10 py-20 lg:flex-row lg:items-center lg:justify-between lg:py-24">
        <div className="max-w-2xl">
          <h2 className="text-h2">{FINAL_CTA.title}</h2>
          <p className="mt-4 text-lead text-slate-text">{FINAL_CTA.text}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="xl">
            <Link href="/quote">Request a quote</Link>
          </Button>
          <Button asChild size="xl" variant="outline" className="border-navy-800/30 bg-white text-navy-800 hover:border-navy-800">
            <Link href="/catalogue">Request the catalogue</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
