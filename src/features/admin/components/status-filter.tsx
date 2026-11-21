import Link from "next/link";
import { cn } from "@/lib/utils";
import { adminInput, secondaryButton } from "../ui";
import { statusLabel } from "../statuses";

/** Status tabs + search box for admin list pages (plain links, no JS). */
export function StatusFilter({
  basePath,
  statuses,
  current,
  q,
  searchPlaceholder,
}: {
  basePath: string;
  statuses: readonly string[];
  current?: string;
  q?: string;
  searchPlaceholder: string;
}) {
  const href = (status?: string) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (q) params.set("q", q);
    const s = params.toString();
    return s ? `${basePath}?${s}` : basePath;
  };
  return (
    <div className="mb-5 space-y-3">
      <nav className="flex flex-wrap gap-1.5" aria-label="Filter by status">
        {[undefined, ...statuses].map((s) => (
          <Link
            key={s ?? "all"}
            href={href(s)}
            aria-current={current === s ? "page" : undefined}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
              current === s ? "border-navy-800 bg-navy-800 text-white" : "border-line bg-white text-navy-800 hover:bg-steel",
            )}
          >
            {s ? statusLabel(s) : "All"}
          </Link>
        ))}
      </nav>
      <form className="flex gap-2" action={basePath}>
        {current ? <input type="hidden" name="status" value={current} /> : null}
        <input name="q" defaultValue={q} placeholder={searchPlaceholder} className={`${adminInput} h-10 max-w-sm`} />
        <button className={secondaryButton}>Search</button>
      </form>
    </div>
  );
}

export function pickParam(value: string | string[] | undefined): string | undefined {
  return (Array.isArray(value) ? value[0] : value) || undefined;
}
