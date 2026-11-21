/**
 * Business limits. Keep in sync with supabase/migrations/*_functions.sql
 * (submit_quotation) and the CHECK constraints. Final values: decision D-S3.
 */
export const QUOTE_LIMITS = {
  maxLines: 100,
  minQuantity: 1,
  maxQuantity: 1_000_000,
  /** Reject forms submitted faster than this (bots). */
  minFillMilliseconds: 2_500,
} as const;

export const FIELD_LIMITS = {
  customerName: 120,
  companyName: 160,
  email: 254,
  phoneMin: 5,
  phoneMax: 40,
  countryMin: 2,
  countryMax: 80,
  message: 5_000,
} as const;
