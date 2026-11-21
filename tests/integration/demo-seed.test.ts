import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { createMigratedDatabase, readSql } from "./supabase-stub";

let db: PGlite;

beforeAll(async () => {
  db = await createMigratedDatabase();
}, 60_000);

afterAll(async () => {
  await db?.close();
});

async function count(sql: string) {
  const { rows } = await db.query<{ n: number }>(sql);
  return rows[0].n;
}

describe("demo catalogue seed", () => {
  it("loads, is visible to visitors, and is fully removable", async () => {
    await db.exec(readSql("supabase", "seed", "demo_catalogue.sql"));
    expect(await count("select count(*)::int as n from public.products where product_code like 'DEMO-%'")).toBe(22);
    expect(await count("select count(*)::int as n from public.products where product_code not like 'DEMO-%'")).toBe(0);

    // Visible to anonymous visitors through RLS.
    await db.exec("set role anon");
    expect(await count("select count(*)::int as n from public.products")).toBe(22);
    await db.exec("reset role");

    // Running it twice does not duplicate anything.
    await db.exec(readSql("supabase", "seed", "demo_catalogue.sql"));
    expect(await count("select count(*)::int as n from public.products")).toBe(22);

    // A real product in a demo category must survive removal (and keep its category).
    await db.exec(`insert into public.products (category_id, name, slug, product_code, is_published)
      select id, 'Real Product', 'real-product', 'RP-1', true from public.categories where slug = 'hospital-supplies'`);

    await db.exec(readSql("supabase", "seed", "remove_demo_catalogue.sql"));
    expect(await count("select count(*)::int as n from public.products where product_code like 'DEMO-%'")).toBe(0);
    expect(await count("select count(*)::int as n from public.products where slug = 'real-product'")).toBe(1);
    expect(await count("select count(*)::int as n from public.categories where slug = 'hospital-supplies'")).toBe(1);
    expect(await count("select count(*)::int as n from public.categories where slug = 'dental-products'")).toBe(0);
  });
});
