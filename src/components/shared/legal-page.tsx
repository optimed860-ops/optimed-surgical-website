import { Info } from "lucide-react";
import { PageHero } from "./page-hero";

export type LegalSection = { heading: string; body: (string | string[])[] };

export function LegalPage({ title, crumb, intro, sections }: { title: string; crumb: string; intro: string; sections: LegalSection[] }) {
  return (
    <>
      <PageHero crumbs={[{ label: crumb }]} title={title} lead={intro} />
      <div className="container-page grid gap-12 py-14 lg:grid-cols-[16rem_1fr] lg:py-20">
        <nav aria-label="On this page" className="hidden lg:sticky lg:top-28 lg:block lg:self-start">
          <h2 className="mb-4 font-sans text-base font-semibold text-ink [font-stretch:100%]">On this page</h2>
          <ol className="space-y-2 text-sm">
            {sections.map((section, i) => (
              <li key={section.heading}>
                <a href={`#s${i + 1}`} className="text-slate-text hover:text-navy-800">
                  {section.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <article className="max-w-3xl">
          {/* pendingClientReview: replace with the final, legally reviewed text before launch. */}
          <p className="mb-10 flex items-start gap-3 rounded-md border border-line bg-surface p-4 text-sm text-slate-text">
            <Info className="mt-0.5 size-4 shrink-0 text-medical-700" aria-hidden />
            This document is a working draft and is pending legal review.
          </p>
          {sections.map((section, i) => (
            <section key={section.heading} id={`s${i + 1}`} className="scroll-mt-28 border-t border-line py-8 first-of-type:border-t-0 first-of-type:pt-0">
              <h2 className="text-h3">{section.heading}</h2>
              <div className="mt-4 space-y-4 leading-relaxed text-slate-text">
                {section.body.map((block, j) =>
                  Array.isArray(block) ? (
                    <ul key={j} className="list-disc space-y-1.5 pl-5 marker:text-medical-500">
                      {block.map((li) => (
                        <li key={li}>{li}</li>
                      ))}
                    </ul>
                  ) : (
                    <p key={j}>{block}</p>
                  ),
                )}
              </div>
            </section>
          ))}
        </article>
      </div>
    </>
  );
}
