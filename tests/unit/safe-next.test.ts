import { describe, expect, it } from "vitest";
import { safeAdminNext } from "@/features/auth/safe-next";

describe("safeAdminNext", () => {
  it("keeps admin paths", () => {
    expect(safeAdminNext("/admin/quotations/123")).toBe("/admin/quotations/123");
  });

  it.each([
    undefined,
    "",
    "https://evil.example/admin/x",
    "//evil.example",
    "/\\evil.example",
    "/products",
    "/admin",
    "/admin/login",
    "/admin/login?next=/admin/x",
  ])("falls back to the dashboard for %s", (value) => {
    expect(safeAdminNext(value)).toBe("/admin/dashboard");
  });
});
