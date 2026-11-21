import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Stethoscope,
  FileText,
  Globe2,
  Headset,
  MessagesSquare,
  Plus,
  ShieldCheck,
  Tag,
  type LucideIcon,
} from "lucide-react";
import { getSiteContent } from "@/content/get-content";
import {
  Cardiology,
  Dermatology,
  EarNoseThroat,
  Electricity,
  Eye,
  GeneralSurgery,
  Gynecology,
  Laryngoscope,
  Maxillofacial,
  NeuroSurgery,
  Orthopaedics,
  SurgicalSterilization,
  Syringe,
  Tooth,
  type HealthIcon,
} from "@healthicons/react";
import { CeMark, EuFlag, FdaMark, IsoMark } from "@/components/shared/cert-marks";
import { FaqJsonLd } from "@/components/shared/json-ld";
import facilityImage from "../../../public/images/about-facility.webp";

const FEATURE_ICONS: Record<string, LucideIcon> = { shield: ShieldCheck, globe: Globe2, headset: Headset, tag: Tag };
const STEP_ICONS: Record<string, LucideIcon> = { book: BookOpen, chat: MessagesSquare, file: FileText };

const sectionTitle = "text-[length:clamp(2.25rem,1.6rem+2vw,3.25rem)] leading-[1.08]";
const pill =
  "inline-flex h-12 items-center gap-2 rounded-full px-7 text-[0.9375rem] font-semibold transition-colors";

