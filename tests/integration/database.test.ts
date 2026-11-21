import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { createMigratedDatabase, readSql } from "./supabase-stub";
import { QUOTATION_STATUSES, ORDER_STATUSES } from "@/config/statuses";

let db: PGlite;

beforeAll(async () => {
  db = await createMigratedDatabase();
}, 60_000);

afterAll(async () => {
  await db?.close();
});

describe("database migrations", () => {
  it("enable RLS on every public table", async () => {
    const { rows } = await db.query<{ relname: string }>(`
      select c.relname from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity`);
    expect(rows.map((r) => r.relname)).toEqual([]);
  });

  it("have no price columns anywhere", async () => {
    const { rows } = await db.query(`
      select table_name, column_name from information_schema.columns
      where table_schema = 'public' and column_name ilike '%price%'`);
    expect(rows).toEqual([]);
  });

  it("keep status lists in sync with src/config/statuses.ts", async () => {
    const quotation = await db.query<{ def: string }>(
      `select pg_get_constraintdef(oid) as def from pg_constraint
       where conrelid = 'public.quotations'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%status%'`,
    );
    const order = await db.query<{ def: string }>(
      `select pg_get_constraintdef(oid) as def from pg_constraint
       where conrelid = 'public.orders'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%status%'`,
    );
    for (const status of QUOTATION_STATUSES) expect(quotation.rows[0].def).toContain(`'${status}'`);
    for (const status of ORDER_STATUSES) expect(order.rows[0].def).toContain(`'${status}'`);
  });

  it("do not let anon or authenticated call submit_quotation directly", async () => {
    const { rows } = await db.query<{ anon: boolean; auth: boolean; service: boolean }>(`
      select has_function_privilege('anon', 'public.submit_quotation(jsonb, text)', 'execute') as anon,
             has_function_privilege('authenticated', 'public.submit_quotation(jsonb, text)', 'execute') as auth,
             has_function_privilege('service_role', 'public.submit_quotation(jsonb, text)', 'execute') as service`);
    expect(rows[0]).toEqual({ anon: false, auth: false, service: true });
  });

  it("pass the full RLS self-check (supabase/tests/rls_checks.sql)", async () => {
    await expect(db.exec(readSql("supabase", "tests", "rls_checks.sql"))).resolves.toBeDefined();
    // The self-check rolls back its own test data.
    const { rows } = await db.query<{ n: number }>("select count(*)::int as n from public.categories");
    expect(rows[0].n).toBe(0);
  });

  it("generate unique sequential quotation references", async () => {
    const { rows } = await db.query<{ a: string; b: string }>(
      "select app.next_quotation_reference() as a, app.next_quotation_reference() as b",
    );
    expect(rows[0].a).toMatch(/^QT-\d{4}-\d{6}$/);
    expect(rows[0].a).not.toBe(rows[0].b);
  });
});
