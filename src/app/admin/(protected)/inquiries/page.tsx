import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AdminHeader, EmptyState, StatusBadge, formatDate } from "@/features/admin/ui";
import { StatusFilter, pickParam } from "@/features/admin/components/status-filter";
import { INQUIRY_STATUSES } from "@/features/admin/statuses";
import { sanitizeSearch } from "@/features/catalogue/search";

export const metadata: Metadata = { title: "Messages" };

export default async function AdminInquiriesPage({ searchParams }: PageProps<"/admin/inquiries">) {
  const sp = await searchParams;
  const status = (INQUIRY_STATUSES as readonly string[]).includes(pickParam(sp.status) ?? "") ? pickParam(sp.status) : undefined;
  const q = sanitizeSearch(pickParam(sp.q));

  const supabase = await createClient();
  let query = supabase
    .from("inquiries")
    .select("id, reference_number, inquiry_type, customer_name, company_name, email, product_interest, status, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (status) query = query.eq("status", status as never);
  if (q) query = query.or(`customer_name.ilike.%${q}%,company_name.ilike.%${q}%,email.ilike.%${q}%,reference_number.ilike.%${q}%`);
  const { data } = await query;
  const rows = data ?? [];

  return (
    <>
      <AdminHeader title="Messages" description="Contact form and catalogue requests." />
      <StatusFilter basePath="/admin/inquiries" statuses={INQUIRY_STATUSES} current={status} q={q} searchPlaceholder="Name, company, email or INQ- number" />
      {rows.length === 0 ? (
        <EmptyState title="No messages found" text={status || q ? "Try another filter." : "Contact form and catalogue requests appear here."} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-white">
          <ul className="divide-y divide-line">
            {rows.map((r) => (
              <li key={r.id}>
                <Link href={`/admin/inquiries/${r.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-steel/40 sm:flex-nowrap">
                  <span className="w-20 shrink-0 text-xs font-semibold text-slate-text">{r.inquiry_type === "catalogue" ? "Catalogue" : "Contact"}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-ink">
                      {r.customer_name}
                      {r.company_name ? <span className="font-normal text-slate-text">, {r.company_name}</span> : null}
                    </span>
                    <span className="block truncate text-xs text-slate-text">{r.product_interest ? `${r.email}, interested in ${r.product_interest}` : r.email}</span>
                  </span>
                  <StatusBadge status={r.status} />
                  <span className="text-xs whitespace-nowrap text-slate-text">{formatDate(r.created_at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
