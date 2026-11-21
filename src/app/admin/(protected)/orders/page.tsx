import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AdminHeader, EmptyState, StatusBadge, formatDate } from "@/features/admin/ui";
import { StatusFilter, pickParam } from "@/features/admin/components/status-filter";
import { ORDER_STATUSES } from "@/features/admin/statuses";
import { sanitizeSearch } from "@/features/catalogue/search";

export const metadata: Metadata = { title: "Orders" };

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  const sp = await searchParams;
  const status = (ORDER_STATUSES as readonly string[]).includes(pickParam(sp.status) ?? "") ? pickParam(sp.status) : undefined;
  const q = sanitizeSearch(pickParam(sp.q));

  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select("id, order_reference, internal_reference, company_name, customer_name, country, status, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (status) query = query.eq("status", status as never);
  if (q) query = query.or(`company_name.ilike.%${q}%,customer_email.ilike.%${q}%,order_reference.ilike.%${q}%,internal_reference.ilike.%${q}%`);
  const { data } = await query;
  const rows = data ?? [];

  return (
    <>
      <AdminHeader title="Orders" description="Create an order from a quotation, then track its progress here." />
      {sp.deleted ? <p className="mb-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">Order deleted.</p> : null}
      <StatusFilter basePath="/admin/orders" statuses={ORDER_STATUSES} current={status} q={q} searchPlaceholder="Company, email or ORD- number" />
      {rows.length === 0 ? (
        <EmptyState
          title="No orders found"
          text={status || q ? "Try another filter." : "Open a quotation and choose “Create order” to start one."}
          action={!status && !q ? <Link href="/admin/quotations" className="text-sm font-semibold text-navy-800 hover:underline">Go to quotations</Link> : undefined}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-white">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-line bg-steel/60 text-xs text-slate-text">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Order</th>
                <th className="px-4 py-2.5 font-semibold">Company</th>
                <th className="px-4 py-2.5 font-semibold">Country</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
                <th className="px-4 py-2.5 font-semibold">Last update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-steel/40">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${r.id}`} className="font-mono text-xs font-semibold text-navy-800 hover:underline">{r.order_reference}</Link>
                    {r.internal_reference ? <p className="text-xs text-slate-text">{r.internal_reference}</p> : null}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{r.company_name}</p>
                    <p className="text-xs text-slate-text">{r.customer_name}</p>
                  </td>
                  <td className="px-4 py-3">{r.country ?? "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap text-slate-text">{formatDate(r.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
