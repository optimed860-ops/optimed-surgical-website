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

describe("blog", () => {
  it("loads the starter articles, idempotent, within the column limits", async () => {
    await db.exec(readSql("supabase", "seed", "blog_posts.sql"));
    expect(await count("select count(*)::int as n from public.blog_posts where is_published")).toBe(5);
    await db.exec(readSql("supabase", "seed", "blog_posts.sql"));
    expect(await count("select count(*)::int as n from public.blog_posts")).toBe(5);
  });

  it("shows visitors only published articles whose date has arrived", async () => {
    await db.exec(`
      insert into public.blog_posts (title, slug, excerpt, body, is_published, published_at) values
        ('Draft', 'draft-post', 'x', 'x', false, null),
        ('Scheduled', 'scheduled-post', 'x', 'x', true, now() + interval '3 days');
    `);
    await db.exec("set role anon");
    expect(await count("select count(*)::int as n from public.blog_posts")).toBe(5);
    expect(await count("select count(*)::int as n from public.blog_posts where slug in ('draft-post','scheduled-post')")).toBe(0);
    await expect(db.exec("insert into public.blog_posts (title, slug, excerpt, body) values ('a','hack','x','x')")).rejects.toThrow();
    await db.exec("reset role");
  });

  it("does not let a signed-in non-admin write articles", async () => {
    await db.exec("set role authenticated");
    await expect(db.exec("insert into public.blog_posts (title, slug, excerpt, body) values ('a','not-admin','x','x')")).rejects.toThrow();
    expect(await count("select count(*)::int as n from public.blog_posts where slug = 'draft-post'")).toBe(0);
    await db.exec("reset role");
  });
});
