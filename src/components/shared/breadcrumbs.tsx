import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type Crumb = { label: string; href?: string };

/** Visible breadcrumb trail plus schema.org BreadcrumbList structured data. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all: Crumb[] = [{ label: "Home", href: "/" }, ...items];
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: all.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.label,
      ...(crumb.href ? { item: `${site}${crumb.href}` } : {}),
    })),
  };

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-slate-text">
        {all.map((crumb, index) => (
          <li key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
            {index > 0 ? <ChevronRight className="size-3.5 text-slate-text/60" aria-hidden /> : null}
            {crumb.href && index < all.length - 1 ? (
              <Link href={crumb.href} className="hover:text-navy-800 hover:underline">
                {crumb.label}
              </Link>
            ) : (
              <span aria-current="page" className="font-medium text-ink">
                {crumb.label}
              </span>
            )}
          </li>
        ))}
      </ol>
      <script
        type="application/ld+json"
        // Safe: built only from our own data, with "<" escaped.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </nav>
  );
}
