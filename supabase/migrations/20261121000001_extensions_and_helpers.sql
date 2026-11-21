-- 01 · Extensions and shared helpers
-- Run this first in the Supabase SQL Editor.

create extension if not exists pg_trgm with schema extensions;

-- Private schema for internal helper functions (not exposed through the API).
create schema if not exists app;
revoke all on schema app from public;
grant usage on schema app to anon, authenticated, service_role;

-- Keeps updated_at current on every UPDATE.
create or replace function app.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
