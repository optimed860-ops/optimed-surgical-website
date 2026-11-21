"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { assertAdmin } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { dbError, fail, ok, type ActionResult } from "../result";
import { INQUIRY_STATUSES, ORDER_STATUSES, QUOTATION_STATUSES } from "../statuses";


const notes = z
  .string()
  .max(10000)
  .optional()
  .transform((v) => (v?.trim() ? v.trim() : null));

// ── Quotations ────────────────────────────────────────────────────────────────

export async function updateQuotation(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await assertAdmin();
  const parsed = z
    .object({ id: z.uuid(), status: z.enum(QUOTATION_STATUSES), internalNotes: notes })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail("Check the status and notes.");
  const supabase = await createClient();
  const { error } = await supabase
    .from("quotations")
    .update({ status: parsed.data.status, internal_notes: parsed.data.internalNotes })
    .eq("id", parsed.data.id);
  if (error) return dbError(error);
  refresh();
  return ok("Saved.");
}

/** Creates an order from a quotation's items and contact details. */
export async function createOrderFromQuotation(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = z.uuid().parse(formData.get("id"));
  const supabase = await createClient();
  const [{ data: q }, { data: items }] = await Promise.all([
    supabase.from("quotations").select("id, customer_name, company_name, business_email, phone_number, country, requested_items_text").eq("id", id).maybeSingle(),
    supabase.from("quotation_items").select("product_id, product_name_snapshot, product_code_snapshot, quantity").eq("quotation_id", id),
  ]);
  if (!q) redirect("/admin/quotations");

  const orderItems = (items ?? []).map((i) => ({
    product_id: i.product_id,
    product_name: i.product_name_snapshot,
    product_code: i.product_code_snapshot,
    quantity: i.quantity,
  }));
  // A text-only quote has no product rows: keep one line so the order is valid.
  if (orderItems.length === 0) {
    orderItems.push({ product_id: null, product_name: "Items as described in the quotation", product_code: null, quantity: 1 });
  }

  const { data: orderId, error } = await supabase.rpc("create_order", {
    p_payload: {
      quotation_id: q.id,
      customer_name: q.customer_name,
      company_name: q.company_name,
      customer_email: q.business_email,
      phone_number: q.phone_number,
      country: q.country,
      internal_notes: q.requested_items_text ? `Requested items:\n${q.requested_items_text}`.slice(0, 10000) : null,
      items: orderItems,
    },
  });
  if (error || !orderId) redirect(`/admin/quotations/${id}?error=order`);
  redirect(`/admin/orders/${orderId}?created=1`);
}

// ── Inquiries (contact + catalogue messages) ──────────────────────────────────

export async function updateInquiry(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await assertAdmin();
  const parsed = z
    .object({ id: z.uuid(), status: z.enum(INQUIRY_STATUSES), internalNotes: notes })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail("Check the status and notes.");
  const supabase = await createClient();
  const { error } = await supabase
    .from("inquiries")
    .update({ status: parsed.data.status, internal_notes: parsed.data.internalNotes })
    .eq("id", parsed.data.id);
  if (error) return dbError(error);
  refresh();
  return ok("Saved.");
}

// ── Orders ────────────────────────────────────────────────────────────────────

export async function addOrderUpdate(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await assertAdmin();
  const parsed = z
    .object({ id: z.uuid(), status: z.enum(ORDER_STATUSES), message: z.string().max(5000).optional() })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail("Check the status and message.");
  const supabase = await createClient();
  const { error } = await supabase.rpc("add_order_update", {
    p_order_id: parsed.data.id,
    p_status: parsed.data.status,
    p_message: parsed.data.message ?? "",
  });
  if (error) return dbError(error);
  refresh();
  return ok("Update added.");
}

export async function saveOrderDetails(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await assertAdmin();
  const parsed = z
    .object({
      id: z.uuid(),
      internalReference: z.string().trim().max(80).optional(),
      internalNotes: notes,
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail("Check the reference and notes.");
  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({ internal_reference: parsed.data.internalReference || null, internal_notes: parsed.data.internalNotes })
    .eq("id", parsed.data.id);
  if (error) return dbError(error);
  refresh();
  return ok("Saved.");
}

export async function deleteOrder(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = z.uuid().parse(formData.get("id"));
  const supabase = await createClient();
  const { error } = await supabase.from("orders").delete().eq("id", id);
  if (error) redirect(`/admin/orders/${id}?error=delete`);
  redirect("/admin/orders?deleted=1");
}