// ── About ─────────────────────────────────────────────────────────────────────
export async function HomeAbout() {
  const { homeAbout: HOME_ABOUT } = await getSiteContent();
  return (
    <section className="grid lg:grid-cols-2">
      <div className="relative min-h-72 sm:min-h-96 lg:min-h-[34rem]">
        <Image
          src={facilityImage}
          alt="Optimed facility exterior"
          fill
          placeholder="blur"
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
      <div className="flex items-center bg-white">
        <div className="w-full px-5 py-16 sm:px-10 lg:max-w-[40rem] lg:px-16 lg:py-24">
          <p className="flex items-center gap-4 text-[0.8125rem] font-bold tracking-[0.08em] text-cyan-700 uppercase">
            {HOME_ABOUT.kicker}
            <span aria-hidden className="h-px w-16 bg-cyan-500/60" />
          </p>
          <h2 className={`mt-5 max-w-[30rem] ${sectionTitle}`}>{HOME_ABOUT.title}</h2>
          <p className="mt-6 max-w-[33rem] text-lg leading-relaxed text-navy-800/85">{HOME_ABOUT.text}</p>
          <Link href="/about" className="mt-6 inline-flex items-center gap-2 font-medium text-cyan-700 hover:underline">
            Read our story <ArrowRight className="size-4" aria-hidden />
          </Link>
          <ul className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-line">
            {HOME_ABOUT.features.map((feature) => {
              const Icon = FEATURE_ICONS[feature.icon] ?? ShieldCheck;
              return (
                <li key={feature.label} className="flex items-center gap-3 sm:px-5 sm:first:pl-0">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-cyan-50">
                    <Icon className="size-6 text-navy-800" strokeWidth={1.6} aria-hidden />
                  </span>
                  <span className="text-[0.9375rem] leading-tight font-medium text-balance text-navy-800">{feature.label}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

// ── What we make ─────────────────────────────────────────────────────────────
/** Medical specialty icons from Healthicons (CC0, healthicons.org). */
const DISCIPLINE_ICONS: Record<string, HealthIcon> = {
  "General surgery": GeneralSurgery,
  "Cardiovascular surgery": Cardiology,
  "ENT surgery": EarNoseThroat,
  Neurosurgery: NeuroSurgery,
  Gynaecology: Gynecology,
  Ophthalmology: Eye,
  "Plastic surgery": Dermatology,
  "Orthopaedic surgery": Orthopaedics,
  Laryngoscopes: Laryngoscope,
  "Liposuction and infiltration": Syringe,
  "Cranio-maxillo-facial (CMF) surgery": Maxillofacial,
  Retractors: SurgicalSterilization,
  "Electrosurgery instruments": Electricity,
  "Dental surgery": Tooth,
};

export async function WhatWeMakeDisciplines() {
  const { whatWeMake: WHAT_WE_MAKE } = await getSiteContent();
  const DISCIPLINES = WHAT_WE_MAKE.disciplines;
  return (
    <section className="bg-steel py-24 lg:py-32">
      <div className="container-page">
        <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-16">
          <div>
            <h2 className={sectionTitle}>{WHAT_WE_MAKE.title}</h2>
            <p className="mt-6 max-w-[36rem] text-lg leading-relaxed text-navy-800/85">{WHAT_WE_MAKE.lead}</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
            <Link href="/contact?topic=private-label" className="inline-flex items-center gap-2 font-medium text-cyan-700 hover:underline">
              Need a custom design? <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link href="/catalogue" className={`${pill} bg-navy-800 text-white hover:bg-navy-950`}>
              Request the catalogue <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>

        <ul className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {DISCIPLINES.map((name) => {
            const Icon = DISCIPLINE_ICONS[name];
            return (
              <li key={name}>
                <Link
                  href={`/catalogue?interest=${encodeURIComponent(name)}`}
                  className="group flex h-full flex-col rounded-2xl border border-[#dfe7f2] bg-white p-6 transition-[border-color,box-shadow] hover:border-cyan-500/60 hover:shadow-[0_20px_40px_-28px_rgb(2_35_94/0.45)]"
                >
                  <span className="grid size-16 place-items-center rounded-2xl bg-cyan-50 text-navy-800 transition-colors group-hover:bg-navy-800 group-hover:text-white">
                    {Icon ? <Icon size={36} aria-hidden /> : <Stethoscope className="size-8" strokeWidth={1.5} aria-hidden />}
                  </span>
                  <span className="mt-6 text-lg leading-snug font-semibold text-navy-800">{name}</span>
                  <span className="mt-auto flex items-center gap-1.5 pt-5 text-sm font-medium text-cyan-700">
                    Request catalogue
                    <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
                  </span>
                </Link>
              </li>
            );
          })}
          <li>
            <Link
              href="/contact"
              className="group flex h-full flex-col rounded-2xl border-2 border-dashed border-cyan-500/50 bg-white/60 p-6 transition-colors hover:border-cyan-500 hover:bg-white"
            >
              <span className="grid size-16 place-items-center rounded-2xl bg-cyan-500 text-white">
                <Tag className="size-8" strokeWidth={1.5} aria-hidden />
              </span>
              <span className="mt-6 text-lg leading-snug font-semibold text-navy-800">Private label & custom designs</span>
              <span className="mt-2 text-[0.9375rem] leading-relaxed text-slate-text">Made to your drawings, specifications and branding.</span>
              <span className="mt-auto flex items-center gap-1.5 pt-5 text-sm font-medium text-cyan-700">
                Discuss your project <ArrowRight className="size-4" aria-hidden />
              </span>
            </Link>
          </li>
          <li>
            <Link
              href="/catalogue"
              className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-navy-800 p-6 text-white transition-colors hover:bg-navy-950"
            >
              <span className="text-lg leading-snug font-semibold">Can’t see your speciality?</span>
              <span className="mt-2 text-[0.9375rem] leading-relaxed text-white/75">
                Our full range goes beyond this list. Tell us what you need.
              </span>
              <span className="mt-auto inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-navy-800">
                Request the full catalogue <ArrowRight className="size-4" aria-hidden />
              </span>
            </Link>
          </li>
        </ul>
      </div>
    </section>
  );
}

// ── How it works ─────────────────────────────────────────────────────────────
export async function HowItWorksRow() {
  const { howItWorks: HOW_IT_WORKS } = await getSiteContent();
  return (
    <section className="bg-steel py-24 lg:py-32">
      <div className="container-page">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className={sectionTitle}>{HOW_IT_WORKS.title}</h2>
            <p className="mt-5 text-lg leading-relaxed text-navy-800/85">{HOW_IT_WORKS.text}</p>
          </div>
          <Link href="/catalogue" className={`${pill} w-fit bg-navy-800 text-white hover:bg-navy-950`}>
            Start with the catalogue <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>

        <ol className="mt-16 grid gap-6 lg:grid-cols-3">
          {HOW_IT_WORKS.steps.map((step, index) => {
            const Icon = STEP_ICONS[step.icon] ?? FileText;
            return (
              <li
                key={step.title}
                className="group relative flex flex-col rounded-2xl border border-[#dfe7f2] bg-white p-8 transition-shadow hover:shadow-[0_24px_48px_-28px_rgb(2_35_94/0.35)] lg:p-10"
              >
                <div className="flex items-start justify-between">
                  <span className="text-[3.75rem] leading-none font-bold tracking-tight text-cyan-500">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="grid size-14 place-items-center rounded-full bg-navy-800 text-white transition-colors group-hover:bg-cyan-500">
                    <Icon className="size-6" strokeWidth={1.6} aria-hidden />
                  </span>
                </div>
                <h3 className="mt-10 text-xl leading-snug font-semibold text-navy-800">{step.title}</h3>
                <p className="mt-3 leading-relaxed text-slate-text">{step.text}</p>
                {index < HOW_IT_WORKS.steps.length - 1 ? (
                  <span
                    aria-hidden
                    className="absolute top-1/2 -right-[1.15rem] z-10 hidden size-9 -translate-y-1/2 place-items-center rounded-full border border-[#dfe7f2] bg-white text-cyan-700 lg:grid"
                  >
                    <ArrowRight className="size-4" />
                  </span>
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

// ── Certified ────────────────────────────────────────────────────────────────
function CertLogo({ mark }: { mark: string }) {
  if (mark === "FDA") return <FdaMark className="h-12" />;
  if (mark === "CE") return <CeMark className="h-8" />;
  if (mark === "EU MDR") return <EuFlag className="h-8" />;
  if (mark.startsWith("ISO")) return <IsoMark className="h-10" />;
  return <span className="px-1 text-center text-xs font-bold text-navy-800">{mark}</span>;
}

export async function CertifiedSection() {
  const { certificates: CERTIFICATES_SECTION } = await getSiteContent();
  const rows = CERTIFICATES_SECTION.items;
  return (
    <section className="relative isolate overflow-hidden bg-navy-800 text-white">
      <div className="container-page grid gap-14 py-24 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-20 lg:py-32">
        <div>
          <p className="flex items-center gap-4 text-[0.8125rem] font-bold tracking-[0.08em] text-cyan-300 uppercase">
            Quality & compliance
            <span aria-hidden className="h-px w-16 bg-cyan-300/50" />
          </p>
          <h2 className={`mt-5 ${sectionTitle} text-white`}>{CERTIFICATES_SECTION.title}</h2>
          <p className="mt-6 max-w-[30rem] text-lg leading-relaxed text-white/80">{CERTIFICATES_SECTION.text}</p>
          <div className="mt-10 flex flex-wrap items-center gap-6">
            <Link href="/contact?topic=certificates" className={`${pill} bg-orange-600 text-white hover:bg-orange-500`}>
              Request certificates <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link href="/certifications" className="inline-flex items-center gap-2 font-medium text-white/85 hover:text-white hover:underline">
              View documents <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>

        <ul className="grid gap-4 sm:grid-cols-2">
          {rows.map((cert) => (
            <li
              key={`${cert.mark}-${cert.name}`}
              className="group flex items-center gap-5 rounded-2xl border border-white/10 bg-white/[0.06] p-5 transition-colors hover:border-white/25 hover:bg-white/[0.1]"
            >
              <span className="grid h-16 w-20 shrink-0 place-items-center rounded-xl bg-white">
                <CertLogo mark={cert.mark} />
              </span>
              <span className="min-w-0">
                <span className="block text-lg font-bold text-white">{cert.name}</span>
                <span className="mt-1 block text-[0.9375rem] leading-snug text-white/70">
                  {cert.number ? `${cert.detail}, no. ${cert.number}` : cert.detail}
                </span>
              </span>
            </li>
          ))}
          <li>
            <Link
              href="/contact?topic=certificates"
              className="flex h-full min-h-[6.5rem] items-center justify-between gap-4 rounded-2xl border border-orange-500/60 p-5 text-white transition-colors hover:bg-orange-600"
            >
              <span>
                <span className="block text-lg font-bold">Need a document?</span>
                <span className="mt-1 block text-[0.9375rem] text-white/75">Certificates, registrations and specifications</span>
              </span>
              <ArrowUpRight className="size-6 shrink-0" aria-hidden />
            </Link>
          </li>
        </ul>
      </div>
    </section>
  );
}

// ── FAQ ──────────────────────────────────────────────────────────────────────
export async function HomeFaq() {
  const { faq: FAQ } = await getSiteContent();
  return (
    <section className="bg-white py-24 lg:py-32">
      <div className="container-page grid gap-12 lg:grid-cols-[1fr_1.45fr] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <h2 className={sectionTitle}>
            Frequently asked
            <br />
            questions
          </h2>
          <p className="mt-6 max-w-[26rem] text-lg leading-relaxed text-navy-800/85">
            Find quick answers to common questions about our products, process and services.
          </p>
          <Link href="/contact" className="mt-8 inline-flex items-center gap-2 font-medium text-cyan-700 hover:underline">
            Ask us something else <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
        <div className="border-t border-line">
          {FAQ.map((item) => (
            <details key={item.q} className="faq-item group border-b border-line [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-[1.0625rem] font-medium text-navy-800 hover:text-cyan-700">
                {item.q}
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-steel transition-colors group-open:bg-navy-800 group-open:text-white">
                  <Plus className="size-4 transition-transform duration-200 group-open:rotate-45" strokeWidth={2.25} aria-hidden />
                </span>
              </summary>
              <p className="faq-answer -mt-1 max-w-[42rem] pb-7 leading-relaxed text-slate-text">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
      <FaqJsonLd items={FAQ} />
    </section>
  );
}
