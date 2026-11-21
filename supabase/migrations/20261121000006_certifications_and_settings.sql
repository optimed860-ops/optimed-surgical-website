-- 06 · Certifications, site settings, rate-limit events
-- (No email tables: the site sends no emails. Submissions appear in the admin panel.)

create table public.certifications (
  id            uuid primary key default gen_random_uuid(),
  title         text not null check (char_length(title) between 1 and 200),
  description   text check (char_length(description) <= 2000),
  document_path text not null unique,
  document_type text not null check (document_type in ('pdf', 'image')),
  issue_date    date,
  expiry_date   date,
  is_published  boolean not null default false,
  display_order integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (expiry_date is null or issue_date is null or expiry_date >= issue_date)
);

create index certifications_published_order_idx
  on public.certifications (is_published, display_order);

create trigger certifications_set_updated_at
  before update on public.certifications
  for each row execute function app.set_updated_at();

create table public.site_settings (
  setting_key   text primary key check (setting_key ~ '^[a-z0-9_]+$'),
  setting_value jsonb,
  is_public     boolean not null default true,
  updated_at    timestamptz not null default now()
);

create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row execute function app.set_updated_at();

-- Empty values on purpose. The client supplies the real company details.
insert into public.site_settings (setting_key, setting_value, is_public) values
  ('company_name',        null, true),
  ('logo_path',           null, true),
  ('contact_email',       null, true),
  ('phone_number',        null, true),
  ('address',             null, true),
  ('social_links',        '[]'::jsonb, true),
  ('footer_description',  null, true)
on conflict (setting_key) do nothing;

-- Hashed visitor keys (HMAC of IP) for rate limiting public forms. No raw IPs.
create table public.rate_limit_events (
  id         bigint generated always as identity primary key,
  action     text not null,
  key_hash   text not null check (char_length(key_hash) <= 128),
  created_at timestamptz not null default now()
);

create index rate_limit_events_lookup_idx
  on public.rate_limit_events (action, key_hash, created_at desc);
