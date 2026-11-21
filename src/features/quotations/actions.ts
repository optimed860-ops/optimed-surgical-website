"use server";

import { headers } from "next/headers";
import { after } from "next/server";
import { notifyAdmin } from "@/lib/email/notify";
import { z } from "zod";
import { QUOTE_LIMITS } from "@/config/limits";
import { serverEnv } from "@/config/server-env";
import { createSecretClient } from "@/lib/supabase/admin";
import { clientIpFrom, hashVisitorKey } from "@/lib/security/visitor-key";
import { getProductsByIds } from "@/features/catalogue/queries";
import { inquirySubmissionSchema, quoteSubmissionSchema, toInquiryPayload, toSubmitPayload } from "./schemas";

export type SubmittedItem = { productName: string; productCode: string | null; quantity: number };

export type SubmitQuotationResult =
  | { ok: true; reference: string; createdAt: string; items: SubmittedItem[]; requestedItemsText: string | null }
  | { ok: false; error: string; fieldErrors?: Record<string, string>; unavailableProducts?: boolean };

const GENERIC_ERROR =
  "We couldn't send your request right now. Please try again in a moment. Your quote list has been kept.";

/**
 * Public quotation submission.
 * 1. Validate everything on the server (never trust the browser).
 * 2. Bot checks: honeypot field + minimum time on the form.
 * 3. Save through submit_quotation(), which re-checks products, takes names and
 *    codes from the database, rate-limits per hashed IP and is idempotent.
 * 4. Report success only after the database has saved the request.
 * The request appears in the admin panel; an optional email alert is sent afterwards.
 */
export async function submitQuotation(input: unknown): Promise<SubmitQuotationResult> {
  const parsed = quoteSubmissionSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return { ok: false, error: "Please check the highlighted fields.", fieldErrors };
  }

  const data = parsed.data;
  // Bots fill the hidden field or submit instantly. Give them a vague error.
  if (data.website || data.elapsedMs < QUOTE_LIMITS.minFillMilliseconds) {
    return { ok: false, error: GENERIC_ERROR };
  }

  let env;
  try {
    env = serverEnv();
  } catch (error) {
    console.error("[quotation] server not configured", (error as Error).message);
    return { ok: false, error: GENERIC_ERROR };
  }

  const keyHash = hashVisitorKey(clientIpFrom(await headers()), env.RATE_LIMIT_HMAC_SECRET);
  const { data: result, error } = await createSecretClient().rpc("submit_quotation", {
    p_payload: toSubmitPayload(data),
    p_key_hash: keyHash,
  });

  if (error) {
    const code = error.message?.trim();
    if (code === "RATE_LIMITED") {
      return {
        ok: false,
        error: "You've sent several requests in a short time. Please wait a few minutes and try again.",
      };
    }
    if (code === "INVALID_PRODUCTS") {
      return {
        ok: false,
        unavailableProducts: true,
        error: "Some products in your list are no longer available. We've refreshed your list; please review it and submit again.",
      };
    }
    if (code === "INVALID_ITEMS") {
      return { ok: false, error: "Please check the products and quantities in your list." };
    }
    console.error("[quotation] submit failed", error.code, error.message);
    return { ok: false, error: GENERIC_ERROR };
  }

  const saved = z
    .object({
      reference_number: z.string(),
      created_at: z.string(),
      requested_items_text: z.string().nullable().optional(),
      items: z.array(z.object({ product_name: z.string(), product_code: z.string().nullable(), quantity: z.number() })),
    })
    .safeParse(result);

  if (!saved.success) {
    console.error("[quotation] unexpected response shape");
    return { ok: false, error: GENERIC_ERROR };
  }

  const ref = saved.data.reference_number;
  after(() =>
    notifyAdmin({
      subject: `New quote request ${ref} from ${data.companyName}`,
      heading: `New quote request ${ref}`,
      replyTo: data.businessEmail,
      adminPath: "/admin/quotations",
      lines: [
        ["Name", data.customerName],
        ["Company", data.companyName],
        ["Email", data.businessEmail],
        ["Phone", data.phoneNumber],
        ["Country", data.country],
      ],
      sections: [
        ["Products", saved.data.items.map((i) => `- ${i.product_name}${i.product_code ? ` (${i.product_code})` : ""} x ${i.quantity}`).join("\n")],
        ["Items written by the buyer", saved.data.requested_items_text ?? null],
        ["Message", data.additionalMessage],
      ],
    }),
  );

  return {
    ok: true,
    reference: ref,
    createdAt: saved.data.created_at,
    requestedItemsText: saved.data.requested_items_text ?? null,
    items: saved.data.items.map((item) => ({
      productName: item.product_name,
      productCode: item.product_code,
      quantity: item.quantity,
    })),
  };
}

