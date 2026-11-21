import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  page: number;
  pageCount: number;
  /** Builds the URL for a page number, keeping other filters. */
  hrefFor: (page: number) => string;
};

function pageWindow(page: number, pageCount: number): (number | "…")[] {
  const pages = new Set([1, pageCount, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pageCount));
  const sorted = [...pages].sort((a, b) => a - b);
  const result: (number | "…")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push("…");
    result.push(p);
  });
  return result;
}

export function Pagination({ page, pageCount, hrefFor }: Props) {
  if (pageCount <= 1) return null;
  const base = "grid h-10 min-w-10 place-items-center rounded-md border px-3 text-sm font-medium";

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1.5">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={cn(base, "border-line bg-white hover:border-navy-800/30")} aria-label="Previous page">
          <ChevronLeft className="size-4" aria-hidden />
        </Link>
      ) : null}
      {pageWindow(page, pageCount).map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="px-1 text-slate-text" aria-hidden>
            …
          </span>
        ) : (
          <Link
            key={p}
            href={hrefFor(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(
              base,
              "font-mono",
              p === page ? "border-navy-800 bg-navy-800 text-white" : "border-line bg-white hover:border-navy-800/30",
            )}
          >
            {p}
          </Link>
        ),
      )}
      {page < pageCount ? (
        <Link href={hrefFor(page + 1)} className={cn(base, "border-line bg-white hover:border-navy-800/30")} aria-label="Next page">
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      ) : null}
    </nav>
  );
}
