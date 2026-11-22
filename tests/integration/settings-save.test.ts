import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { createMigratedDatabase } from "./supabase-stub";

let db: PGlite;
const ADMIN = "11111111-1111-4111-8111-111111111111";

beforeAll(async () => {
  db = await createMigratedDatabase();
  await db.exec(`
    insert into auth.users (id, email) values ('${ADMIN}', 'admin@example.com');
    insert into public.admins (user_id, full_name) values ('${ADMIN}', 'Admin');
  `);
}, 60_000);

afterAll(async () => {
  await db?.close();
});

async function asAdmin<T>(fn: () => Promise<T>) {
  await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub', '${ADMIN}', false);`);
  try {
    return await fn();
  } finally {
    await db.exec("reset role; select set_config('request.jwt.claim.sub', '', false);");
  }
}

describe("saving site settings as an admin", () => {
  it("an upsert that also sets the key column is refused (the old bug)", async () => {
    await asAdmin(async () => {
      await expect(
        db.exec(`insert into public.site_settings (setting_key, setting_value) values ('social_links', '[]')
                 on conflict (setting_key) do update set setting_key = excluded.setting_key, setting_value = excluded.setting_value`),
      ).rejects.toThrow(/permission denied/);
    });
  });

  it("update of an existing key and insert of a new key both work (the fix)", async () => {
    await asAdmin(async () => {
      const updated = await db.query(
        `update public.site_settings set setting_value = '[{"label":"Instagram","url":"https://www.instagram.com/x"}]', is_public = true
         where setting_key = 'social_links' returning setting_key`,
      );
      expect(updated.rows).toHaveLength(1);
      await db.exec(`insert into public.site_settings (setting_key, setting_value, is_public) values ('brand_new_key', '"x"', true)`);
    });
    const { rows } = await db.query<{ setting_value: unknown }>(`select setting_value from public.site_settings where setting_key = 'social_links'`);
    expect(JSON.stringify(rows[0].setting_value)).toContain("instagram.com");
  });
});
