import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AdminCard, StatusBadge, formatDate } from "@/features/admin/ui";
import type { DashboardMetrics } from "@/types/database";

export const metadata: Metadata = { title: "Dashboard" };

const METRICS: { key: keyof DashboardMetrics; label: string }[] = [
  { key: "total_products", label: "Total products" },
  { key: "published_products", label: "Published products" },
  { key: "total_quotations", label: "Total quotations" },
  { key: "new_quotations", label: "New quotations" },
  { key: "active_orders", label: "Active orders" },
  { key: "total_orders", label: "Total orders" },
  { key: "new_inquiries", label: "New inquiries" },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  // Real counts from the database (admin-only function). No placeholder numbers.
  const [{ data, error }, { data: quotes }, { data: messages }] = await Promise.all([
    supabase.rpc("dashboard_metrics"),
    supabase.from("quotations").select("id, reference_number, company_name, status, created_at").order("created_at", { ascending: false }).limit(6),
    supabase.from("inquiries").select("id, reference_number, customer_name, status, created_at").order("created_at", { ascending: false }).limit(6),
  ]);
  const metrics = data as DashboardMetrics | null;

  return (
    <>
      <header className="mb-8">
        <h1 className="text-h2">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Live figures from your database.</p>
      </header>

      {error || !metrics ? (
        <div role="alert" className="rounded-md border border-destructive/30 bg-white p-4 text-sm">
          Couldn&apos;t load the dashboard figures. Check that all SQL files have been run in Supabase, then
          refresh this page.
        </div>
      ) : (
        <dl className="grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2 xl:grid-cols-3">
          {METRICS.map(({ key, label }) => (
            <div key={key} className="bg-white p-5">
              <dt className="text-sm text-muted-foreground">{label}</dt>
              <dd className="mt-2 font-heading text-[2rem] leading-none text-navy-900 tabular-nums">
                {metrics[key].toLocaleString("en")}
              </dd>
            </div>
          ))}
        </dl>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <AdminCard title="Latest quotations" actions={<Link href="/admin/quotations" className="text-sm font-semibold text-navy-800 hover:underline">View all</Link>}>
          <RecentList empty="No quotations yet." rows={(quotes ?? []).map((q) => ({ id: q.id, href: `/admin/quotations/${q.id}`, ref: q.reference_number, name: q.company_name, status: q.status, at: q.created_at }))} />
        </AdminCard>
        <AdminCard title="Latest messages" actions={<Link href="/admin/inquiries" className="text-sm font-semibold text-navy-800 hover:underline">View all</Link>}>
          <RecentList empty="No messages yet." rows={(messages ?? []).map((m) => ({ id: m.id, href: `/admin/inquiries/${m.id}`, ref: m.reference_number, name: m.customer_name, status: m.status, at: m.created_at }))} />
        </AdminCard>
      </div>
    </>
  );
}

function RecentList({ rows, empty }: { rows: { id: string; href: string; ref: string; name: string; status: string; at: string }[]; empty: string }) {
  if (rows.length === 0) return <p className="text-sm text-slate-text">{empty}</p>;
  return (
    <ul className="-mx-2 divide-y divide-line">
      {rows.map((r) => (
        <li key={r.id}>
          <Link href={r.href} className="flex items-center gap-3 rounded px-2 py-2.5 text-sm hover:bg-steel/60">
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium text-ink">{r.name}</span>
              <span className="block font-mono text-xs text-slate-text">{r.ref}, {formatDate(r.at)}</span>
            </span>
            <StatusBadge status={r.status} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
