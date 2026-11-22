import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { createMigratedDatabase } from "./supabase-stub";

let db: PGlite;

beforeAll(async () => {
  db = await createMigratedDatabase();
}, 60_000);

afterAll(async () => {
  await db?.close();
});

describe("security hardening (file 14)", () => {
  it("allows 10 sign-in attempts per visitor in 15 minutes, then blocks", async () => {
    await db.exec("set role service_role");
    const key = "a".repeat(64);
    const results: boolean[] = [];
    for (let i = 0; i < 11; i++) {
      const { rows } = await db.query<{ ok: boolean }>("select public.check_login_rate_limit($1) as ok", [key]);
      results.push(rows[0].ok);
    }
    expect(results.slice(0, 10).every(Boolean)).toBe(true);
    expect(results[10]).toBe(false);

    // A different visitor is not affected.
    const other = await db.query<{ ok: boolean }>("select public.check_login_rate_limit($1) as ok", ["b".repeat(64)]);
    expect(other.rows[0].ok).toBe(true);
    await db.exec("reset role");
  });

  it("cannot be called by visitors or signed-in users", async () => {
    for (const role of ["anon", "authenticated"]) {
      await db.exec(`set role ${role}`);
      await expect(db.query("select public.check_login_rate_limit($1)", ["c".repeat(64)])).rejects.toThrow(/permission denied/);
      await db.exec("reset role");
    }
  });
});
