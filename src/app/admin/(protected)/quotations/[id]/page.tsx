import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, Phone, ShoppingBag } from "lucide-react";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { AdminCard, AdminHeader, FieldRow, StatusBadge, adminInput, formatDate, primaryButton, secondaryButton } from "@/features/admin/ui";
import { ActionForm, SubmitButton } from "@/features/admin/client-ui";
import { createOrderFromQuotation, updateQuotation } from "@/features/admin/actions/requests";
import { QUOTATION_STATUSES, statusLabel } from "@/features/admin/statuses";

export const metadata: Metadata = { title: "Quotation" };

export default async function QuotationPage({ params, searchParams }: PageProps<"/admin/quotations/[id]">) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  if (!z.uuid().safeParse(id).success) notFound();

  const supabase = await createClient();
  const [{ data: q }, { data: items }, { data: orders }] = await Promise.all([
    supabase
      .from("quotations")
      .select("id, reference_number, customer_name, company_name, business_email, phone_number, country, additional_message, requested_items_text, status, internal_notes, created_at")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("quotation_items").select("id, product_id, product_name_snapshot, product_code_snapshot, quantity").eq("quotation_id", id).order("created_at"),
    supabase.from("orders").select("id, order_reference").eq("quotation_id", id),
  ]);
  if (!q) notFound();

  return (
    <>
      <AdminHeader
        title={q.reference_number}
        description={`Received ${formatDate(q.created_at)}`}
        back={{ href: "/admin/quotations", label: "Quotations" }}
        actions={
          orders && orders.length > 0 ? (
            <Link href={`/admin/orders/${orders[0].id}`} className={secondaryButton}>
              <ShoppingBag className="size-4" aria-hidden /> Open order {orders[0].order_reference}
            </Link>
          ) : (
            <form action={createOrderFromQuotation}>
              <input type="hidden" name="id" value={q.id} />
              <SubmitButton className={primaryButton} confirm="Create an order from this quotation?">
                <ShoppingBag className="size-4" aria-hidden /> Create order
              </SubmitButton>
            </form>
          )
        }
      />
      {sp.error === "order" ? <p className="mb-5 rounded-md bg-red-50 p-3 text-sm text-red-800">The order could not be created. Check that all SQL files have been run.</p> : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <AdminCard title="Buyer">
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <Detail label="Name" value={q.customer_name} />
              <Detail label="Company" value={q.company_name} />
              <Detail label="Email">
                <a href={`mailto:${q.business_email}?subject=${encodeURIComponent(`Your quotation ${q.reference_number}`)}`} className="inline-flex items-center gap-1.5 text-navy-800 hover:underline">
                  <Mail className="size-3.5" aria-hidden /> {q.business_email}
                </a>
              </Detail>
              <Detail label="Phone">
                <a href={`tel:${q.phone_number.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-1.5 text-navy-800 hover:underline">
                  <Phone className="size-3.5" aria-hidden /> {q.phone_number}
                </a>
              </Detail>
              <Detail label="Country" value={q.country} />
              <Detail label="Status"><StatusBadge status={q.status} /></Detail>
            </dl>
          </AdminCard>

          <AdminCard title="Requested items">
            {items && items.length > 0 ? (
              <table className="mb-4 w-full text-left text-sm">
                <thead className="border-b border-line text-xs text-slate-text">
                  <tr>
                    <th className="py-2 font-semibold">Product</th>
                    <th className="py-2 font-semibold">Code</th>
                    <th className="py-2 text-right font-semibold">Quantity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {items.map((i) => (
                    <tr key={i.id}>
                      <td className="py-2.5">
                        {i.product_id ? (
                          <Link href={`/admin/products/${i.product_id}`} className="text-navy-800 hover:underline">{i.product_name_snapshot}</Link>
                        ) : (
                          i.product_name_snapshot
                        )}
                      </td>
                      <td className="py-2.5 font-mono text-xs">{i.product_code_snapshot ?? "—"}</td>
                      <td className="py-2.5 text-right tabular-nums">{i.quantity.toLocaleString("en")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
            {q.requested_items_text ? (
              <div>
                <p className="mb-1.5 text-xs font-semibold text-slate-text">Written by the buyer</p>
                <p className="rounded-md bg-steel/70 p-3 text-sm whitespace-pre-wrap">{q.requested_items_text}</p>
              </div>
            ) : null}
            {!items?.length && !q.requested_items_text ? <p className="text-sm text-slate-text">No items listed.</p> : null}
          </AdminCard>

          {q.additional_message ? (
            <AdminCard title="Message">
              <p className="text-sm whitespace-pre-wrap">{q.additional_message}</p>
            </AdminCard>
          ) : null}
        </div>

        <AdminCard title="Follow-up">
          <ActionForm action={updateQuotation} className="space-y-4">
            <input type="hidden" name="id" value={q.id} />
            <FieldRow label="Status">
              <select name="status" defaultValue={q.status} className={`${adminInput} h-10`}>
                {QUOTATION_STATUSES.map((s) => (
                  <option key={s} value={s}>{statusLabel(s)}</option>
                ))}
              </select>
            </FieldRow>
            <FieldRow label="Internal notes" hint="only admins see this">
              <textarea name="internalNotes" rows={6} maxLength={10000} defaultValue={q.internal_notes ?? ""} className={`${adminInput} py-2`} />
            </FieldRow>
            <SubmitButton className={primaryButton}>Save</SubmitButton>
          </ActionForm>
        </AdminCard>
      </div>
    </>
  );
}

function Detail({ label, value, children }: { label: string; value?: string | null; children?: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-slate-text">{label}</dt>
      <dd className="mt-0.5 font-medium text-ink">{children ?? (value || "—")}</dd>
    </div>
  );
}
