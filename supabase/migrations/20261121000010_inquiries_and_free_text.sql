-- 10 · Catalogue & contact inquiries, and typed item lists on quotations
-- Run this AFTER files 01–09.
--
-- • Catalogue requests and contact messages are saved in public.inquiries and
--   shown only in the admin panel (no emails).
-- • A quotation can now be sent with a typed list of items ("ABC-123 x 200")
--   instead of, or in addition to, products picked from the catalogue.

-- ── Quotations: typed item list ──────────────────────────────────────────────
alter table public.quotations
  add column if not exists requested_items_text text
  check (char_length(requested_items_text) <= 5000);

-- ── Inquiries ────────────────────────────────────────────────────────────────
create sequence if not exists public.inquiry_ref_seq;

create or replace function app.next_inquiry_reference()
returns text
language sql
volatile
set search_path = ''
as $$
  select 'INQ-' || to_char(now() at time zone 'utc', 'YYYY') || '-' ||
         lpad(nextval('public.inquiry_ref_seq')::text, 6, '0');
$$;

create table if not exists public.inquiries (
  id                   uuid primary key default gen_random_uuid(),
  reference_number     text not null unique default app.next_inquiry_reference(),
  submission_key       uuid not null unique,
  inquiry_type         text not null check (inquiry_type in ('catalogue', 'contact')),
  customer_name        text not null check (char_length(customer_name) between 1 and 120),
  company_name         text check (char_length(company_name) <= 160),
  email                text not null check (
                         char_length(email) <= 254
                         and email = lower(email)
                         and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
                       ),
  phone_number         text check (char_length(phone_number) <= 40),
  country              text check (char_length(country) <= 80),
  product_interest     text check (char_length(product_interest) <= 160),
  requested_items_text text check (char_length(requested_items_text) <= 5000),
  message              text check (char_length(message) <= 5000),
  status               text not null default 'new' check (status in ('new', 'in_progress', 'closed')),
  internal_notes       text check (char_length(internal_notes) <= 10000),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists inquiries_status_created_idx on public.inquiries (status, created_at desc);
create index if not exists inquiries_type_created_idx   on public.inquiries (inquiry_type, created_at desc);

drop trigger if exists inquiries_set_updated_at on public.inquiries;
create trigger inquiries_set_updated_at
  before update on public.inquiries
  for each row execute function app.set_updated_at();

alter table public.inquiries enable row level security;

revoke all on public.inquiries from anon, authenticated;
grant select on public.inquiries to authenticated;
grant update (status, internal_notes) on public.inquiries to authenticated;

drop policy if exists "inquiries: admin reads" on public.inquiries;
create policy "inquiries: admin reads" on public.inquiries
  for select to authenticated using ((select app.is_admin()));
drop policy if exists "inquiries: admin updates" on public.inquiries;
create policy "inquiries: admin updates" on public.inquiries
  for update to authenticated
  using ((select app.is_admin())) with check ((select app.is_admin()));

-- ── submit_inquiry (server only) ─────────────────────────────────────────────
create or replace function public.submit_inquiry(p_payload jsonb, p_key_hash text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  c_rate_window constant interval := interval '10 minutes';
  c_rate_max    constant int := 5;
  v_key         uuid;
  v_recent      int;
  v_row         public.inquiries%rowtype;
begin
  if p_key_hash is null or char_length(p_key_hash) not between 16 and 128 then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;

  begin
    v_key := (p_payload ->> 'submission_key')::uuid;
  exception when others then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end;
  if v_key is null then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;

  select * into v_row from public.inquiries where submission_key = v_key;
  if found then
    return jsonb_build_object('reference_number', v_row.reference_number, 'created_at', v_row.created_at, 'duplicate', true);
  end if;

  perform pg_advisory_xact_lock(hashtextextended('inquiry:' || p_key_hash, 0));
  select count(*) into v_recent
  from public.rate_limit_events
  where action = 'inquiry' and key_hash = p_key_hash and created_at > now() - c_rate_window;
  if v_recent >= c_rate_max then
    raise exception 'RATE_LIMITED' using errcode = 'P0001';
  end if;

  insert into public.inquiries (
    submission_key, inquiry_type, customer_name, company_name, email, phone_number,
    country, product_interest, requested_items_text, message
  ) values (
    v_key,
    p_payload ->> 'inquiry_type',
    btrim(p_payload ->> 'customer_name'),
    nullif(btrim(coalesce(p_payload ->> 'company_name', '')), ''),
    lower(btrim(p_payload ->> 'email')),
    nullif(btrim(coalesce(p_payload ->> 'phone_number', '')), ''),
    nullif(btrim(coalesce(p_payload ->> 'country', '')), ''),
    nullif(btrim(coalesce(p_payload ->> 'product_interest', '')), ''),
    nullif(btrim(coalesce(p_payload ->> 'requested_items_text', '')), ''),
    nullif(btrim(coalesce(p_payload ->> 'message', '')), '')
  )
  on conflict (submission_key) do nothing
  returning * into v_row;

  if v_row.id is null then
    select * into v_row from public.inquiries where submission_key = v_key;
    return jsonb_build_object('reference_number', v_row.reference_number, 'created_at', v_row.created_at, 'duplicate', true);
  end if;

  insert into public.rate_limit_events (action, key_hash) values ('inquiry', p_key_hash);
  delete from public.rate_limit_events where created_at < now() - interval '2 days';

  return jsonb_build_object('reference_number', v_row.reference_number, 'created_at', v_row.created_at, 'duplicate', false);
end;
$$;

revoke all on function public.submit_inquiry(jsonb, text) from public, anon, authenticated;
grant execute on function public.submit_inquiry(jsonb, text) to service_role;

-- ── submit_quotation: allow a typed item list ────────────────────────────────
-- Same checks as before, except a request may have zero catalogue lines when a
-- typed item list is given. At least one of the two is always required.
create or replace function public.submit_quotation(p_payload jsonb, p_key_hash text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  c_max_lines     constant int := 100;
  c_max_quantity  constant int := 1000000;
  c_rate_window   constant interval := interval '10 minutes';
  c_rate_max      constant int := 5;

  v_submission_key uuid;
  v_items          jsonb := coalesce(p_payload -> 'items', '[]'::jsonb);
  v_text           text := nullif(btrim(coalesce(p_payload ->> 'requested_items_text', '')), '');
  v_line_count     int;
  v_distinct_count int;
  v_valid_count    int;
  v_bad_quantity   boolean;
  v_recent         int;
  v_quotation      public.quotations%rowtype;
begin
  if p_key_hash is null or char_length(p_key_hash) not between 16 and 128 then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;

  begin
    v_submission_key := (p_payload ->> 'submission_key')::uuid;
  exception when others then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end;
  if v_submission_key is null then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;

  select * into v_quotation from public.quotations where submission_key = v_submission_key;
  if found then
    return app.quotation_result(v_quotation.id, true);
  end if;

  perform pg_advisory_xact_lock(hashtextextended('quotation:' || p_key_hash, 0));
  select count(*) into v_recent
  from public.rate_limit_events
  where action = 'quotation' and key_hash = p_key_hash and created_at > now() - c_rate_window;
  if v_recent >= c_rate_max then
    raise exception 'RATE_LIMITED' using errcode = 'P0001';
  end if;

  if jsonb_typeof(v_items) <> 'array' then
    raise exception 'INVALID_ITEMS' using errcode = 'P0001';
  end if;

  begin
    select count(*),
           count(distinct (e ->> 'product_id')::uuid),
           coalesce(bool_or((e ->> 'quantity')::int is null
                   or (e ->> 'quantity')::int < 1
                   or (e ->> 'quantity')::int > c_max_quantity), false)
      into v_line_count, v_distinct_count, v_bad_quantity
    from jsonb_array_elements(v_items) e;
  exception when others then
    raise exception 'INVALID_ITEMS' using errcode = 'P0001';
  end;

  if (v_line_count = 0 and v_text is null) or v_line_count > c_max_lines
     or v_distinct_count <> v_line_count or v_bad_quantity
     or char_length(coalesce(v_text, '')) > 5000 then
    raise exception 'INVALID_ITEMS' using errcode = 'P0001';
  end if;

  select count(*) into v_valid_count
  from jsonb_array_elements(v_items) e
  join public.products p on p.id = (e ->> 'product_id')::uuid
  join public.categories c on c.id = p.category_id
  left join public.subcategories s on s.id = p.subcategory_id
  where p.is_published and c.is_published
    and (p.subcategory_id is null or s.is_published);

  if v_valid_count <> v_line_count then
    raise exception 'INVALID_PRODUCTS' using errcode = 'P0001';
  end if;

  insert into public.quotations (
    submission_key, customer_name, company_name, business_email,
    phone_number, country, additional_message, requested_items_text
  ) values (
    v_submission_key,
    btrim(p_payload ->> 'customer_name'),
    btrim(p_payload ->> 'company_name'),
    lower(btrim(p_payload ->> 'business_email')),
    btrim(p_payload ->> 'phone_number'),
    btrim(p_payload ->> 'country'),
    nullif(btrim(coalesce(p_payload ->> 'additional_message', '')), ''),
    v_text
  )
  on conflict (submission_key) do nothing
  returning * into v_quotation;

  if v_quotation.id is null then
    select * into v_quotation from public.quotations where submission_key = v_submission_key;
    return app.quotation_result(v_quotation.id, true);
  end if;

  insert into public.quotation_items (
    quotation_id, product_id, product_name_snapshot, product_code_snapshot, quantity
  )
  select v_quotation.id, p.id, p.name, p.product_code, (x.e ->> 'quantity')::int
  from jsonb_array_elements(v_items) with ordinality as x(e, ord)
  join public.products p on p.id = (x.e ->> 'product_id')::uuid
  order by x.ord;

  insert into public.rate_limit_events (action, key_hash) values ('quotation', p_key_hash);
  delete from public.rate_limit_events where created_at < now() - interval '2 days';

  return app.quotation_result(v_quotation.id, false);
end;
$$;

revoke all on function public.submit_quotation(jsonb, text) from public, anon, authenticated;
grant execute on function public.submit_quotation(jsonb, text) to service_role;

-- quotation_result: also return the typed item list.
create or replace function app.quotation_result(p_quotation_id uuid, p_duplicate boolean)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id', q.id,
    'reference_number', q.reference_number,
    'created_at', q.created_at,
    'duplicate', p_duplicate,
    'requested_items_text', q.requested_items_text,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
               'product_name', i.product_name_snapshot,
               'product_code', i.product_code_snapshot,
               'quantity', i.quantity
             ) order by i.created_at, i.id)
      from public.quotation_items i where i.quotation_id = q.id
    ), '[]'::jsonb)
  )
  from public.quotations q
  where q.id = p_quotation_id;
$$;

revoke all on function app.quotation_result(uuid, boolean) from public, anon, authenticated;
grant execute on function app.quotation_result(uuid, boolean) to service_role;

-- ── Dashboard: include new inquiries ─────────────────────────────────────────
create or replace function public.dashboard_metrics()
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
begin
  if not app.is_admin() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'total_products',     (select count(*) from public.products),
    'published_products', (select count(*) from public.products where is_published),
    'total_quotations',   (select count(*) from public.quotations),
    'new_quotations',     (select count(*) from public.quotations where status = 'new'),
    'active_orders',      (select count(*) from public.orders where status not in ('delivered', 'cancelled')),
    'total_orders',       (select count(*) from public.orders),
    'new_inquiries',      (select count(*) from public.inquiries where status = 'new')
  );
end;
$$;

revoke all on function public.dashboard_metrics() from public, anon;
grant execute on function public.dashboard_metrics() to authenticated;
