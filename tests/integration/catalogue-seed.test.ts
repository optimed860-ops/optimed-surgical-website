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

const count = async (sql: string) => (await db.query<{ n: number }>(sql)).rows[0].n;

describe("starter product catalogue", () => {
  it("loads 25 published products in 8 categories, visible to visitors, idempotent", async () => {
    await db.exec(readSql("supabase", "seed", "catalogue_products.sql"));
    expect(await count("select count(*)::int as n from public.products")).toBe(25);
    expect(await count("select count(*)::int as n from public.categories")).toBe(8);
    expect(await count("select count(*)::int as n from public.products where is_featured")).toBe(8);

    // Every specification list is a valid array of {label, value}.
    expect(
      await count(`select count(*)::int as n from public.products p, jsonb_array_elements(p.specifications) s
                   where not (s ? 'label' and s ? 'value')`),
    ).toBe(0);

    await db.exec("set role anon");
    expect(await count("select count(*)::int as n from public.products")).toBe(25);
    await db.exec("reset role");

    await db.exec(readSql("supabase", "seed", "catalogue_products.sql"));
    expect(await count("select count(*)::int as n from public.products")).toBe(25);
  });

  it("links one main photo to 16 products, idempotent, never replacing an existing main photo", async () => {
    await db.exec(readSql("supabase", "seed", "catalogue_photos.sql"));
    const withPhotos = "select count(distinct product_id)::int as n from public.product_images where is_primary";
    expect(await count(withPhotos)).toBe(16);
    await db.exec(readSql("supabase", "seed", "catalogue_photos.sql"));
    expect(await count("select count(*)::int as n from public.product_images")).toBe(16);
  });
});
