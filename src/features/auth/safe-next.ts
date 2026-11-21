/**
 * Only allow redirects back into the admin area after login.
 * Blocks open redirects such as "//evil.example" or "https://evil.example".
 */
export function safeAdminNext(next: unknown): string {
  const fallback = "/admin/dashboard";
  if (typeof next !== "string") return fallback;
  if (!next.startsWith("/admin/") || next.startsWith("//") || next.includes("\\")) return fallback;
  if (next.startsWith("/admin/login")) return fallback;
  return next;
}
