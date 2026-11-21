import type { Metadata } from "next";
import { PageHero } from "@/components/shared/page-hero";
import { IMAGE_CREDITS } from "@/content/image-credits";

export const metadata: Metadata = {
  title: "Image credits",
  description: "Sources and licences of product photos used on this website.",
  alternates: { canonical: "/image-credits" },
};

export default function ImageCreditsPage() {
  return (
    <>
      <PageHero
        crumbs={[{ label: "Image credits" }]}
        title="Image credits"
        lead="Some product photos on this website come from Wikimedia Commons and are used under free licences. They show the instrument type and were resized and placed on a square background."
      />
      <div className="container-page py-14 lg:py-20">
        <div className="overflow-x-auto rounded-xl border border-line bg-white">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-line bg-surface text-xs text-slate-text">
              <tr>
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold">Photo</th>
                <th className="px-4 py-3 font-semibold">Author</th>
                <th className="px-4 py-3 font-semibold">Licence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {IMAGE_CREDITS.map((c) => (
                <tr key={c.product}>
                  <td className="px-4 py-3 text-ink">{c.product.replace(/-/g, " ").replace(/^\w/, (x) => x.toUpperCase())}</td>
                  <td className="px-4 py-3">
                    <a href={c.source} target="_blank" rel="noopener noreferrer" className="text-navy-800 underline-offset-2 hover:underline">
                      {c.image}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-slate-text">{c.author}</td>
                  <td className="px-4 py-3">
                    {c.licenseUrl ? (
                      <a href={c.licenseUrl} target="_blank" rel="noopener noreferrer license" className="text-navy-800 underline-offset-2 hover:underline">
                        {c.license}
                      </a>
                    ) : (
                      <span className="text-slate-text">{c.license}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-6 max-w-3xl text-sm leading-relaxed text-slate-text">
          Photos marked CC BY-SA may be reused under the same licence. Our own product descriptions and item numbers are not covered by these licences.
        </p>
      </div>
    </>
  );
}
