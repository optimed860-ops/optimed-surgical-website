import Link from "next/link";
import { ArrowRight, Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { getSiteSettings } from "@/features/catalogue/queries";
import { SITE } from "@/content/site";
import { getSiteContent } from "@/content/get-content";
import { CopyrightYear } from "./copyright-year";
import { SOCIAL_NETWORKS, SocialIcon, findSocial, gmailComposeUrl } from "@/components/shared/social-icons";
import { JsonLd, siteUrl } from "@/components/shared/json-ld";

const COMPANY_LINKS = [
  { href: "/about", label: "About" },
  { href: "/products", label: "Products" },
  { href: "/catalogue", label: "Catalogue" },
  { href: "/contact", label: "Contact" },
  { href: "/blog", label: "Blog" },
];

const BUYER_LINKS = [
  { href: "/quote", label: "Request a quote" },
  { href: "/catalogue", label: "Ask for the catalogue" },
  { href: "/contact?topic=certificates", label: "Request certificates" },
  { href: "/contact?topic=private-label", label: "Private label & custom" },
];

export async function SiteFooter() {
  const [settings, content] = await Promise.all([getSiteSettings(), getSiteContent()]);
  const FOOTER_TAGLINE = content.footer.tagline;
  const companyName = settings.companyName ?? SITE.legalName;
  // Icons appear only for networks whose link was saved in Admin → Settings.
  const socials = SOCIAL_NETWORKS.map((n) => ({ ...n, link: findSocial(settings.socialLinks, n.key) })).filter((n) => n.link);
  const gmail = settings.contactEmail ? gmailComposeUrl(settings.contactEmail) : null;
  const site = siteUrl();
  // Organization + WebSite structured data on every public page (helps Google and AI search).
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${site}/#organization`,
        name: companyName,
        url: site || undefined,
        logo: site ? `${site}/brand/optimed-surgical-logo.png` : undefined,
        description: content.footer.description,
        foundingDate: "2010",
        email: settings.contactEmail ?? undefined,
        telephone: settings.phoneNumber ?? undefined,
        address: settings.address
          ? { "@type": "PostalAddress", streetAddress: settings.address.replace(/\s*\n\s*/g, ", "), addressLocality: "Sialkot", addressCountry: "PK" }
          : undefined,
        sameAs: socials.length ? socials.map((n) => n.link!.url) : undefined,
      },
      { "@type": "WebSite", "@id": `${site}/#website`, name: companyName, url: site || undefined, publisher: { "@id": `${site}/#organization` }, inLanguage: "en" },
    ],
  };
  const social = "grid size-10 place-items-center rounded-full border border-white/20 text-white transition-colors hover:border-white hover:bg-white/10";

  return (
    <footer className="mt-auto bg-navy-950 text-white">
      <div className="container-page">
        <div className="grid gap-12 py-20 sm:grid-cols-2 lg:grid-cols-[1.5fr_0.8fr_1fr_1.3fr] lg:gap-14">
          {/* Company details */}
          <div className="max-w-sm">
            <Logo inverse />
            <p className="mt-6 leading-relaxed text-white/75">
              {content.footer.description}
            </p>
            <ul className="mt-6 space-y-3 text-[0.9375rem] text-white/80">
              <li className="flex gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-cyan-500" aria-hidden />
                <span className="whitespace-pre-line">{settings.address ?? "Sialkot, Pakistan"}</span>
              </li>
              {settings.phoneNumber ? (
                <li>
                  <a href={`tel:${settings.phoneNumber.replace(/[^\d+]/g, "")}`} className="flex gap-3 hover:text-white">
                    <Phone className="mt-0.5 size-4 shrink-0 text-cyan-500" aria-hidden />
                    {settings.phoneNumber}
                  </a>
                </li>
              ) : null}
              {settings.contactEmail ? (
                <li>
                  <a href={gmail ?? "/contact"} target="_blank" rel="noopener noreferrer" className="flex gap-3 break-all hover:text-white">
                    <Mail className="mt-0.5 size-4 shrink-0 text-cyan-500" aria-hidden />
                    {settings.contactEmail}
                  </a>
                </li>
              ) : null}
            </ul>
          </div>

          <FooterColumn title="Company" links={COMPANY_LINKS} />
          <FooterColumn title="Buyers" links={BUYER_LINKS} />

          {/* Call to action */}
          <div>
            <h2 className="text-base font-semibold tracking-normal text-white">Start a project</h2>
            <p className="mt-5 leading-relaxed text-white/75">
              Send your item list, drawings or private-label requirements. Our team replies with a written quotation.
            </p>
            <Link
              href="/quote"
              className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-orange-600 px-6 text-[0.9375rem] font-semibold text-white transition-colors hover:bg-orange-500"
            >
              Request a quote <ArrowRight className="size-4" aria-hidden />
            </Link>
            <ul className="mt-8 flex items-center gap-3" aria-label="Social and contact links">
              {socials.map((n) => (
                <li key={n.key}>
                  <a href={n.link!.url} target="_blank" rel="noopener noreferrer me" className={social} aria-label={`${companyName} on ${n.label}`}>
                    <SocialIcon name={n.key} />
                  </a>
                </li>
              ))}
              <li>
                <a
                  href={gmail ?? "/contact"}
                  target={gmail ? "_blank" : undefined}
                  rel={gmail ? "noopener noreferrer" : undefined}
                  className={social}
                  aria-label={settings.contactEmail ? `Email ${settings.contactEmail} in Gmail` : "Contact us"}
                >
                  <Mail className="size-[1.125rem]" aria-hidden />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-white/15 py-7 text-sm text-white/60 lg:flex-row lg:items-center lg:justify-between">
          <p className="max-w-3xl leading-relaxed">
            © <CopyrightYear /> {companyName}. All rights reserved. {FOOTER_TAGLINE}
          </p>
        </div>
      </div>
      <JsonLd data={orgJsonLd} />
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h2 className="text-base font-semibold tracking-normal text-white">{title}</h2>
      <ul className="mt-5 space-y-3.5">
        {links.map((link) => (
          <li key={link.label}>
            <Link href={link.href} className="text-white/75 transition-colors hover:text-white">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
