import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";

/** Public blog reads (published posts only, enforced by RLS). Cached; refreshed on save. */

export type BlogPostSummary = {
  slug: string;
  title: string;
  excerpt: string;
  coverImagePath: string | null;
  coverImageAlt: string | null;
  authorName: string;
  tags: string[];
  publishedAt: string;
  updatedAt: string;
  body: string;
};

export type BlogPost = BlogPostSummary & {
  seoTitle: string | null;
  seoDescription: string | null;
};

const hasSupabase = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

type Row = {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  seo_title: string | null;
  seo_description: string | null;
  cover_image_path: string | null;
  cover_image_alt: string | null;
  author_name: string;
  tags: string[] | null;
  published_at: string | null;
  updated_at: string;
};

const COLUMNS = "slug, title, excerpt, body, seo_title, seo_description, cover_image_path, cover_image_alt, author_name, tags, published_at, updated_at";

function toPost(r: Row): BlogPost {
  return {
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt,
    body: r.body,
    seoTitle: r.seo_title,
    seoDescription: r.seo_description,
    coverImagePath: r.cover_image_path,
    coverImageAlt: r.cover_image_alt,
    authorName: r.author_name,
    tags: r.tags ?? [],
    publishedAt: r.published_at ?? r.updated_at,
    updatedAt: r.updated_at,
  };
}

export async function getPublishedPosts(): Promise<BlogPost[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("blog");
  if (!hasSupabase()) return [];
  const { data, error } = await createPublicClient().from("blog_posts").select(COLUMNS).order("published_at", { ascending: false }).limit(500);
  if (error) {
    // Table missing until SQL file 12 is run: show an empty blog instead of failing.
    if (error.code !== "42P01" && error.code !== "PGRST205") console.error("[blog] list failed", error.code, error.message);
    return [];
  }
  return ((data ?? []) as Row[]).map(toPost);
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("blog", `blog:${slug}`);
  if (!hasSupabase() || !/^[a-z0-9-]{1,120}$/.test(slug)) return null;
  const { data, error } = await createPublicClient().from("blog_posts").select(COLUMNS).eq("slug", slug).maybeSingle();
  if (error || !data) return null;
  return toPost(data as Row);
}
