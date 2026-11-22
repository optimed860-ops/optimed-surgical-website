import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CONTENT_SECTIONS, DEFAULT_CONTENT, mergeContent } from "@/content/editable";
import { AdminCard, AdminHeader } from "@/features/admin/ui";
import { ContentEditor } from "@/features/admin/components/content-editor";
import { pickParam } from "@/features/admin/components/status-filter";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Website content" };

export default async function AdminContentPage({ searchParams }: PageProps<"/admin/content">) {
  const sp = await searchParams;
  const current = CONTENT_SECTIONS.find((s) => s.key === pickParam(sp.section)) ?? CONTENT_SECTIONS[0];

  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("setting_value").eq("setting_key", "site_content").maybeSingle();
  const content = mergeContent(data?.setting_value ?? null);
  const saved = data?.setting_value && typeof data.setting_value === "object" ? Object.keys(data.setting_value) : [];

  return (
    <>
      <AdminHeader title="Website content" description="Change any text on the website. Choose a section, edit it, then save. Empty boxes use the original text." />
      <div className="grid gap-6 lg:grid-cols-[15rem_1fr]">
        <nav aria-label="Sections" className="min-w-0 lg:sticky lg:top-6 lg:self-start">
          <ul className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:px-0 lg:flex-col lg:overflow-visible lg:pb-0">
            {CONTENT_SECTIONS.map((s) => (
              <li key={s.key} className="shrink-0">
                <Link
                  href={`/admin/content?section=${s.key}`}
                  aria-current={s.key === current.key ? "page" : undefined}
                  className={cn(
                    "block rounded-md px-3 py-2 text-sm",
                    s.key === current.key ? "bg-navy-800 font-semibold text-white" : "text-ink hover:bg-steel",
                  )}
                >
                  {s.label}
                  <span className={cn("block text-xs", s.key === current.key ? "text-white/70" : "text-slate-text")}>
                    {s.page}
                    {saved.includes(s.key) ? ", edited" : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <AdminCard title={current.label}>
          <ContentEditor
            key={current.key}
            section={current.key}
            initial={JSON.parse(JSON.stringify(content[current.key]))}
            template={JSON.parse(JSON.stringify(DEFAULT_CONTENT[current.key]))}
          />
        </AdminCard>
      </div>
    </>
  );
}
