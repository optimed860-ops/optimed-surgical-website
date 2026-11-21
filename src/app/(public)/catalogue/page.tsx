import type { Metadata } from "next";
import { Suspense } from "react";
import { Check } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { InquiryForm } from "@/features/inquiries/inquiry-form";
import { getSiteContent } from "@/content/get-content";

export const metadata: Metadata = {
  title: "Catalogue",
  description: "Request the Optimed instrument catalogue. Tell us which disciplines or products you need and we'll send the matching catalogue.",
  alternates: { canonical: "/catalogue" },
};

export default async function CataloguePage({ searchParams }: PageProps<"/catalogue">) {
  const content = await getSiteContent();
  const CATALOGUE_PAGE = content.cataloguePage;
  const CERTIFICATIONS = content.certificates.items;
  return (
    <>
      <PageHero crumbs={[{ label: "Catalogue" }]} title={CATALOGUE_PAGE.title} lead={CATALOGUE_PAGE.lead} />
      <section className="py-16 lg:py-24">
        <div className="container-page grid gap-14 lg:grid-cols-[1fr_20rem] lg:gap-20">
          <div className="max-w-3xl">
            <Suspense fallback={<InquiryForm type="catalogue" />}>
              <CatalogueForm searchParams={searchParams} />
            </Suspense>
          </div>
          <aside className="lg:border-l-2 lg:border-cyan-500 lg:pl-8">
            <h2 className="text-h3">What you’ll receive</h2>
            <ul className="mt-6 space-y-4 text-[0.9375rem] text-ink">
              {CATALOGUE_PAGE.receive.map((item) => (
                <li key={item} className="flex gap-3">
                  <Check className="mt-1 size-4 shrink-0 text-cyan-700" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-10 border-t border-line pt-8">
              <h3 className="text-base font-semibold text-ink">Quality systems</h3>
              <ul className="mt-4 flex flex-wrap gap-2">
                {CERTIFICATIONS.map((cert) => (
                  <li key={`${cert.mark}-${cert.name}`} className="rounded border border-line px-2.5 py-1 text-xs font-bold text-navy-800">
                    {cert.mark}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}

async function CatalogueForm({ searchParams }: { searchParams: PageProps<"/catalogue">["searchParams"] }) {
  const { interest } = await searchParams;
  const value = Array.isArray(interest) ? interest[0] : interest;
  return <InquiryForm type="catalogue" defaultInterest={value} />;
}
