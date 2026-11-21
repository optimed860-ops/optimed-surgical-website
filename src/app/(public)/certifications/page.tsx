import type { Metadata } from "next";
import Link from "next/link";
import { FileBadge2, FileText, ImageIcon } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { Button } from "@/components/ui/button";
import { getCertifications } from "@/features/catalogue/queries";

export const metadata: Metadata = {
  title: "Certifications",
  description: "Certificates and quality documents published by Optimed.",
  alternates: { canonical: "/certifications" },
};

function formatDate(value: string | null) {
  if (!value) return null;
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
}

export default async function CertificationsPage() {
  const certifications = await getCertifications();

  return (
    <>
      <PageHero
        crumbs={[{ label: "Certifications" }]}
        title="Certifications"
        lead="Documents published here are supplied and verified by Optimed. Need something specific? Request it with your quotation."
      />
      <section className="py-14 lg:py-20">
        <div className="container-page">
          {certifications.length === 0 ? (
            <div className="grid place-items-center rounded-lg border border-dashed border-line px-6 py-20 text-center">
              <FileBadge2 className="size-10 text-navy-800/30" strokeWidth={1.25} aria-hidden />
              <h2 className="mt-4 text-h3">Documents are being prepared</h2>
              <p className="mt-2 max-w-md text-sm text-slate-text">
                Our certificates and quality documents will be published here once verified. You can request
                specific documents in the message of your quotation request.
              </p>
              <Button asChild size="lg" className="mt-6">
                <Link href="/contact?topic=certificates">Request certificates</Link>
              </Button>
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {certifications.map((cert) => {
                const Icon = cert.documentType === "pdf" ? FileText : ImageIcon;
                const issued = formatDate(cert.issueDate);
                const expires = formatDate(cert.expiryDate);
                return (
                  <li key={cert.id} className="flex flex-col rounded-lg border border-line bg-white">
                    <div className="flex items-center justify-between border-b border-line bg-surface px-6 py-4">
                      <Icon className="size-6 text-medical-600" strokeWidth={1.5} aria-hidden />
                      <span className="font-mono text-xs uppercase text-slate-text">{cert.documentType}</span>
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <h2 className="text-lg font-semibold">{cert.title}</h2>
                      {cert.description ? <p className="mt-2 text-sm leading-relaxed text-slate-text">{cert.description}</p> : null}
                      {issued || expires ? (
                        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                          {issued ? (
                            <div>
                              <dt className="text-xs text-slate-text">Issued</dt>
                              <dd className="font-medium text-ink">{issued}</dd>
                            </div>
                          ) : null}
                          {expires ? (
                            <div>
                              <dt className="text-xs text-slate-text">Valid until</dt>
                              <dd className="font-medium text-ink">{expires}</dd>
                            </div>
                          ) : null}
                        </dl>
                      ) : null}
                      <div className="mt-auto pt-6">
                        <Button asChild variant="outline" size="lg" className="w-full">
                          <a href={`/api/certifications/${cert.id}/download`} target="_blank" rel="noopener">
                            View document
                          </a>
                        </Button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