export type SubmitInquiryResult =
  | { ok: true; reference: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/** Catalogue requests and contact messages. Saved for the admin panel, plus an optional email alert. */
export async function submitInquiry(input: unknown): Promise<SubmitInquiryResult> {
  const parsed = inquirySubmissionSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0] ?? "form")] ??= issue.message;
    return { ok: false, error: "Please check the highlighted fields.", fieldErrors };
  }
  const data = parsed.data;
  if (data.website || data.elapsedMs < QUOTE_LIMITS.minFillMilliseconds) return { ok: false, error: GENERIC_ERROR_SHORT };

  let env;
  try {
    env = serverEnv();
  } catch (error) {
    console.error("[inquiry] server not configured", (error as Error).message);
    return { ok: false, error: GENERIC_ERROR_SHORT };
  }

  const keyHash = hashVisitorKey(clientIpFrom(await headers()), env.RATE_LIMIT_HMAC_SECRET, "inquiry");
  const { data: result, error } = await createSecretClient().rpc("submit_inquiry", {
    p_payload: toInquiryPayload(data),
    p_key_hash: keyHash,
  });
  if (error) {
    if (error.message?.trim() === "RATE_LIMITED") {
      return { ok: false, error: "You've sent several messages in a short time. Please wait a few minutes and try again." };
    }
    console.error("[inquiry] submit failed", error.code, error.message);
    return { ok: false, error: GENERIC_ERROR_SHORT };
  }
  const saved = z.object({ reference_number: z.string() }).safeParse(result);
  if (!saved.success) return { ok: false, error: GENERIC_ERROR_SHORT };
  const ref = saved.data.reference_number;
  const kind = data.inquiryType === "catalogue" ? "Catalogue request" : "Contact message";
  after(() =>
    notifyAdmin({
      subject: `${kind} ${ref} from ${data.customerName}`,
      heading: `New ${kind.toLowerCase()} ${ref}`,
      replyTo: data.email,
      adminPath: "/admin/inquiries",
      lines: [
        ["Name", data.customerName],
        ["Company", data.companyName],
        ["Email", data.email],
        ["Phone", data.phoneNumber],
        ["Country", data.country],
        ["Interested in", data.productInterest],
      ],
      sections: [
        ["Requested items", data.requestedItemsText],
        ["Message", data.message],
      ],
    }),
  );
  return { ok: true, reference: ref };
}

const GENERIC_ERROR_SHORT = "We couldn't send your request right now. Please try again in a moment.";

/** Fresh public details for the products in a visitor's quote list (drops unavailable ones). */
export async function refreshBasket(productIds: unknown) {
  const ids = z.array(z.uuid()).max(QUOTE_LIMITS.maxLines).safeParse(productIds);
  if (!ids.success) return [];
  const products = await getProductsByIds(ids.data);
  return products.map((p) => ({
    productId: p.id,
    name: p.name,
    slug: p.slug,
    productCode: p.productCode,
    imagePath: p.image?.path ?? null,
  }));
}
