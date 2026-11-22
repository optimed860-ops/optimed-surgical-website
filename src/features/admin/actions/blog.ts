"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { assertAdmin } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { dbError, fail, ok, slugify, type ActionResult } from "../result";

function refreshBlog(slug?: string) {
  updateTag("blog");
  if (slug) updateTag(`blog:${slug}`);
  refresh();
}

const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : null));

const postSchema = z.object({
  id: z.uuid().optional().or(z.literal("").transform(() => undefined)),
  title: z.string().trim().min(1, "Title is required").max(200),
  slug: z.string().trim().max(120).optional(),
  excerpt: z.string().trim().min(1, "Write a short summary (shown in search results and on the blog page)").max(320),
  body: z.string().trim().min(1, "The article text is empty").max(100000),
  seoTitle: optional(70),
  seoDescription: optional(170),
  coverImageAlt: optional(250),
  authorName: z.string().trim().max(120).optional().transform((v) => v || "Optimed Surgical"),
  tags: z
    .string()
    .optional()
    .transform((v) =>
      (v ?? "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 12)
        .map((t) => t.slice(0, 40)),
    ),
  isPublished: z.union([z.literal("on"), z.undefined()]).transform((v) => v === "on"),
  publishedAt: z.string().trim().optional(),
});

export async function saveBlogPost(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await assertAdmin();
  const parsed = postSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Check the form.");
  const d = parsed.data;
  const slug = slugify(d.slug || d.title).slice(0, 120);
  if (!slug) return fail("Add a title with letters or numbers.");

  let publishedAt: string | null = null;
  if (d.publishedAt) {
    const t = new Date(d.publishedAt);
    if (Number.isNaN(t.getTime())) return fail("Publish date is not valid.");
    publishedAt = t.toISOString();
  } else if (d.isPublished) {
    publishedAt = new Date().toISOString();
  }

  const row = {
    title: d.title,
    slug,
    excerpt: d.excerpt,
    body: d.body,
    seo_title: d.seoTitle,
    seo_description: d.seoDescription,
    cover_image_alt: d.coverImageAlt,
    author_name: d.authorName,
    tags: d.tags,
    is_published: d.isPublished,
    published_at: publishedAt,
  };
  const supabase = await createClient();
  if (d.id) {
    const { data: before } = await supabase.from("blog_posts").select("slug").eq("id", d.id).maybeSingle();
    const { error } = await supabase.from("blog_posts").update(row).eq("id", d.id);
    if (error) return dbError(error);
    refreshBlog(slug);
    if (before?.slug && before.slug !== slug) updateTag(`blog:${before.slug}`);
    return ok("Article saved.");
  }
  const { data, error } = await supabase.from("blog_posts").insert(row).select("id").single();
  if (error) return dbError(error);
  refreshBlog(slug);
  redirect(`/admin/blog/${data.id}?created=1`);
}

export async function deleteBlogPost(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = z.uuid().parse(formData.get("id"));
  const supabase = await createClient();
  const { data } = await supabase.from("blog_posts").select("slug, cover_image_path").eq("id", id).maybeSingle();
  const { error } = await supabase.from("blog_posts").delete().eq("id", id);
  if (!error && data?.cover_image_path) await supabase.storage.from("site-assets").remove([data.cover_image_path]);
  refreshBlog(data?.slug);
  redirect("/admin/blog?deleted=1");
}

export async function setBlogPublished(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = z.uuid().parse(formData.get("id"));
  const value = formData.get("value") === "true";
  const supabase = await createClient();
  const { data } = await supabase.from("blog_posts").select("slug, published_at").eq("id", id).maybeSingle();
  await supabase
    .from("blog_posts")
    .update({ is_published: value, ...(value && !data?.published_at ? { published_at: new Date().toISOString() } : {}) })
    .eq("id", id);
  refreshBlog(data?.slug);
}

/** Records a cover image the browser uploaded to site-assets/blog/{postId}/… */
export async function setBlogCover(postId: string, storagePath: string | null): Promise<ActionResult> {
  await assertAdmin();
  if (!z.uuid().safeParse(postId).success) return fail("Invalid article.");
  if (storagePath && !new RegExp(`^blog/${postId}/[a-f0-9-]{36}\\.(jpg|jpeg|png|webp)$`).test(storagePath)) return fail("Use a JPG, PNG or WebP image.");
  const supabase = await createClient();
  const { data: current } = await supabase.from("blog_posts").select("slug, cover_image_path").eq("id", postId).maybeSingle();
  const { error } = await supabase.from("blog_posts").update({ cover_image_path: storagePath }).eq("id", postId);
  if (error) return dbError(error);
  if (current?.cover_image_path && current.cover_image_path !== storagePath) {
    await supabase.storage.from("site-assets").remove([current.cover_image_path]);
  }
  refreshBlog(current?.slug);
  return ok(storagePath ? "Cover image updated." : "Cover image removed.");
}

export async function removeBlogCover(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = z.uuid().parse(formData.get("id"));
  await setBlogCover(id, null);
}

/** Clears the cached blog pages, e.g. after articles were added with SQL. */
export async function refreshBlogCache(): Promise<void> {
  await assertAdmin();
  refreshBlog();
}
