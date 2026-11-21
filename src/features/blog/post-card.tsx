import Image from "next/image";
import Link from "next/link";
import { publicStorageUrl } from "@/lib/storage";
import { readingMinutes } from "./markdown";
import type { BlogPost } from "./queries";

export function formatPostDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

export function PostCard({ post, priority }: { post: BlogPost; priority?: boolean }) {
  const cover = publicStorageUrl("site-assets", post.coverImagePath);
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-[#dfe7f2] bg-white transition-shadow hover:shadow-[0_20px_40px_-28px_rgb(2_35_94/0.45)]">
      <Link href={`/blog/${post.slug}`} className="relative block aspect-[1200/630] overflow-hidden bg-navy-800" tabIndex={-1} aria-hidden>
        {cover ? (
          <Image src={cover} alt="" fill sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw" priority={priority} className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        ) : (
          <div className="absolute inset-0 flex items-end bg-[linear-gradient(135deg,#03286a_0%,#0a4fa8_60%,#13a3dc_100%)] p-6">
            <span className="line-clamp-3 text-xl leading-snug font-bold text-white/95">{post.title}</span>
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-6">
        <p className="text-xs font-medium text-slate-text">
          <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time> · {readingMinutes(post.body)} min read
        </p>
        <h2 className="mt-3 text-lg leading-snug font-bold tracking-normal text-navy-800">
          <Link href={`/blog/${post.slug}`} className="hover:underline">
            {post.title}
          </Link>
        </h2>
        <p className="mt-3 line-clamp-3 text-[0.9375rem] leading-relaxed text-slate-text">{post.excerpt}</p>
        <Link href={`/blog/${post.slug}`} className="mt-auto pt-5 text-sm font-semibold text-cyan-700 hover:underline">
          Read article
          <span className="sr-only">: {post.title}</span>
        </Link>
      </div>
    </article>
  );
}
