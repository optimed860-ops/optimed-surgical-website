/**
 * Cleans a visitor's search text before it goes into a PostgREST filter.
 * Removes characters with special meaning in filters (, ( ) * % \ ") and
 * collapses whitespace, so a search can never change the query's structure.
 */
export function sanitizeSearch(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw
    .replace(/[,()*%\\"':]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

/** Positive integer page number from a query string value, defaulting to 1. */
export function parsePage(raw: unknown): number {
  const value = Number(Array.isArray(raw) ? raw[0] : raw);
  if (!Number.isFinite(value) || value < 1) return 1;
  return Math.min(Math.floor(value), 10_000);
}

/** Lower-case slug from a query string value, or null when invalid. */
export function parseSlug(raw: unknown): string | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== "string") return null;
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value) && value.length <= 120 ? value : null;
}
