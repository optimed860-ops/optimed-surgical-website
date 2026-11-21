import Link from "next/link";
import { PageHero } from "@/components/shared/page-hero";
import type { Crumb } from "@/components/shared/breadcrumbs";
import { Button } from "@/components/ui/button";

/** Listing frame: page header with search, filter column, results, catalogue prompt. */
export function CatalogueLayout({
  crumbs,
  title,
  lead,
  search,
  sidebar,
  children,
}: {
  crumbs: Crumb[];
  title: string;
  lead?: string | null;
  search: React.ReactNode;
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <>
      <PageHero crumbs={crumbs} title={title} lead={lead}>
        <div className="w-full lg:w-[26rem]">{search}</div>
      </PageHero>
      <div className="container-page grid gap-10 py-12 lg:grid-cols-[14rem_1fr] lg:gap-14 lg:py-16">
        <aside className="lg:sticky lg:top-28 lg:self-start">{sidebar}</aside>
        <div className="min-w-0">{children}</div>
      </div>
      <section className="bg-navy-800 text-white">
        <div className="container-page flex flex-col gap-8 py-16 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <h2 className="text-h2 text-white">Looking for something not listed?</h2>
            <p className="mt-3 text-lead text-white/75">
              This is a selection of our range. Request the catalogue, or send your item list for a quote.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="xl" className="bg-cyan-500 text-navy-950 hover:bg-cyan-300">
              <Link href="/catalogue">Request the catalogue</Link>
            </Button>
            <Button asChild size="xl" variant="outline-inverse">
              <Link href="/quote">Request a quote</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
