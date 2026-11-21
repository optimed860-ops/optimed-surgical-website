/**
 * Provisional status lists (decisions D-Q1 and D-W3).
 * Must match the CHECK constraints in supabase/migrations.
 */
export const QUOTATION_STATUSES = [
  "new",
  "under_review",
  "contacted",
  "approved",
  "rejected",
  "converted_to_order",
] as const;

export const ORDER_STATUSES = [
  "processing",
  "confirmed",
  "dispatched",
  "delivered",
  "cancelled",
] as const;

export type QuotationStatus = (typeof QUOTATION_STATUSES)[number];
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const QUOTATION_STATUS_LABELS: Record<QuotationStatus, string> = {
  new: "New",
  under_review: "Under review",
  contacted: "Contacted",
  approved: "Approved",
  rejected: "Rejected",
  converted_to_order: "Converted to order",
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  processing: "Processing",
  confirmed: "Confirmed",
  dispatched: "Dispatched",
  delivered: "Delivered",
  cancelled: "Cancelled",
};
