import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { getPostBySlug, getPublishedPosts } from "@/features/blog/queries";
import { Markdown, extractHeadings, readingMinutes } from "@/features/blog/markdown";
import { PostCard, formatPostDate } from "@/features/blog/post-card";
import { publicStorageUrl } from "@/lib/storage";
import { SITE } from "@/content/site";

type Props = PageProps<"/blog/[slug]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Article not found", robots: { index: false } };
  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt;
  const image = publicStorageUrl("site-assets", post.coverImagePath);
  return {
    title,
    description,
    keywords: post.tags.length ? post.tags : undefined,
    alternates: { canonical: `/blog/${post.slug}` },
    authors: [{ name: post.authorName }],
    openGraph: {
      type: "article",
      title,
      description,
      url: `/blog/${post.slug}`,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.authorName],
      tags: post.tags,
      images: image ? [{ url: image, width: 1200, height: 630, alt: post.coverImageAlt ?? post.title }] : undefined,
    },
    twitter: { card: "summary_large_image", title, description, images: image ? [image] : undefined },
  };
}

export default function BlogPostPage({ params }: Props) {
  return (
    <Suspense fallback={<div className="container-page min-h-[60vh] py-20" aria-busy="true" />}>
      <PostContent params={params} />
    </Suspense>
  );
}

async function PostContent({ params }: Pick<Props, "params">) {
  const { slug } = await params;
  const [post, all] = await Promise.all([getPostBySlug(slug), getPublishedPosts()]);
  if (!post) notFound();

  const cover = publicStorageUrl("site-assets", post.coverImagePath);
  const headings = extractHeadings(post.body);
  const related = all.filter((p) => p.slug !== post.slug).slice(0, 3);
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.seoDescription || post.excerpt,
    image: cover ? [cover] : undefined,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { "@type": "Organization", name: post.authorName, url: site || undefined },
    publisher: { "@type": "Organization", name: SITE.legalName, url: site || undefined, logo: site ? { "@type": "ImageObject", url: `${site}/brand/optimed-surgical-logo.png` } : undefined },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${site}/blog/${post.slug}` },
    keywords: post.tags.join(", ") || undefined,
    wordCount: post.body.split(/\s+/).filter(Boolean).length,
    inLanguage: "en",
  };

  return (
    <>
      <article>
        <header className="border-b border-line bg-white">
          <div className="container-page pt-8 pb-10 lg:pt-10">
            <Breadcrumbs items={[{ label: "Blog", href: "/blog" }, { label: post.title }]} />
            <div className="mt-10 max-w-3xl">
              <p className="text-sm font-medium text-slate-text">
                <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time> · {readingMinutes(post.body)} min read · {post.authorName}
              </p>
              <h1 className="mt-4 text-[length:clamp(2rem,1.4rem+2.2vw,3.25rem)] leading-[1.1] font-extrabold tracking-[-0.02em] text-navy-800">{post.title}</h1>
              <p className="mt-5 text-lead text-slate-text">{post.excerpt}</p>
            </div>
          </div>
        </header>

        <div className="container-page grid gap-12 py-12 lg:grid-cols-[minmax(0,46rem)_16rem] lg:justify-between lg:py-16">
          <div className="min-w-0">
            {cover ? (
              <div className="relative mb-10 aspect-[1200/630] overflow-hidden rounded-2xl bg-steel">
                <Image src={cover} alt={post.coverImageAlt ?? ""} fill priority sizes="(min-width: 1024px) 736px, 100vw" className="object-cover" />
              </div>
            ) : null}
            <Markdown source={post.body} />

            {post.tags.length ? (
              <ul className="mt-10 flex flex-wrap gap-2" aria-label="Topics">
                {post.tags.map((t) => (
                  <li key={t} className="rounded-full bg-steel px-3 py-1 text-xs font-medium text-navy-800">
                    {t}
                  </li>
                ))}
              </ul>
            ) : null}

            <aside className="mt-12 rounded-2xl bg-navy-800 p-7 text-white sm:p-9">
              <h2 className="text-xl font-bold tracking-normal text-white">Need these instruments for your hospital or store?</h2>
              <p className="mt-3 max-w-xl leading-relaxed text-white/80">
                Send us your product list with quantities. Our team in Sialkot replies with a written quotation.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/quote" className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-navy-800 hover:bg-steel">
                  Request a quote <ArrowRight className="size-4" aria-hidden />
                </Link>
                <Link href="/products" className="inline-flex h-11 items-center rounded-full border border-white/40 px-6 text-sm font-semibold text-white hover:bg-white/10">
                  Browse products
                </Link>
              </div>
            </aside>
          </div>

          {headings.length >= 3 ? (
            <nav aria-label="In this article" className="hidden lg:sticky lg:top-28 lg:block lg:self-start">
              <h2 className="mb-4 text-sm font-semibold tracking-normal text-ink">In this article</h2>
              <ol className="space-y-2.5 border-l border-line text-sm">
                {headings.map((h) => (
                  <li key={h.id}>
                    <a href={`#${h.id}`} className="-ml-px block border-l border-transparent pl-4 text-slate-text hover:border-navy-800 hover:text-navy-800">
                      {h.text}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          ) : null}
        </div>
      </article>

      {related.length ? (
        <section className="border-t border-line bg-steel/40 py-16">
          <div className="container-page">
            <h2 className="text-h3">More articles</h2>
            <div className="mt-8 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <PostCard key={p.slug} post={p} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </>
  );
}
