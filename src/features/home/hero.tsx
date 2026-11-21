import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Download } from "lucide-react";
import { TrustMarks } from "@/components/shared/cert-marks";
import { getSiteContent } from "@/content/get-content";
import heroImage from "../../../public/images/hero-surgeon.webp";

/**
 * Homepage hero. The photo is the background; a short white wash keeps the
 * text readable on the left; the certification card sits inside the hero's
 * lower edge so the first screen reads as one composition.
 * To replace the photo, overwrite public/images/hero-surgeon.webp.
 */
export async function Hero() {
  const { hero: HERO } = await getSiteContent();
  return (
    <section className="relative -mt-[5rem] flex flex-col overflow-hidden bg-white">
      {/* Desktop: the photo area keeps the banner shape (1672x941), so the whole photo shows. */}
      <div className="relative flex flex-col pt-[5rem] lg:aspect-[1672/941] lg:max-h-[68rem] lg:pb-16">
        {/* Photo */}
        <div className="relative h-72 sm:h-96 lg:absolute lg:inset-0 lg:h-auto">
          <Image
            src={heroImage}
            alt="Surgeon in a white coat in an operating theatre, beside a tray of stainless steel surgical instruments"
            fill
            priority
            placeholder="blur"
            sizes="100vw"
            quality={85}
            className="object-cover object-[72%_center] lg:object-[center_35%]"
          />
          {/* Mobile: fade the photo into the page */}
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent lg:hidden"
          />
          {/* Desktop: the whole banner shows; a light wash keeps the text readable */}
          <div
            aria-hidden
            className="absolute inset-0 hidden bg-[linear-gradient(90deg,rgb(255_255_255/0.78)_0%,rgb(255_255_255/0.6)_30%,rgb(255_255_255/0.15)_52%,rgb(255_255_255/0)_62%)] lg:block"
          />
        </div>

        {/* Copy */}
        <div className="container-page relative flex flex-1 items-center">
          <div className="max-w-[46rem] pt-6 pb-12 lg:max-w-[40rem] lg:pt-12 lg:pb-8">
            <p className="inline-flex w-fit items-center gap-2.5 rounded-full bg-navy-800 px-4 py-2 text-sm font-semibold text-white">
              <span aria-hidden className="size-2 rounded-full bg-cyan-500" />
              {HERO.kicker}
            </p>
            <h1 className="mt-6 text-[length:clamp(2.75rem,1.1rem+3.6vw,4.75rem)] leading-[0.98] font-extrabold tracking-[-0.035em]">
              <span className="block text-navy-800">{HERO.titleLine1}</span>
              <span className="block text-cyan-500">{HERO.titleLine2}</span>
            </h1>
            <p className="mt-6 max-w-[34rem] text-[length:clamp(1.0625rem,0.95rem+0.4vw,1.3125rem)] leading-relaxed text-navy-800/85">
              {HERO.lead}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/quote"
                className="inline-flex h-14 items-center gap-2.5 rounded-full bg-navy-800 px-8 text-base font-semibold text-white shadow-[0_16px_32px_-14px_rgb(3_40_106/0.65)] transition-colors hover:bg-navy-950"
              >
                Request a Quote{" "}
                <ArrowRight className="size-[1.125rem]" aria-hidden />
              </Link>
              <Link
                href="/catalogue"
                className="inline-flex h-14 items-center gap-2.5 rounded-full border-2 border-navy-800 bg-white px-8 text-base font-semibold text-navy-800 transition-colors hover:bg-steel"
              >
                Request Catalogue{" "}
                <Download className="size-[1.125rem]" aria-hidden />
              </Link>
            </div>
            <ul className="mt-8 flex max-w-[34rem] flex-wrap gap-x-8 gap-y-3 text-base font-medium text-navy-800">
              {HERO.points.map((point) => (
                <li key={point} className="flex items-center gap-2.5">
                  <span className="grid size-6 place-items-center rounded-full bg-cyan-500 text-white">
                    <Check className="size-3.5" strokeWidth={3} aria-hidden />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Certification card, overlapping the photo edge */}
      <div className="container-page relative z-10 pb-8 lg:-mt-14 lg:pb-10">
        <div className="flex flex-col gap-6 rounded-2xl border border-[#e3ebf5] bg-white px-6 py-7 shadow-[0_24px_60px_-30px_rgb(2_35_94/0.45)] lg:flex-row lg:items-center lg:gap-10 lg:px-10">
          <div className="shrink-0 lg:w-56">
            <p className="text-base font-bold text-navy-800">
              Certified quality
            </p>
            <p className="mt-1 text-sm leading-snug text-slate-text">
              Standards our production follows
            </p>
          </div>
          <span aria-hidden className="hidden h-14 w-px bg-line lg:block" />
          <TrustMarks className="flex-1 lg:justify-between" />
        </div>
      </div>
    </section>
  );
}
