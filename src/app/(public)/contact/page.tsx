import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, Mail, MapPin, Phone } from "lucide-react";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { getSiteSettings } from "@/features/catalogue/queries";
import { ContactForm } from "@/features/inquiries/contact-form";
import { CONTACT_SUBJECTS } from "@/features/inquiries/subjects";
import { CONTACT } from "@/content/site";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Contact Optimed Surgical in Sialkot, Pakistan, by phone, email, WhatsApp or the contact form.",
  alternates: { canonical: "/contact" },
};

/** ?topic= links from other pages preselect the subject. */
const TOPICS: Record<string, string> = {
  certificates: CONTACT_SUBJECTS[1],
  "private-label": CONTACT_SUBJECTS[2],
};

export default async function ContactPage({ searchParams }: PageProps<"/contact">) {
  const settings = await getSiteSettings();
  const email = settings.contactEmail ?? CONTACT.email;
  const phone = settings.phoneNumber ?? CONTACT.phone;
  const address = settings.address ?? CONTACT.address;

  return (
    <>
      <section className="bg-white pt-8 pb-10 lg:pt-10">
        <div className="mx-auto w-full max-w-[66rem] px-5 sm:px-8">
          <Breadcrumbs items={[{ label: "Contact us" }]} />
          <h1 className="mt-10 text-[length:clamp(2rem,1.5rem+1.8vw,3rem)] leading-tight">Contact us</h1>
          <p className="mt-4 max-w-[40rem] text-[1.0625rem] leading-relaxed text-navy-800/85">
            Have a question about our products, certificates or an order? Send us a message and our team will get back to you.
          </p>
        </div>
      </section>

      <section className="bg-white pb-20">
        <div className="mx-auto grid w-full max-w-[66rem] gap-8 px-5 sm:px-8 lg:grid-cols-[19rem_1fr] lg:gap-10">
          <aside className="space-y-6 self-start rounded-xl border border-[#dfe7f2] bg-steel p-6">
            <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="flex gap-3 text-ink hover:text-navy-800">
              <Phone className="mt-0.5 size-5 shrink-0 text-cyan-700" aria-hidden />
              <span>
                <span className="block text-sm text-slate-text">Phone</span>
                <span className="font-medium">{phone}</span>
              </span>
            </a>
            <a href={`mailto:${email}`} className="flex gap-3 text-ink hover:text-navy-800">
              <Mail className="mt-0.5 size-5 shrink-0 text-cyan-700" aria-hidden />
              <span className="min-w-0">
                <span className="block text-sm text-slate-text">Email</span>
                <span className="text-[0.9375rem] font-medium [overflow-wrap:anywhere]">{email}</span>
              </span>
            </a>
            <div className="flex gap-3 text-ink">
              <MapPin className="mt-0.5 size-5 shrink-0 text-cyan-700" aria-hidden />
              <span>
                <span className="block text-sm text-slate-text">Address</span>
                <span className="font-medium whitespace-pre-line">{address}</span>
              </span>
            </div>
            <div className="border-t border-[#dfe7f2] pt-5">
              <p className="text-sm leading-relaxed text-slate-text">Need prices for a product list or tender?</p>
              <Link href="/quote" className="mt-2 inline-flex items-center gap-1.5 font-semibold text-navy-800 hover:underline">
                Request a quote <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          </aside>

          <div className="rounded-xl border border-[#dfe7f2] bg-white p-6 sm:p-8">
            <Suspense fallback={<ContactForm />}>
              <FormWithTopic searchParams={searchParams} />
            </Suspense>
          </div>
        </div>
      </section>
    </>
  );
}

async function FormWithTopic({ searchParams }: { searchParams: PageProps<"/contact">["searchParams"] }) {
  const { topic } = await searchParams;
  const key = Array.isArray(topic) ? topic[0] : topic;
  return <ContactForm defaultSubject={key ? TOPICS[key] : undefined} />;
}
