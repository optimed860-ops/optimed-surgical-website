import { describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { createMigratedDatabase, readSql } from "./supabase-stub";

const sql = () => readSql("supabase", "tests", "setup_check.sql");

describe("setup_check.sql", () => {
  it("runs on a fully migrated database and reports every migration as done", async () => {
    const db = await createMigratedDatabase();
    const { rows } = await db.query<{ step: number; status: string }>(sql());
    expect(rows).toHaveLength(17);
    for (const row of rows.filter((r) => r.step <= 14)) expect(row.status).toContain("done");
    expect(rows.find((r) => r.step === 15)?.status).toContain("missing"); // no admin yet
    await db.close();
  }, 60_000);

  it("does not crash on an empty database", async () => {
    const db = new PGlite();
    await db.exec("create schema storage; create table storage.buckets (id text primary key);");
    const { rows } = await db.query<{ status: string }>(sql());
    expect(rows.every((r) => r.status.includes("missing"))).toBe(true);
    await db.close();
  }, 60_000);
});
