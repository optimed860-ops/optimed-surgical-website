import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/shared/page-hero";
import { getPublishedPosts } from "@/features/blog/queries";
import { PostCard } from "@/features/blog/post-card";
import { SITE } from "@/content/site";

export const metadata: Metadata = {
  title: "Blog: surgical instrument guides",
  description:
    "Guides for hospitals, clinics and distributors on choosing, buying and caring for surgical, dental and medical instruments, from Optimed Surgical in Sialkot, Pakistan.",
  alternates: { canonical: "/blog" },
  openGraph: { type: "website", title: `Blog · ${SITE.name}`, url: "/blog" },
};

export default async function BlogPage() {
  const posts = await getPublishedPosts();
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: `${SITE.name} blog`,
    url: `${site}/blog`,
    publisher: { "@type": "Organization", name: SITE.legalName, url: site || undefined },
    blogPost: posts.slice(0, 20).map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      url: `${site}/blog/${p.slug}`,
      datePublished: p.publishedAt,
      dateModified: p.updatedAt,
    })),
  };

  return (
    <>
      <PageHero
        crumbs={[{ label: "Blog" }]}
        title="Instrument guides and buying advice"
        lead="Practical articles for hospitals, clinics, dental practices and distributors: choosing the right instruments, ordering in bulk, and keeping instruments in service for longer."
      />
      <section className="bg-steel/40 py-16 lg:py-20">
        <div className="container-page">
          {posts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-white px-6 py-16 text-center">
              <p className="font-semibold text-ink">Articles are on their way.</p>
              <p className="mt-2 text-slate-text">
                In the meantime, browse our <Link href="/products" className="text-cyan-700 underline underline-offset-4">products</Link> or{" "}
                <Link href="/quote" className="text-cyan-700 underline underline-offset-4">request a quote</Link>.
              </p>
            </div>
          ) : (
            <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post, i) => (
                <PostCard key={post.slug} post={post} priority={i < 3} />
              ))}
            </div>
          )}
        </div>
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </>
  );
}
