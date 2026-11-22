import Link from "next/link";
import { cn } from "@/lib/utils";

/** Shared building blocks for admin pages (server-safe). */

export const adminInput =
  "w-full rounded-md border border-[#cdd5df] bg-white px-3 text-sm text-ink outline-none transition-shadow placeholder:text-slate-text/60 focus-visible:border-navy-800 focus-visible:ring-2 focus-visible:ring-navy-800/15";

export function AdminHeader({
  title,
  description,
  back,
  actions,
}: {
  title: string;
  description?: string;
  back?: { href: string; label: string };
  actions?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {back ? (
          <Link href={back.href} className="mb-2 inline-block text-sm text-slate-text hover:text-navy-800">
            ← {back.label}
          </Link>
        ) : null}
        <h1 className="text-[1.5rem] leading-tight tracking-tight break-words sm:text-[1.75rem]">{title}</h1>
        {description ? <p className="mt-1 text-sm text-slate-text">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

export function AdminCard({ title, children, className, actions }: { title?: string; children: React.ReactNode; className?: string; actions?: React.ReactNode }) {
  return (
    <section className={cn("min-w-0 rounded-xl border border-line bg-white p-4 sm:p-6", className)}>
      {title ? (
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold tracking-normal text-ink">{title}</h2>
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  );
}

const STATUS_STYLES: Record<string, string> = {
  new: "bg-cyan-50 text-cyan-700 ring-cyan-500/30",
  under_review: "bg-amber-50 text-amber-800 ring-amber-500/30",
  in_progress: "bg-amber-50 text-amber-800 ring-amber-500/30",
  contacted: "bg-violet-50 text-violet-800 ring-violet-500/30",
  approved: "bg-emerald-50 text-emerald-800 ring-emerald-500/30",
  confirmed: "bg-emerald-50 text-emerald-800 ring-emerald-500/30",
  converted_to_order: "bg-navy-100 text-navy-800 ring-navy-800/20",
  processing: "bg-cyan-50 text-cyan-700 ring-cyan-500/30",
  dispatched: "bg-violet-50 text-violet-800 ring-violet-500/30",
  delivered: "bg-emerald-50 text-emerald-800 ring-emerald-500/30",
  rejected: "bg-red-50 text-red-700 ring-red-500/30",
  cancelled: "bg-red-50 text-red-700 ring-red-500/30",
  closed: "bg-slate-100 text-slate-700 ring-slate-400/30",
  published: "bg-emerald-50 text-emerald-800 ring-emerald-500/30",
  draft: "bg-slate-100 text-slate-700 ring-slate-400/30",
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset", STATUS_STYLES[status] ?? STATUS_STYLES.draft)}>
      {label ?? status.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase())}
    </span>
  );
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-white px-6 py-14 text-center">
      <p className="font-semibold text-ink">{title}</p>
      {text ? <p className="mx-auto mt-1 max-w-md text-sm text-slate-text">{text}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function FieldRow({ label, hint, children, className }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-sm font-medium text-ink">
        {label}
        {hint ? <span className="ml-1.5 font-normal text-slate-text">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

export const primaryButton =
  "inline-flex h-10 items-center justify-center gap-2 rounded-md bg-navy-800 px-4 text-sm font-semibold text-white transition-colors hover:bg-navy-950 disabled:opacity-60";
export const secondaryButton =
  "inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#cdd5df] bg-white px-4 text-sm font-semibold text-navy-800 transition-colors hover:bg-steel disabled:opacity-60";
export const dangerButton =
  "inline-flex h-10 items-center justify-center gap-2 rounded-md border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:opacity-60";

export function formatDate(value: string) {
  return new Date(value).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
