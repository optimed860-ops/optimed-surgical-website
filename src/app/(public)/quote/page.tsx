import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Check } from "lucide-react";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { getSiteSettings } from "@/features/catalogue/queries";
import { QuoteBuilder } from "@/features/quote/components/quote-builder";
import { FaqList } from "@/features/home/sections";
import { getSiteContent } from "@/content/get-content";
import { CONTACT } from "@/content/site";

export const metadata: Metadata = {
  title: "Request a quote",
  description:
    "Send Optimed Surgical in Sialkot, Pakistan your product list with quantities and receive a written quotation for surgical, dental and medical instruments.",
  alternates: { canonical: "/quote" },
};

const TOPICS: Record<string, string> = {
  certificates: "Please send me your current certificates and registrations.",
  "private-label": "I would like to discuss private-label / custom manufacturing. Our requirements:",
};

export default async function QuotePage({ searchParams }: PageProps<"/quote">) {
  const [settings, content] = await Promise.all([getSiteSettings(), getSiteContent()]);
  const { contactPage: CONTACT_PAGE, quotePage: QUOTE_PAGE, faq: FAQ } = content;
  const DISCIPLINES = content.whatWeMake.disciplines;
  const email = settings.contactEmail ?? CONTACT.email;
  const phone = settings.phoneNumber ?? CONTACT.phone;
  const tel = phone.replace(/[^\d+]/g, "");

  return (
    <>
      {/* Intro */}
      <section className="bg-white pt-8 pb-12 lg:pt-10 lg:pb-14">
        <div className="mx-auto w-full max-w-[66rem] px-5 sm:px-8">
          <Breadcrumbs items={[{ label: "Request a quote" }]} />
          <div className="mt-10 text-center">
            <h1 className="text-[length:clamp(2rem,1.5rem+1.8vw,3rem)] leading-tight">{QUOTE_PAGE.title}</h1>
          </div>
          <div className="mx-auto mt-6 max-w-[46rem] space-y-4 text-[1.0625rem] leading-relaxed text-navy-800/85">
            {CONTACT_PAGE.intro.map((p) => (
              <p key={p}>{p}</p>
            ))}
            <p className="font-medium text-navy-800">
              Prefer email? Send your list to{" "}
              <a href={`mailto:${email}`} className="text-cyan-700 underline underline-offset-4">
                {email}
              </a>{" "}
              or call{" "}
              <a href={`tel:${tel}`} className="text-cyan-700 underline underline-offset-4">
                {phone}
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      {/* Sidebar + form */}
      <section className="bg-white pb-20">
        <div className="mx-auto grid w-full max-w-[66rem] gap-8 px-5 sm:px-8 lg:grid-cols-[19rem_1fr] lg:gap-10">
          <aside className="self-start rounded-xl border border-[#dfe7f2] bg-steel p-6 lg:sticky lg:top-28">
            <h2 className="text-lg leading-snug font-bold tracking-normal text-navy-800">Why buyers order from us</h2>
            <ul className="mt-5 space-y-3 text-[0.9375rem] text-ink">
              {CONTACT_PAGE.why.map((item) => (
                <li key={item} className="flex gap-2.5">
                  <Check className="mt-0.5 size-4 shrink-0 text-cyan-700" strokeWidth={2.5} aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm leading-relaxed text-slate-text">
              Sending a tender document or drawing? Email it to{" "}
              <a href={`mailto:${email}`} className="text-navy-800 underline underline-offset-2">
                {email}
              </a>{" "}
              or call{" "}
              <a href={`tel:${tel}`} className="text-navy-800 underline underline-offset-2">
                {phone}
              </a>
              .
            </p>
          </aside>

          <div className="rounded-xl border border-[#dfe7f2] bg-white p-6 sm:p-8">
            <Suspense fallback={<QuoteBuilder buyerTypes={CONTACT_PAGE.buyerTypes} payment={CONTACT_PAGE.payment} />}>
              <FormWithTopic searchParams={searchParams} buyerTypes={CONTACT_PAGE.buyerTypes} payment={CONTACT_PAGE.payment} />
            </Suspense>
          </div>
        </div>
      </section>

      {/* Who we supply + how it works */}
      <section className="border-t border-line bg-white py-16 lg:py-20">
        <div className="mx-auto grid w-full max-w-[66rem] gap-12 px-5 sm:px-8 md:grid-cols-2 md:gap-16">
          <div>
            <h2 className="text-xl font-bold tracking-normal">Who we supply</h2>
            <ul className="mt-5 space-y-3 text-[0.9375rem] text-ink">
              {QUOTE_PAGE.whoWeSupply.map((item) => (
                <li key={item} className="flex gap-2.5">
                  <Check className="mt-0.5 size-4 shrink-0 text-cyan-700" strokeWidth={2.5} aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-normal">How a bulk quote works</h2>
            <ol className="mt-5 space-y-4 text-[0.9375rem] text-ink">
              {QUOTE_PAGE.steps.map((step, index) => (
                <li key={step.title} className="flex gap-3">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-navy-800 text-sm font-bold text-white">
                    {index + 1}
                  </span>
                  <span>
                    <span className="font-semibold text-navy-800">{step.title}:</span> {step.text}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Browse before you contact */}
      <section className="border-t border-line bg-white py-14">
        <div className="mx-auto w-full max-w-[66rem] px-5 sm:px-8">
          <h2 className="text-xl font-bold tracking-normal">Browse our instrument range</h2>
          <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-3 text-[0.9375rem]">
            {DISCIPLINES.map((name) => (
              <li key={name}>
                <Link
                  href={`/catalogue?interest=${encodeURIComponent(name)}`}
                  className="text-cyan-700 underline decoration-cyan-700/40 underline-offset-4 hover:decoration-cyan-700"
                >
                  {name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-line bg-white py-14 lg:py-20">
        <div className="mx-auto w-full max-w-[66rem] px-5 sm:px-8">
          <h2 className="text-xl font-bold tracking-normal">Ordering and quote questions</h2>
          <div className="mt-6">
            <FaqList items={FAQ} />
          </div>
        </div>
      </section>
    </>
  );
}

async function FormWithTopic({
  searchParams,
  buyerTypes,
  payment,
}: {
  searchParams: PageProps<"/quote">["searchParams"];
  buyerTypes: string[];
  payment: string[];
}) {
  const { topic } = await searchParams;
  const key = Array.isArray(topic) ? topic[0] : topic;
  return <QuoteBuilder buyerTypes={buyerTypes} payment={payment} defaultNotes={key ? TOPICS[key] : undefined} />;
}
