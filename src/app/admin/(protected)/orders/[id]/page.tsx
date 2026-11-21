import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { AdminCard, AdminHeader, FieldRow, StatusBadge, adminInput, dangerButton, formatDate, primaryButton, secondaryButton } from "@/features/admin/ui";
import { ActionForm, SubmitButton } from "@/features/admin/client-ui";
import { addOrderUpdate, deleteOrder, saveOrderDetails } from "@/features/admin/actions/requests";
import { ORDER_STATUSES, statusLabel } from "@/features/admin/statuses";

export const metadata: Metadata = { title: "Order" };

export default async function OrderPage({ params, searchParams }: PageProps<"/admin/orders/[id]">) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  if (!z.uuid().safeParse(id).success) notFound();

  const supabase = await createClient();
  const [{ data: o }, { data: items }, { data: updates }] = await Promise.all([
    supabase
      .from("orders")
      .select("id, order_reference, internal_reference, quotation_id, customer_name, company_name, customer_email, phone_number, country, status, internal_notes, created_at, quotations(reference_number)")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("order_items").select("id, product_name_snapshot, product_code_snapshot, quantity").eq("order_id", id).order("created_at"),
    supabase.from("order_updates").select("id, status, message, created_at").eq("order_id", id).order("created_at", { ascending: false }),
  ]);
  if (!o) notFound();
  const quotation = o.quotations as unknown as { reference_number: string } | null;

  return (
    <>
      <AdminHeader
        title={o.order_reference}
        description={`Created ${formatDate(o.created_at)}`}
        back={{ href: "/admin/orders", label: "Orders" }}
        actions={
          <>
            {o.quotation_id && quotation ? (
              <Link href={`/admin/quotations/${o.quotation_id}`} className={secondaryButton}>Quotation {quotation.reference_number}</Link>
            ) : null}
            <form action={deleteOrder}>
              <input type="hidden" name="id" value={o.id} />
              <SubmitButton className={dangerButton} confirm={`Delete order ${o.order_reference} and its history? This cannot be undone.`}>
                <Trash2 className="size-4" aria-hidden /> Delete
              </SubmitButton>
            </form>
          </>
        }
      />
      {sp.created ? <p className="mb-5 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">Order created.</p> : null}
      {sp.error === "delete" ? <p className="mb-5 rounded-md bg-red-50 p-3 text-sm text-red-800">The order could not be deleted. Run SQL file 11 in Supabase first.</p> : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <AdminCard title="Customer">
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              {([
                ["Name", o.customer_name],
                ["Company", o.company_name],
                ["Email", o.customer_email],
                ["Phone", o.phone_number],
                ["Country", o.country],
              ] as const).map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-slate-text">{label}</dt>
                  <dd className="mt-0.5 font-medium text-ink">{value || "—"}</dd>
                </div>
              ))}
              <div>
                <dt className="text-xs text-slate-text">Status</dt>
                <dd className="mt-0.5"><StatusBadge status={o.status} /></dd>
              </div>
            </dl>
          </AdminCard>

          <AdminCard title="Items">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-xs text-slate-text">
                <tr>
                  <th className="py-2 font-semibold">Product</th>
                  <th className="py-2 font-semibold">Code</th>
                  <th className="py-2 text-right font-semibold">Quantity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {(items ?? []).map((i) => (
                  <tr key={i.id}>
                    <td className="py-2.5">{i.product_name_snapshot}</td>
                    <td className="py-2.5 font-mono text-xs">{i.product_code_snapshot ?? "—"}</td>
                    <td className="py-2.5 text-right tabular-nums">{i.quantity.toLocaleString("en")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminCard>

          <AdminCard title="History">
            <ol className="space-y-4">
              {(updates ?? []).map((u) => (
                <li key={u.id} className="border-l-2 border-line pl-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={u.status} />
                    <span className="text-xs text-slate-text">{formatDate(u.created_at)}</span>
                  </div>
                  {u.message ? <p className="mt-1.5 text-sm whitespace-pre-wrap">{u.message}</p> : null}
                </li>
              ))}
            </ol>
          </AdminCard>
        </div>

        <div className="space-y-6">
          <AdminCard title="Update status">
            <ActionForm action={addOrderUpdate} resetOnSuccess className="space-y-4">
              <input type="hidden" name="id" value={o.id} />
              <FieldRow label="New status">
                <select name="status" defaultValue={o.status} className={`${adminInput} h-10`}>
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>{statusLabel(s)}</option>
                  ))}
                </select>
              </FieldRow>
              <FieldRow label="Note" hint="optional, e.g. tracking number">
                <textarea name="message" rows={3} maxLength={5000} className={`${adminInput} py-2`} />
              </FieldRow>
              <SubmitButton className={primaryButton}>Add update</SubmitButton>
            </ActionForm>
          </AdminCard>

          <AdminCard title="Internal details">
            <ActionForm action={saveOrderDetails} className="space-y-4">
              <input type="hidden" name="id" value={o.id} />
              <FieldRow label="Your reference" hint="optional">
                <input name="internalReference" maxLength={80} defaultValue={o.internal_reference ?? ""} className={`${adminInput} h-10`} />
              </FieldRow>
              <FieldRow label="Internal notes">
                <textarea name="internalNotes" rows={5} maxLength={10000} defaultValue={o.internal_notes ?? ""} className={`${adminInput} py-2`} />
              </FieldRow>
              <SubmitButton className={secondaryButton}>Save</SubmitButton>
            </ActionForm>
          </AdminCard>
        </div>
      </div>
    </>
  );
}
