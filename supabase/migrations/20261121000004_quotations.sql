-- 04 · Quotations and quotation items
-- Status list is provisional (decision D-Q1). Change the CHECK in a later migration.

create sequence public.quotation_ref_seq;

-- QT-2026-000123 (format pending decision D-Q2). Sequence = concurrency-safe.
create or replace function app.next_quotation_reference()
returns text
language sql
volatile
set search_path = ''
as $$
  select 'QT-' || to_char(now() at time zone 'utc', 'YYYY') || '-' ||
         lpad(nextval('public.quotation_ref_seq')::text, 6, '0');
$$;

create table public.quotations (
  id                 uuid primary key default gen_random_uuid(),
  reference_number   text not null unique default app.next_quotation_reference(),
  -- Per-submission idempotency key created by the browser. Not a reference.
  submission_key     uuid not null unique,
  customer_name      text not null check (char_length(customer_name) between 1 and 120),
  company_name       text not null check (char_length(company_name) between 1 and 160),
  business_email     text not null check (
                       char_length(business_email) <= 254
                       and business_email = lower(business_email)
                       and business_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
                     ),
  phone_number       text not null check (char_length(phone_number) between 5 and 40),
  country            text not null check (char_length(country) between 2 and 80),
  additional_message text check (char_length(additional_message) <= 5000),
  status             text not null default 'new' check (status in (
                       'new', 'under_review', 'contacted', 'approved', 'rejected', 'converted_to_order'
                     )),
  internal_notes     text check (char_length(internal_notes) <= 10000),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index quotations_status_created_idx on public.quotations (status, created_at desc);
create index quotations_created_idx        on public.quotations (created_at desc);
create index quotations_company_trgm_idx   on public.quotations using gin (company_name extensions.gin_trgm_ops);
create index quotations_email_trgm_idx     on public.quotations using gin (business_email extensions.gin_trgm_ops);

create trigger quotations_set_updated_at
  before update on public.quotations
  for each row execute function app.set_updated_at();

create table public.quotation_items (
  id                    uuid primary key default gen_random_uuid(),
  quotation_id          uuid not null references public.quotations (id) on delete cascade,
  -- Nullable so products can be deleted later; the snapshots keep the record readable.
  product_id            uuid references public.products (id) on delete set null,
  product_name_snapshot text not null,
  product_code_snapshot text,
  quantity              integer not null check (quantity between 1 and 1000000),
  created_at            timestamptz not null default now()
);

create index quotation_items_quotation_idx on public.quotation_items (quotation_id);
create index quotation_items_product_idx   on public.quotation_items (product_id);
create unique index quotation_items_unique_product_idx
  on public.quotation_items (quotation_id, product_id) where product_id is not null;
