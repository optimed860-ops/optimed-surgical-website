import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AdminHeader, EmptyState, StatusBadge, formatDate } from "@/features/admin/ui";
import { StatusFilter, pickParam } from "@/features/admin/components/status-filter";
import { QUOTATION_STATUSES } from "@/features/admin/statuses";
import { sanitizeSearch } from "@/features/catalogue/search";

export const metadata: Metadata = { title: "Quotations" };

export default async function AdminQuotationsPage({ searchParams }: PageProps<"/admin/quotations">) {
  const sp = await searchParams;
  const status = (QUOTATION_STATUSES as readonly string[]).includes(pickParam(sp.status) ?? "") ? pickParam(sp.status) : undefined;
  const q = sanitizeSearch(pickParam(sp.q));

  const supabase = await createClient();
  let query = supabase
    .from("quotations")
    .select("id, reference_number, customer_name, company_name, business_email, country, status, created_at, quotation_items(count)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (status) query = query.eq("status", status as never);
  if (q) query = query.or(`company_name.ilike.%${q}%,business_email.ilike.%${q}%,customer_name.ilike.%${q}%,reference_number.ilike.%${q}%`);
  const { data } = await query;
  type Row = {
    id: string;
    reference_number: string;
    customer_name: string;
    company_name: string;
    business_email: string;
    country: string;
    status: string;
    created_at: string;
    quotation_items: { count: number }[] | null;
  };
  const rows = (data ?? []) as unknown as Row[];

  return (
    <>
      <AdminHeader title="Quotations" description="Quote requests sent from the website." />
      <StatusFilter basePath="/admin/quotations" statuses={QUOTATION_STATUSES} current={status} q={q} searchPlaceholder="Company, email, name or QT- number" />
      {rows.length === 0 ? (
        <EmptyState title="No quotations found" text={status || q ? "Try another filter." : "When a buyer sends a quote request, it appears here."} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-white">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="border-b border-line bg-steel/60 text-xs text-slate-text">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Reference</th>
                <th className="px-4 py-2.5 font-semibold">Company</th>
                <th className="px-4 py-2.5 font-semibold">Country</th>
                <th className="px-4 py-2.5 font-semibold">Items</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
                <th className="px-4 py-2.5 font-semibold">Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-steel/40">
                  <td className="px-4 py-3">
                    <Link href={`/admin/quotations/${r.id}`} className="font-mono text-xs font-semibold text-navy-800 hover:underline">
                      {r.reference_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{r.company_name}</p>
                    <p className="text-xs text-slate-text">{r.customer_name}, {r.business_email}</p>
                  </td>
                  <td className="px-4 py-3">{r.country}</td>
                  <td className="px-4 py-3 tabular-nums">{r.quotation_items?.[0]?.count || "Text"}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap text-slate-text">{formatDate(r.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
