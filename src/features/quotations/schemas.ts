import { z } from "zod";
import { FIELD_LIMITS, QUOTE_LIMITS } from "@/config/limits";

const trimmed = (min: number, max: number, label: string) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .min(min, min <= 1 ? `${label} is required` : `${label} must be at least ${min} characters`)
    .max(max, `${label} must be at most ${max} characters`);

/** One line in the quote basket. Only an ID and a quantity: nothing the server trusts. */
export const quoteItemSchema = z.object({
  productId: z.uuid("Invalid product"),
  quantity: z.coerce
    .number({ error: "Enter a quantity" })
    .int("Quantity must be a whole number")
    .min(QUOTE_LIMITS.minQuantity, `Minimum quantity is ${QUOTE_LIMITS.minQuantity}`)
    .max(QUOTE_LIMITS.maxQuantity, `Maximum quantity is ${QUOTE_LIMITS.maxQuantity.toLocaleString("en")}`),
});

export const quoteItemsSchema = z
  .array(quoteItemSchema)
  .max(QUOTE_LIMITS.maxLines, `A quotation can include up to ${QUOTE_LIMITS.maxLines} products`)
  .refine(
    (items) => new Set(items.map((item) => item.productId)).size === items.length,
    "Each product can appear only once",
  );

/** Customer details on the Request a Quote form. Shared by the form and the server. */
export const quoteCustomerSchema = z.object({
  customerName: trimmed(1, FIELD_LIMITS.customerName, "Full name"),
  companyName: trimmed(1, FIELD_LIMITS.companyName, "Company name"),
  businessEmail: z
    .string({ error: "Business email is required" })
    .trim()
    .toLowerCase()
    .max(FIELD_LIMITS.email, "Email is too long")
    .pipe(z.email("Enter a valid email address")),
  phoneNumber: trimmed(FIELD_LIMITS.phoneMin, FIELD_LIMITS.phoneMax, "Phone number").regex(
    /^[+()\d\s.-]+$/,
    "Use digits, spaces and + ( ) - only",
  ),
  country: trimmed(FIELD_LIMITS.countryMin, FIELD_LIMITS.countryMax, "Country"),
  additionalMessage: z
    .string()
    .trim()
    .max(FIELD_LIMITS.message, `Message must be at most ${FIELD_LIMITS.message} characters`)
    .optional()
    .transform((value) => (value ? value : undefined)),
});

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be at most ${max} characters`)
    .optional()
    .transform((value) => (value ? value : undefined));

/** Typed list of items, e.g. "ABC-123 x 200", one per line. */
export const requestedItemsTextSchema = optionalText(FIELD_LIMITS.message, "Item list");

/** Full submission as received by the server action. */
export const quoteSubmissionSchema = quoteCustomerSchema
  .extend({
    submissionKey: z.uuid(),
    items: quoteItemsSchema,
    requestedItemsText: requestedItemsTextSchema,
    /** Honeypot: real visitors never see or fill this field. */
    website: z.string().max(0).optional(),
    /** Milliseconds since the form was shown (bot timing check). */
    elapsedMs: z.coerce.number().int().nonnegative(),
  })
  .refine((data) => data.items.length > 0 || Boolean(data.requestedItemsText), {
    message: "Add products from the catalogue or type the items you need",
    path: ["requestedItemsText"],
  });

/** Catalogue request and contact form (saved as an inquiry, shown in the admin panel). */
export const inquirySchema = z.object({
  inquiryType: z.enum(["catalogue", "contact"]),
  customerName: trimmed(1, FIELD_LIMITS.customerName, "Your name"),
  companyName: optionalText(FIELD_LIMITS.companyName, "Company name"),
  email: z
    .string({ error: "Email is required" })
    .trim()
    .toLowerCase()
    .max(FIELD_LIMITS.email, "Email is too long")
    .pipe(z.email("Enter a valid email address")),
  phoneNumber: optionalText(FIELD_LIMITS.phoneMax, "Phone number").refine(
    (v) => !v || /^[+()\d\s.-]{5,}$/.test(v),
    "Use digits, spaces and + ( ) - only",
  ),
  country: optionalText(FIELD_LIMITS.countryMax, "Country"),
  productInterest: optionalText(160, "Product interest"),
  requestedItemsText: requestedItemsTextSchema,
  message: optionalText(FIELD_LIMITS.message, "Message"),
});

export const inquirySubmissionSchema = inquirySchema
  .extend({
    submissionKey: z.uuid(),
    website: z.string().max(0).optional(),
    elapsedMs: z.coerce.number().int().nonnegative(),
  })
  .superRefine((data, ctx) => {
    if (data.inquiryType === "catalogue" && !data.country) {
      ctx.addIssue({ code: "custom", path: ["country"], message: "Country is required" });
    }
    if (data.inquiryType === "contact" && !data.message && !data.requestedItemsText) {
      ctx.addIssue({ code: "custom", path: ["requestedItemsText"], message: "Tell us the products and quantities you need, or write a message" });
    }
  });

export type InquirySubmission = z.infer<typeof inquirySubmissionSchema>;

export function toInquiryPayload(input: InquirySubmission) {
  return {
    submission_key: input.submissionKey,
    inquiry_type: input.inquiryType,
    customer_name: input.customerName,
    company_name: input.companyName ?? null,
    email: input.email,
    phone_number: input.phoneNumber ?? null,
    country: input.country ?? null,
    product_interest: input.productInterest ?? null,
    requested_items_text: input.requestedItemsText ?? null,
    message: input.message ?? null,
  };
}

export type QuoteSubmission = z.infer<typeof quoteSubmissionSchema>;
export type QuoteItem = z.infer<typeof quoteItemSchema>;

/** Shape sent to the submit_quotation database function. */
export function toSubmitPayload(input: QuoteSubmission) {
  return {
    submission_key: input.submissionKey,
    customer_name: input.customerName,
    company_name: input.companyName,
    business_email: input.businessEmail,
    phone_number: input.phoneNumber,
    country: input.country,
    additional_message: input.additionalMessage ?? null,
    requested_items_text: input.requestedItemsText ?? null,
    items: input.items.map((item) => ({ product_id: item.productId, quantity: item.quantity })),
  };
}
