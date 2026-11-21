import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Boxes, Handshake, ShieldCheck } from "lucide-react";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { getSiteContent } from "@/content/get-content";
import { CertifiedSection } from "@/features/home/home-sections";
import { ManufacturingProcess } from "@/features/home/manufacturing-process";
import facilityImage from "../../../../public/images/about-facility.webp";

export const metadata: Metadata = {
  title: "About",
  description:
    "Founded in 2010 in Sialkot, Pakistan, Optimed Surgical manufactures and supplies medical, surgical and dental instruments for international markets.",
  alternates: { canonical: "/about" },
};

const PILLAR_ICONS = [Boxes, ShieldCheck, Handshake];
const sectionTitle = "text-[length:clamp(2.25rem,1.6rem+2vw,3.25rem)] leading-[1.08]";

export default async function AboutPage() {
  const content = await getSiteContent();
  const ABOUT = content.aboutPage;
  return (
    <>
      {/* Intro */}
      <section className="bg-white">
        <div className="container-page pt-8 pb-20 lg:pt-10 lg:pb-28">
          <Breadcrumbs items={[{ label: "About" }]} />
          <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:gap-16">
            <div>
              <p className="flex items-center gap-4 text-[0.8125rem] font-bold tracking-[0.08em] text-cyan-700 uppercase">
                About us
                <span aria-hidden className="h-px w-16 bg-cyan-500/60" />
              </p>
              <h1 className="mt-5 text-[length:clamp(2.5rem,1.6rem+2.8vw,4rem)] leading-[1.05] tracking-[-0.03em]">
                {ABOUT.title}
              </h1>
              <p className="mt-7 max-w-[34rem] text-xl leading-relaxed text-navy-800/85">{ABOUT.intro}</p>
              <div className="mt-9 flex flex-wrap gap-4">
                <Link
                  href="/catalogue"
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-navy-800 px-7 text-[0.9375rem] font-semibold text-white hover:bg-navy-950"
                >
                  Request the catalogue <ArrowRight className="size-4" aria-hidden />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex h-12 items-center gap-2 rounded-full border-[1.5px] border-navy-800 px-7 text-[0.9375rem] font-semibold text-navy-800 hover:bg-steel"
                >
                  Contact our team
                </Link>
              </div>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
              <Image
                src={facilityImage}
                alt="Optimed Surgical facility"
                fill
                priority
                placeholder="blur"
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Story + facts */}
      <section className="bg-steel py-24 lg:py-32">
        <div className="container-page grid gap-14 lg:grid-cols-[1.1fr_1fr] lg:gap-24">
          <div>
            <h2 className={sectionTitle}>Built on craftsmanship and expertise</h2>
            <div className="mt-7 max-w-[38rem] space-y-5 text-lg leading-relaxed text-navy-800/85">
              {ABOUT.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </div>
          <dl className="grid grid-cols-2 self-center border-t-2 border-navy-800">
            {ABOUT.facts.map((fact) => (
              <div key={fact.value} className="border-b border-[#d5deea] py-8 pr-6">
                <dt className="sr-only">{fact.label}</dt>
                <dd>
                  <span className="block text-[length:clamp(1.75rem,1.4rem+1vw,2.5rem)] leading-none font-bold tracking-tight text-navy-800">
                    {fact.value}
                  </span>
                  <span className="mt-3 block text-[0.9375rem] leading-snug text-slate-text">{fact.label}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Pillars */}
      <section className="bg-white py-24 lg:py-32">
        <div className="container-page">
          <h2 className={`${sectionTitle} max-w-[40rem]`}>What sets our work apart</h2>
          <ul className="mt-14 grid gap-6 lg:grid-cols-3">
            {ABOUT.pillars.map((pillar, index) => {
              const Icon = PILLAR_ICONS[index];
              return (
                <li key={pillar.title} className="rounded-2xl border border-[#dfe7f2] bg-white p-8 lg:p-10">
                  <span className="grid size-14 place-items-center rounded-full bg-cyan-50 text-navy-800">
                    <Icon className="size-6" strokeWidth={1.6} aria-hidden />
                  </span>
                  <h3 className="mt-8 text-xl font-semibold text-navy-800">{pillar.title}</h3>
                  <p className="mt-3 leading-relaxed text-slate-text">{pillar.text}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <ManufacturingProcess tone="steel" />

      {/* Promise */}
      <section className="bg-white py-24 lg:py-32">
        <div className="container-page max-w-4xl text-center">
          <p className="text-[length:clamp(2.25rem,1.4rem+2.8vw,3.75rem)] leading-tight font-bold tracking-[-0.03em] text-navy-800">
            {content.footer.tagline}
          </p>
          <span aria-hidden className="mx-auto mt-7 block h-1 w-20 rounded-full bg-orange-500" />
          <p className="mx-auto mt-8 max-w-[44rem] text-lg leading-relaxed text-navy-800/85">{ABOUT.closing}</p>
        </div>
      </section>

      <CertifiedSection />
    </>
  );
}
