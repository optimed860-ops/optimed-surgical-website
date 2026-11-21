import { ActionForm, SubmitButton } from "../client-ui";
import { AdminCard, FieldRow, adminInput, primaryButton } from "../ui";
import { saveBlogPost } from "../actions/blog";

export type BlogFormValues = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  seo_title: string | null;
  seo_description: string | null;
  cover_image_alt: string | null;
  author_name: string;
  tags: string[];
  is_published: boolean;
  published_at: string | null;
};

/** datetime-local value in server time (UTC on the host); the save action reads it the same way. */
function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function BlogForm({ post }: { post?: BlogFormValues }) {
  return (
    <ActionForm action={saveBlogPost} className="space-y-6">
      {post?.id ? <input type="hidden" name="id" value={post.id} /> : null}

      <AdminCard title="Article">
        <div className="space-y-4">
          <FieldRow label="Title" hint="the main heading; include the topic people search for">
            <input name="title" required maxLength={200} defaultValue={post?.title} className={`${adminInput} h-10`} />
          </FieldRow>
          <FieldRow label="Summary" hint="1–2 sentences, max 320 characters; shown on the blog page">
            <textarea name="excerpt" required rows={2} maxLength={320} defaultValue={post?.excerpt} className={`${adminInput} py-2`} />
          </FieldRow>
          <FieldRow label="Article text">
            <textarea name="body" required rows={22} maxLength={100000} defaultValue={post?.body} className={`${adminInput} py-2 font-mono text-[0.8125rem] leading-relaxed`} />
          </FieldRow>
          <div className="rounded-md bg-steel/70 p-3 text-xs leading-relaxed text-slate-text">
            <p className="font-semibold text-ink">Formatting</p>
            <p>
              <code>## Heading</code> · <code>### Sub-heading</code> · <code>- bullet</code> · <code>1. numbered</code> · <code>&gt; quote</code> ·{" "}
              <code>**bold**</code> · <code>*italic*</code> · <code>[link text](/products)</code> or <code>[text](https://…)</code>. Leave an empty line
              between paragraphs.
            </p>
          </div>
        </div>
      </AdminCard>

      <AdminCard title="Search engines (SEO)">
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldRow label="Web address (slug)" hint="made from the title if empty" className="sm:col-span-2">
            <input name="slug" maxLength={120} defaultValue={post?.slug} placeholder="how-to-choose-surgical-scissors" className={`${adminInput} h-10 font-mono`} />
          </FieldRow>
          <FieldRow label="SEO title" hint="optional, max 70 characters; defaults to the title" className="sm:col-span-2">
            <input name="seoTitle" maxLength={70} defaultValue={post?.seo_title ?? ""} className={`${adminInput} h-10`} />
          </FieldRow>
          <FieldRow label="Meta description" hint="optional, max 170 characters; defaults to the summary" className="sm:col-span-2">
            <textarea name="seoDescription" rows={2} maxLength={170} defaultValue={post?.seo_description ?? ""} className={`${adminInput} py-2`} />
          </FieldRow>
          <FieldRow label="Tags" hint="comma separated">
            <input name="tags" maxLength={400} defaultValue={post?.tags.join(", ")} placeholder="surgical scissors, buying guide" className={`${adminInput} h-10`} />
          </FieldRow>
          <FieldRow label="Author">
            <input name="authorName" maxLength={120} defaultValue={post?.author_name ?? "Optimed Surgical"} className={`${adminInput} h-10`} />
          </FieldRow>
          <FieldRow label="Cover image description" hint="describes the cover photo for Google and screen readers" className="sm:col-span-2">
            <input name="coverImageAlt" maxLength={250} defaultValue={post?.cover_image_alt ?? ""} className={`${adminInput} h-10`} />
          </FieldRow>
        </div>
      </AdminCard>

      <AdminCard title="Publishing">
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="isPublished" defaultChecked={post?.is_published ?? false} className="size-4 accent-navy-800" />
            Published (visible on the website)
          </label>
          <label className="flex items-center gap-2">
            Publish date (server time, UTC)
            <input type="datetime-local" name="publishedAt" defaultValue={toLocalInput(post?.published_at ?? null)} className={`${adminInput} h-9 w-auto`} />
          </label>
          <span className="text-xs text-slate-text">A future date schedules the article.</span>
        </div>
      </AdminCard>

      <div className="flex justify-end">
        <SubmitButton className={primaryButton}>{post?.id ? "Save article" : "Create article"}</SubmitButton>
      </div>
    </ActionForm>
  );
}
