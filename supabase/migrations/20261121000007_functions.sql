-- 07 · Transactional functions
-- Each function runs as one transaction: all rows are saved, or none are.
-- Keep the limits below in sync with src/config/limits.ts.

-- ═══════════════════════════════════════════════════════════════════════════
-- submit_quotation: public quotation requests.
-- Only the server (service_role / secret key) may call it. The server runs
-- validation, honeypot and timing checks first. This function re-checks
-- everything that matters and takes product names and codes from the database,
-- never from the browser.
-- ═══════════════════════════════════════════════════════════════════════════
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
  v_items          jsonb := p_payload -> 'items';
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

  -- Idempotency: the same submission sent twice returns the first result.
  select * into v_quotation from public.quotations where submission_key = v_submission_key;
  if found then
    return app.quotation_result(v_quotation.id, true);
  end if;

  -- Rate limit per hashed visitor key. The advisory lock serialises bursts.
  perform pg_advisory_xact_lock(hashtextextended('quotation:' || p_key_hash, 0));
  select count(*) into v_recent
  from public.rate_limit_events
  where action = 'quotation' and key_hash = p_key_hash and created_at > now() - c_rate_window;
  if v_recent >= c_rate_max then
    raise exception 'RATE_LIMITED' using errcode = 'P0001';
  end if;

  -- Items: shape, count, duplicates, quantities.
  if v_items is null or jsonb_typeof(v_items) <> 'array' then
    raise exception 'INVALID_ITEMS' using errcode = 'P0001';
  end if;

  begin
    select count(*),
           count(distinct (e ->> 'product_id')::uuid),
           bool_or((e ->> 'quantity')::int is null
                   or (e ->> 'quantity')::int < 1
                   or (e ->> 'quantity')::int > c_max_quantity)
      into v_line_count, v_distinct_count, v_bad_quantity
    from jsonb_array_elements(v_items) e;
  exception when others then
    raise exception 'INVALID_ITEMS' using errcode = 'P0001';
  end;

  if v_line_count = 0 or v_line_count > c_max_lines
     or v_distinct_count <> v_line_count or v_bad_quantity then
    raise exception 'INVALID_ITEMS' using errcode = 'P0001';
  end if;

  -- Every product must exist and be publicly visible.
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

  -- Save the quotation. A concurrent duplicate submission_key is handled here.
  insert into public.quotations (
    submission_key, customer_name, company_name, business_email,
    phone_number, country, additional_message
  ) values (
    v_submission_key,
    btrim(p_payload ->> 'customer_name'),
    btrim(p_payload ->> 'company_name'),
    lower(btrim(p_payload ->> 'business_email')),
    btrim(p_payload ->> 'phone_number'),
    btrim(p_payload ->> 'country'),
    nullif(btrim(coalesce(p_payload ->> 'additional_message', '')), '')
  )
  on conflict (submission_key) do nothing
  returning * into v_quotation;

  if v_quotation.id is null then
    select * into v_quotation from public.quotations where submission_key = v_submission_key;
    return app.quotation_result(v_quotation.id, true);
  end if;

  -- Snapshots come from the database, not from the payload.
  insert into public.quotation_items (
    quotation_id, product_id, product_name_snapshot, product_code_snapshot, quantity
  )
  select v_quotation.id, p.id, p.name, p.product_code, (e ->> 'quantity')::int
  from jsonb_array_elements(v_items) with ordinality as x(e, ord)
  join public.products p on p.id = (x.e ->> 'product_id')::uuid
  order by x.ord;

  insert into public.rate_limit_events (action, key_hash) values ('quotation', p_key_hash);

  -- Opportunistic cleanup of old rate-limit rows.
  delete from public.rate_limit_events where created_at < now() - interval '2 days';

  return app.quotation_result(v_quotation.id, false);
end;
$$;

-- Builds the JSON returned to the server (shown on the success screen).
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
    'customer_name', q.customer_name,
    'company_name', q.company_name,
    'business_email', q.business_email,
    'phone_number', q.phone_number,
    'country', q.country,
    'additional_message', q.additional_message,
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

