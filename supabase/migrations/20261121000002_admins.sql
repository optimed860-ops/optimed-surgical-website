-- 02 · Admin allowlist
-- Only users listed here are admins. Being signed in is NOT enough.
-- The first admin is added manually (see README, "Create the admin account").

create table public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  full_name  text check (char_length(full_name) <= 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger admins_set_updated_at
  before update on public.admins
  for each row execute function app.set_updated_at();

-- True when the current request belongs to a listed admin.
-- SECURITY DEFINER so it can read admins regardless of the caller's RLS.
create or replace function app.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins a where a.user_id = auth.uid()
  );
$$;

revoke all on function app.is_admin() from public;
grant execute on function app.is_admin() to anon, authenticated, service_role;
