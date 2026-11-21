import "server-only";
import { createHmac } from "node:crypto";

/**
 * Turns a visitor IP into a keyed hash for rate limiting. The raw IP is never
 * stored, and the hash can't be reversed without the server secret.
 */
export function hashVisitorKey(ip: string, secret: string, scope = "quotation"): string {
  return createHmac("sha256", secret).update(`${scope}:${ip}`).digest("hex");
}

/** Best-effort client IP from proxy headers (set by the hosting platform). */
export function clientIpFrom(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() || headers.get("x-nf-client-connection-ip")?.trim() || "unknown";
}
