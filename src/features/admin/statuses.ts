export const QUOTATION_STATUSES = ["new", "under_review", "contacted", "approved", "rejected", "converted_to_order"] as const;
export const INQUIRY_STATUSES = ["new", "in_progress", "closed"] as const;
export const ORDER_STATUSES = ["processing", "confirmed", "dispatched", "delivered", "cancelled"] as const;

export const statusLabel = (s: string) => s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
