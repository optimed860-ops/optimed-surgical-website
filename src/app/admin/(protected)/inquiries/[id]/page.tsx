import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { AdminCard, AdminHeader, FieldRow, StatusBadge, adminInput, formatDate, primaryButton } from "@/features/admin/ui";
import { ActionForm, SubmitButton } from "@/features/admin/client-ui";
import { updateInquiry } from "@/features/admin/actions/requests";
import { INQUIRY_STATUSES, statusLabel } from "@/features/admin/statuses";

export const metadata: Metadata = { title: "Message" };

export default async function InquiryPage({ params }: PageProps<"/admin/inquiries/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const supabase = await createClient();
  const { data: m } = await supabase
    .from("inquiries")
    .select("id, reference_number, inquiry_type, customer_name, company_name, email, phone_number, country, product_interest, requested_items_text, message, status, internal_notes, created_at")
    .eq("id", id)
    .maybeSingle();
  if (!m) notFound();

  const rows: [string, React.ReactNode][] = [
    ["Type", m.inquiry_type === "catalogue" ? "Catalogue request" : "Contact form"],
    ["Name", m.customer_name],
    ["Company", m.company_name],
    ["Email", <a key="e" href={`mailto:${m.email}`} className="text-navy-800 hover:underline">{m.email}</a>],
    ["Phone", m.phone_number ? <a key="p" href={`tel:${m.phone_number.replace(/[^\d+]/g, "")}`} className="text-navy-800 hover:underline">{m.phone_number}</a> : null],
    ["Country", m.country],
    ["Interested in", m.product_interest],
    ["Status", <StatusBadge key="s" status={m.status} />],
  ];

  return (
    <>
      <AdminHeader title={m.reference_number} description={`Received ${formatDate(m.created_at)}`} back={{ href: "/admin/inquiries", label: "Messages" }} />
      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <AdminCard title="Sender">
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              {rows.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-slate-text">{label}</dt>
                  <dd className="mt-0.5 font-medium text-ink">{value || "—"}</dd>
                </div>
              ))}
            </dl>
          </AdminCard>
          {m.requested_items_text ? (
            <AdminCard title="Requested items">
              <p className="text-sm whitespace-pre-wrap">{m.requested_items_text}</p>
            </AdminCard>
          ) : null}
          <AdminCard title="Message">
            <p className="text-sm whitespace-pre-wrap">{m.message || "No message."}</p>
          </AdminCard>
        </div>

        <AdminCard title="Follow-up">
          <ActionForm action={updateInquiry} className="space-y-4">
            <input type="hidden" name="id" value={m.id} />
            <FieldRow label="Status">
              <select name="status" defaultValue={m.status} className={`${adminInput} h-10`}>
                {INQUIRY_STATUSES.map((s) => (
                  <option key={s} value={s}>{statusLabel(s)}</option>
                ))}
              </select>
            </FieldRow>
            <FieldRow label="Internal notes" hint="only admins see this">
              <textarea name="internalNotes" rows={6} maxLength={10000} defaultValue={m.internal_notes ?? ""} className={`${adminInput} py-2`} />
            </FieldRow>
            <SubmitButton className={primaryButton}>Save</SubmitButton>
          </ActionForm>
        </AdminCard>
      </div>
    </>
  );
}
