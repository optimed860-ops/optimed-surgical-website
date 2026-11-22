import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { createMigratedDatabase, readSql } from "./supabase-stub";

let db: PGlite;
const ADMIN = "22222222-2222-4222-8222-222222222222";
const CODE = /^OPM-\d{3}-\d{3}$/;

beforeAll(async () => {
  db = await createMigratedDatabase();
  await db.exec(readSql("supabase", "seed", "catalogue_products.sql"));
  await db.exec(`
    insert into auth.users (id, email) values ('${ADMIN}', 'admin@example.com');
    insert into public.admins (user_id, full_name) values ('${ADMIN}', 'Admin');
  `);
}, 60_000);

afterAll(async () => {
  await db?.close();
});

async function asAdmin(sql: string) {
  await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub', '${ADMIN}', false);`);
  try {
    return await db.query<Record<string, string>>(sql);
  } finally {
    await db.exec("reset role; select set_config('request.jwt.claim.sub', '', false);");
  }
}

describe("product item codes (file 13)", () => {
  it("every starter product has a unique OPM code", async () => {
    const { rows } = await db.query<{ product_code: string }>("select product_code from public.products");
    expect(rows.length).toBe(25);
    for (const r of rows) expect(r.product_code).toMatch(CODE);
    expect(new Set(rows.map((r) => r.product_code)).size).toBe(25);
  });

  it("a new product without a code gets one; an admin can set and keep a code", async () => {
    const cat = (await db.query<{ id: string }>("select id from public.categories limit 1")).rows[0].id;
    const created = await asAdmin(
      `insert into public.products (category_id, name, slug) values ('${cat}', 'Test Clamp', 'test-clamp') returning id, product_code`,
    );
    expect(created.rows[0].product_code).toMatch(CODE);
    const id = created.rows[0].id;

    await asAdmin(`update public.products set product_code = ' opm-111-222 ' where id = '${id}'`);
    await asAdmin(`update public.products set product_code = null, name = 'Test Clamp 2' where id = '${id}'`);
    const { rows } = await db.query<{ product_code: string }>(`select product_code from public.products where id = '${id}'`);
    expect(rows[0].product_code).toBe("OPM-111-222");
  });

  it("refuses a code that another product already uses", async () => {
    const [a, b] = (await db.query<{ id: string; product_code: string }>("select id, product_code from public.products order by name limit 2")).rows;
    await expect(asAdmin(`update public.products set product_code = '${a.product_code.toLowerCase()}' where id = '${b.id}'`)).rejects.toThrow(
      /duplicate key|unique/,
    );
  });

  it("can be run again safely", async () => {
    await db.exec(readSql("supabase", "migrations", "20261121000013_product_codes.sql"));
    const { rows } = await db.query<{ n: number }>("select count(distinct product_code)::int as n from public.products");
    expect(rows[0].n).toBe(26);
  });
});
