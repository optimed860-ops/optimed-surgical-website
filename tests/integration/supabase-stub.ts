import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Minimal stand-in for the parts of Supabase the migrations depend on:
 * the anon/authenticated/service_role roles, auth.users + auth.uid(),
 * the extensions and storage schemas, and Supabase's default grants
 * (which the migrations must explicitly revoke).
 */
const SUPABASE_STUB = `
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema extensions;
grant usage on schema extensions to anon, authenticated, service_role;
create schema auth;
create table auth.users (id uuid primary key, email text, aud text, role text);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'
  ), '')::uuid
$$;
grant usage on schema auth to anon, authenticated, service_role;
create schema storage;
create table storage.buckets (id text primary key, name text, public boolean,
  file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
alter table storage.objects enable row level security;
grant usage on schema public to anon, authenticated, service_role;
-- Newer Supabase projects do NOT auto-grant table access to service_role
-- (verified against the live project: direct inserts with the secret key get 42501).
-- anon/authenticated defaults are kept so the migrations' explicit REVOKEs are exercised.
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on sequences to anon, authenticated;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
`;

const root = join(__dirname, "..", "..");

export function migrationFiles(): string[] {
  const dir = join(root, "supabase", "migrations");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => join(dir, f));
}

export function readSql(...parts: string[]): string {
  return readFileSync(join(root, ...parts), "utf8");
}

export async function createMigratedDatabase(): Promise<PGlite> {
  const db = new PGlite({ extensions: { pg_trgm } });
  await db.exec(SUPABASE_STUB);
  for (const file of migrationFiles()) {
    await db.exec(readFileSync(file, "utf8"));
  }
  return db;
}