revoke all on function public.submit_quotation(jsonb, text) from public, anon, authenticated;
grant execute on function public.submit_quotation(jsonb, text) to service_role;
revoke all on function app.quotation_result(uuid, boolean) from public, anon, authenticated;
grant execute on function app.quotation_result(uuid, boolean) to service_role;

-- ═══════════════════════════════════════════════════════════════════════════
-- create_order: admin creates an order, optionally from a quotation.
-- SECURITY INVOKER, so RLS still applies to every row it writes.
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function public.create_order(p_payload jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_order_id      uuid;
  v_quotation_id  uuid := nullif(p_payload ->> 'quotation_id', '')::uuid;
  v_status        text := coalesce(nullif(p_payload ->> 'status', ''), 'processing');
  v_items         jsonb := p_payload -> 'items';
begin
  if not app.is_admin() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  if v_items is null or jsonb_typeof(v_items) <> 'array' or jsonb_array_length(v_items) = 0 then
    raise exception 'INVALID_ITEMS' using errcode = 'P0001';
  end if;

  if v_quotation_id is not null and not exists (
    select 1 from public.quotations where id = v_quotation_id
  ) then
    raise exception 'QUOTATION_NOT_FOUND' using errcode = 'P0001';
  end if;

  insert into public.orders (
    quotation_id, internal_reference, customer_name, company_name,
    customer_email, phone_number, country, status, internal_notes
  ) values (
    v_quotation_id,
    nullif(btrim(coalesce(p_payload ->> 'internal_reference', '')), ''),
    btrim(p_payload ->> 'customer_name'),
    btrim(p_payload ->> 'company_name'),
    lower(btrim(p_payload ->> 'customer_email')),
    nullif(btrim(coalesce(p_payload ->> 'phone_number', '')), ''),
    nullif(btrim(coalesce(p_payload ->> 'country', '')), ''),
    v_status,
    nullif(btrim(coalesce(p_payload ->> 'internal_notes', '')), '')
  )
  returning id into v_order_id;

  -- If a product is linked, its current name and code become the snapshot.
  insert into public.order_items (
    order_id, product_id, product_name_snapshot, product_code_snapshot, quantity
  )
  select v_order_id,
         p.id,
         coalesce(p.name, btrim(e ->> 'product_name')),
         case when p.id is not null then p.product_code
              else nullif(btrim(coalesce(e ->> 'product_code', '')), '') end,
         (e ->> 'quantity')::int
  from jsonb_array_elements(v_items) with ordinality as x(e, ord)
  left join public.products p on p.id = nullif(x.e ->> 'product_id', '')::uuid
  order by x.ord;

  insert into public.order_updates (order_id, status, message, created_by)
  values (v_order_id, v_status, 'Order created', auth.uid());

  if v_quotation_id is not null
     and coalesce((p_payload ->> 'mark_quotation_converted')::boolean, true) then
    update public.quotations set status = 'converted_to_order' where id = v_quotation_id;
  end if;

  return v_order_id;
end;
$$;

revoke all on function public.create_order(jsonb) from public, anon;
grant execute on function public.create_order(jsonb) to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- add_order_update: history row + status change in one step.
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function public.add_order_update(
  p_order_id uuid,
  p_status text,
  p_message text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_update_id uuid;
begin
  if not app.is_admin() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  update public.orders set status = p_status where id = p_order_id;
  if not found then
    raise exception 'ORDER_NOT_FOUND' using errcode = 'P0001';
  end if;

  insert into public.order_updates (order_id, status, message, created_by)
  values (p_order_id, p_status, nullif(btrim(coalesce(p_message, '')), ''), auth.uid())
  returning id into v_update_id;

  return v_update_id;
end;
$$;

revoke all on function public.add_order_update(uuid, text, text) from public, anon;
grant execute on function public.add_order_update(uuid, text, text) to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- dashboard_metrics: real counts only.
-- ═══════════════════════════════════════════════════════════════════════════
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
    'total_orders',       (select count(*) from public.orders)
  );
end;
$$;

revoke all on function public.dashboard_metrics() from public, anon;
grant execute on function public.dashboard_metrics() to authenticated;
