import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Trash2, X } from "lucide-react";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { publicStorageUrl } from "@/lib/storage";
import { AdminCard, AdminHeader, dangerButton, secondaryButton } from "@/features/admin/ui";
import { SubmitButton } from "@/features/admin/client-ui";
import { BlogForm } from "@/features/admin/components/blog-form";
import { FileUploader } from "@/features/admin/components/file-uploader";
import { deleteBlogPost, removeBlogCover, setBlogCover } from "@/features/admin/actions/blog";

export const metadata: Metadata = { title: "Edit article" };

export default async function EditBlogPostPage({ params, searchParams }: PageProps<"/admin/blog/[id]">) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  if (!z.uuid().safeParse(id).success) notFound();

  const supabase = await createClient();
  const { data: post } = await supabase
    .from("blog_posts")
    .select("id, title, slug, excerpt, body, seo_title, seo_description, cover_image_path, cover_image_alt, author_name, tags, is_published, published_at")
    .eq("id", id)
    .maybeSingle();
  if (!post) notFound();
  const cover = publicStorageUrl("site-assets", post.cover_image_path);

  return (
    <>
      <AdminHeader
        title={post.title}
        back={{ href: "/admin/blog", label: "Blog" }}
        actions={
          <>
            {post.is_published ? (
              <Link href={`/blog/${post.slug}`} target="_blank" className={secondaryButton}>
                <ExternalLink className="size-4" aria-hidden /> View on website
              </Link>
            ) : null}
            <form action={deleteBlogPost}>
              <input type="hidden" name="id" value={post.id} />
              <SubmitButton className={dangerButton} confirm={`Delete “${post.title}”? This cannot be undone.`}>
                <Trash2 className="size-4" aria-hidden /> Delete
              </SubmitButton>
            </form>
          </>
        }
      />
      {sp.created ? <p className="mb-5 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">Article created. Add a cover image, then publish it.</p> : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <BlogForm post={{ ...post, tags: post.tags ?? [] }} />

        <div className="space-y-6">
          <AdminCard title="Cover image">
            {cover ? (
              <div className="mb-4 overflow-hidden rounded-lg border border-line">
                <div className="relative aspect-[1200/630] bg-steel">
                  <Image src={cover} alt={post.cover_image_alt ?? ""} fill sizes="320px" className="object-cover" />
                </div>
                <form action={removeBlogCover} className="border-t border-line">
                  <input type="hidden" name="id" value={post.id} />
                  <SubmitButton className="flex h-9 w-full items-center justify-center gap-1 text-xs font-semibold text-red-700 hover:bg-red-50" confirm="Remove the cover image?">
                    <X className="size-3.5" aria-hidden /> Remove image
                  </SubmitButton>
                </form>
              </div>
            ) : (
              <p className="mb-4 text-sm text-slate-text">No cover image. Recommended size 1200 × 630 px (also used when the article is shared).</p>
            )}
            <FileUploader bucket="site-assets" folder={`blog/${post.id}`} maxMb={2} onUploaded={setBlogCover.bind(null, post.id)} label={cover ? "Replace image" : "Upload image"} />
          </AdminCard>
        </div>
      </div>
    </>
  );
}
