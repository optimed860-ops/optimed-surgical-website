import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AdminHeader, EmptyState, StatusBadge, formatDate, primaryButton, secondaryButton } from "@/features/admin/ui";
import { SubmitButton } from "@/features/admin/client-ui";
import { refreshBlogCache, setBlogPublished } from "@/features/admin/actions/blog";

export const metadata: Metadata = { title: "Blog" };

/** True when a publish date is still in the future (scheduled article). */
function isFuture(iso: string | null) {
  return Boolean(iso) && new Date(iso as string).getTime() > Date.now();
}

export default async function AdminBlogPage({ searchParams }: PageProps<"/admin/blog">) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("id, title, slug, is_published, published_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(300);
  const posts = data ?? [];

  return (
    <>
      <AdminHeader
        title="Blog"
        description="Articles shown on the Blog page (linked from the footer). Good articles help buyers find you on Google."
        actions={
          <>
            <form action={refreshBlogCache}>
              <SubmitButton className={secondaryButton}>Refresh blog on website</SubmitButton>
            </form>
            <Link href="/admin/blog/new" className={primaryButton}>
              <Plus className="size-4" aria-hidden /> New article
            </Link>
          </>
        }
      />
      {sp.deleted ? <p className="mb-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">Article deleted.</p> : null}
      {error ? (
        <p className="mb-4 rounded-md bg-amber-50 p-3 text-sm text-amber-900">
          The blog table is not set up yet. Run SQL file 12 (<code>20261121000012_blog.sql</code>) in Supabase, then refresh.
        </p>
      ) : null}

      {posts.length === 0 ? (
        <EmptyState
          title="No articles yet"
          text="Write your first article, or run the starter articles SQL from the setup guide."
          action={
            <Link href="/admin/blog/new" className={primaryButton}>
              New article
            </Link>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-white">
          <ul className="divide-y divide-line">
            {posts.map((p) => {
              const scheduled = p.is_published && isFuture(p.published_at);
              return (
                <li key={p.id} className="flex flex-wrap items-center gap-4 px-4 py-3 sm:flex-nowrap">
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/blog/${p.id}`} className="font-semibold text-ink hover:underline">
                      {p.title}
                    </Link>
                    <p className="text-xs text-slate-text">
                      /blog/{p.slug} · {p.published_at ? `published ${formatDate(p.published_at)}` : `edited ${formatDate(p.updated_at)}`}
                    </p>
                  </div>
                  <StatusBadge status={p.is_published && !scheduled ? "published" : "draft"} label={scheduled ? "Scheduled" : p.is_published ? "Published" : "Draft"} />
                  <div className="flex items-center gap-2">
                    <form action={setBlogPublished}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="value" value={String(!p.is_published)} />
                      <button className="h-9 rounded-md border border-[#cdd5df] px-3 text-xs font-semibold text-navy-800 hover:bg-steel">
                        {p.is_published ? "Unpublish" : "Publish"}
                      </button>
                    </form>
                    <Link href={`/admin/blog/${p.id}`} className="inline-flex h-9 items-center rounded-md bg-navy-800 px-3 text-xs font-semibold text-white hover:bg-navy-950">
                      Edit
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
}
