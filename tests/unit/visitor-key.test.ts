import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { clientIpFrom, hashVisitorKey } = await import("@/lib/security/visitor-key");

describe("hashVisitorKey", () => {
  const secret = "x".repeat(32);

  it("is stable for the same input", () => {
    expect(hashVisitorKey("203.0.113.7", secret)).toBe(hashVisitorKey("203.0.113.7", secret));
  });

  it("never contains the raw IP and fits the database limit", () => {
    const hash = hashVisitorKey("203.0.113.7", secret);
    expect(hash).not.toContain("203.0.113.7");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("differs per secret and per scope", () => {
    const base = hashVisitorKey("203.0.113.7", secret);
    expect(hashVisitorKey("203.0.113.7", "y".repeat(32))).not.toBe(base);
    expect(hashVisitorKey("203.0.113.7", secret, "contact")).not.toBe(base);
  });
});

describe("clientIpFrom", () => {
  it("takes the first x-forwarded-for entry", () => {
    expect(clientIpFrom(new Headers({ "x-forwarded-for": "198.51.100.1, 10.0.0.1" }))).toBe("198.51.100.1");
  });

  it("falls back to unknown", () => {
    expect(clientIpFrom(new Headers())).toBe("unknown");
  });
});
