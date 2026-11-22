import "server-only";
import { createHmac } from "node:crypto";

/**
 * Turns a visitor IP into a keyed hash for rate limiting. The raw IP is never
 * stored, and the hash can't be reversed without the server secret.
 */
export function hashVisitorKey(ip: string, secret: string, scope = "quotation"): string {
  return createHmac("sha256", secret).update(`${scope}:${ip}`).digest("hex");
}

/**
 * Client IP for rate limiting. Netlify sets x-nf-client-connection-ip itself, so
 * a visitor cannot fake it; x-forwarded-for can be supplied by the visitor and
 * is only a fallback (local development, other hosts).
 */
export function clientIpFrom(headers: Headers): string {
  const platform = headers.get("x-nf-client-connection-ip")?.trim() || headers.get("x-real-ip")?.trim();
  if (platform) return platform;
  const forwarded = headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first || "unknown";
}
