-- 05 · Orders, order items, order updates (history)
-- Status list is provisional (decision D-W3).

create sequence public.order_ref_seq;

create or replace function app.next_order_reference()
returns text
language sql
volatile
set search_path = ''
as $$
  select 'ORD-' || to_char(now() at time zone 'utc', 'YYYY') || '-' ||
         lpad(nextval('public.order_ref_seq')::text, 6, '0');
$$;

create table public.orders (
  id                 uuid primary key default gen_random_uuid(),
  order_reference    text not null unique default app.next_order_reference(),
  internal_reference text check (char_length(internal_reference) <= 80),
  quotation_id       uuid references public.quotations (id) on delete restrict,
  customer_name      text not null check (char_length(customer_name) between 1 and 120),
  company_name       text not null check (char_length(company_name) between 1 and 160),
  customer_email     text not null check (
                       char_length(customer_email) <= 254
                       and customer_email = lower(customer_email)
                       and customer_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
                     ),
  phone_number       text check (char_length(phone_number) <= 40),
  country            text check (char_length(country) <= 80),
  status             text not null default 'processing' check (status in (
                       'processing', 'confirmed', 'dispatched', 'delivered', 'cancelled'
                     )),
  internal_notes     text check (char_length(internal_notes) <= 10000),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index orders_status_created_idx on public.orders (status, created_at desc);
create index orders_created_idx        on public.orders (created_at desc);
create index orders_quotation_idx      on public.orders (quotation_id);
create index orders_company_trgm_idx   on public.orders using gin (company_name extensions.gin_trgm_ops);

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function app.set_updated_at();

create table public.order_items (
  id                    uuid primary key default gen_random_uuid(),
  order_id              uuid not null references public.orders (id) on delete cascade,
  product_id            uuid references public.products (id) on delete set null,
  product_name_snapshot text not null check (char_length(product_name_snapshot) between 1 and 200),
  product_code_snapshot text check (char_length(product_code_snapshot) <= 80),
  quantity              integer not null check (quantity between 1 and 1000000),
  created_at            timestamptz not null default now()
);

create index order_items_order_idx   on public.order_items (order_id);
create index order_items_product_idx on public.order_items (product_id);

-- Append-only history. No UPDATE/DELETE is granted to anyone (see 08_rls).
create table public.order_updates (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references public.orders (id) on delete cascade,
  status          text not null check (status in (
                    'processing', 'confirmed', 'dispatched', 'delivered', 'cancelled'
                  )),
  message         text check (char_length(message) <= 5000),
  created_by      uuid references public.admins (user_id) on delete set null,
  created_at      timestamptz not null default now()
);

create index order_updates_order_idx on public.order_updates (order_id, created_at desc);
