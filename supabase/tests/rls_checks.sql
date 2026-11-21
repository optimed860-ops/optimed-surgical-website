-- RLS self-check. Run AFTER all migration files.
--
-- Paste the whole file into the Supabase SQL Editor and click Run.
--   • "Success. No rows returned"  → every check passed.
--   • An error starting with "FAIL:" → a security rule is wrong. Do not go live.
--
-- Everything this script creates (test users, categories, products, a quotation)
-- is rolled back at the end. Nothing is left in your database.

do $$
declare
  c_admin   constant uuid := '00000000-0000-4000-8000-0000000000a1';
  c_user    constant uuid := '00000000-0000-4000-8000-0000000000b1';
  c_cat_pub constant uuid := '00000000-0000-4000-8000-0000000000c1';
  c_cat_hid constant uuid := '00000000-0000-4000-8000-0000000000c2';
  c_p_pub   constant uuid := '00000000-0000-4000-8000-0000000000d1';
  c_p_draft constant uuid := '00000000-0000-4000-8000-0000000000d2';
  c_p_hcat  constant uuid := '00000000-0000-4000-8000-0000000000d3';
  c_key     constant uuid := '00000000-0000-4000-8000-0000000000e1';

  t record;
  n bigint;
  ok boolean;
  v_result jsonb;
  v_result2 jsonb;
  v_quote_id uuid;
begin
  begin -- sub-transaction: rolled back at the end
    -- ── Fixtures (as the SQL Editor's owner role) ─────────────────────────────
    insert into auth.users (id, email, aud, role)
    values (c_admin, 'rls-admin@example.test', 'authenticated', 'authenticated'),
           (c_user,  'rls-user@example.test',  'authenticated', 'authenticated');
    insert into public.admins (user_id, full_name) values (c_admin, 'RLS Test Admin');

    insert into public.categories (id, name, slug, is_published) values
      (c_cat_pub, 'RLS Published Cat', 'rls-test-published-cat', true),
      (c_cat_hid, 'RLS Hidden Cat',    'rls-test-hidden-cat',    false);

    insert into public.products (id, category_id, name, slug, product_code, is_published) values
      (c_p_pub,   c_cat_pub, 'RLS Published Product', 'rls-test-published-product', 'RLS-001', true),
      (c_p_draft, c_cat_pub, 'RLS Draft Product',     'rls-test-draft-product',     'RLS-002', false),
      (c_p_hcat,  c_cat_hid, 'RLS Hidden-Cat Product','rls-test-hidden-cat-product','RLS-003', true);

    insert into public.product_images (product_id, storage_path, is_primary) values
      (c_p_pub,   'rls-test/pub.webp',   true),
      (c_p_draft, 'rls-test/draft.webp', true);

    insert into public.site_settings (setting_key, setting_value, is_public)
    values ('rls_test_private', '"secret"'::jsonb, false);

    -- ── service_role: quotation submission rules ──────────────────────────────
    execute 'set local role service_role';

    v_result := public.submit_quotation(jsonb_build_object(
      'submission_key', c_key,
      'customer_name', 'Test Buyer', 'company_name', 'Test Co',
      'business_email', 'BUYER@Example.test', 'phone_number', '+10000000000',
      'country', 'Testland',
      'items', jsonb_build_array(jsonb_build_object('product_id', c_p_pub, 'quantity', 5))
    ), 'rls-test-key-hash-0001');
    v_quote_id := (v_result ->> 'id')::uuid;

    if v_result ->> 'reference_number' !~ '^QT-\d{4}-\d{6}$' then
      raise exception 'FAIL: reference format is %', v_result ->> 'reference_number';
    end if;
    if v_result -> 'items' -> 0 ->> 'product_name' <> 'RLS Published Product' then
      raise exception 'FAIL: item snapshot not taken from database';
    end if;
    execute 'reset role'; -- service_role has no direct table access; read as owner
    if (select business_email from public.quotations where id = v_quote_id) is distinct from 'buyer@example.test' then
      raise exception 'FAIL: email not normalised';
    end if;
    execute 'set local role service_role';
    if v_result ? 'business_email' or v_result ? 'phone_number' then
      raise exception 'FAIL: submit result leaks customer contact details';
    end if;

    -- Same submission_key again → same quotation, no duplicate.
    v_result2 := public.submit_quotation(jsonb_build_object(
      'submission_key', c_key,
      'customer_name', 'Test Buyer', 'company_name', 'Test Co',
      'business_email', 'buyer@example.test', 'phone_number', '+10000000000',
      'country', 'Testland',
      'items', jsonb_build_array(jsonb_build_object('product_id', c_p_pub, 'quantity', 5))
    ), 'rls-test-key-hash-0001');
    if v_result2 ->> 'id' <> v_result ->> 'id' or not (v_result2 ->> 'duplicate')::boolean then
      raise exception 'FAIL: duplicate submission created a second quotation';
    end if;

    -- Unpublished product, product in hidden category, bad quantity, duplicates → rejected.
    begin
      perform public.submit_quotation(jsonb_build_object(
        'submission_key', gen_random_uuid(), 'customer_name', 'X', 'company_name', 'X',
        'business_email', 'x@example.test', 'phone_number', '+10000000000', 'country', 'XX',
        'items', jsonb_build_array(jsonb_build_object('product_id', c_p_draft, 'quantity', 1))
      ), 'rls-test-key-hash-0002');
      raise exception 'FAIL: unpublished product was accepted in a quotation';
    exception when raise_exception then
      if sqlerrm <> 'INVALID_PRODUCTS' then raise; end if;
    end;

    begin
      perform public.submit_quotation(jsonb_build_object(
        'submission_key', gen_random_uuid(), 'customer_name', 'X', 'company_name', 'X',
        'business_email', 'x@example.test', 'phone_number', '+10000000000', 'country', 'XX',
        'items', jsonb_build_array(jsonb_build_object('product_id', c_p_hcat, 'quantity', 1))
      ), 'rls-test-key-hash-0002');
      raise exception 'FAIL: product in unpublished category was accepted';
    exception when raise_exception then
      if sqlerrm <> 'INVALID_PRODUCTS' then raise; end if;
    end;

    begin
      perform public.submit_quotation(jsonb_build_object(
        'submission_key', gen_random_uuid(), 'customer_name', 'X', 'company_name', 'X',
        'business_email', 'x@example.test', 'phone_number', '+10000000000', 'country', 'XX',
        'items', jsonb_build_array(jsonb_build_object('product_id', c_p_pub, 'quantity', 0))
      ), 'rls-test-key-hash-0002');
      raise exception 'FAIL: quantity 0 was accepted';
    exception when raise_exception then
      if sqlerrm <> 'INVALID_ITEMS' then raise; end if;
    end;

    begin
      perform public.submit_quotation(jsonb_build_object(
        'submission_key', gen_random_uuid(), 'customer_name', 'X', 'company_name', 'X',
        'business_email', 'x@example.test', 'phone_number', '+10000000000', 'country', 'XX',
        'items', jsonb_build_array(
          jsonb_build_object('product_id', c_p_pub, 'quantity', 1),
          jsonb_build_object('product_id', c_p_pub, 'quantity', 2))
      ), 'rls-test-key-hash-0002');
      raise exception 'FAIL: duplicate product lines were accepted';
    exception when raise_exception then
      if sqlerrm <> 'INVALID_ITEMS' then raise; end if;
    end;

    -- Typed item list only (no catalogue lines) is accepted; nothing at all is not.
    v_result2 := public.submit_quotation(jsonb_build_object(
      'submission_key', gen_random_uuid(), 'customer_name', 'Text Buyer', 'company_name', 'Text Co',
      'business_email', 'text@example.test', 'phone_number', '+10000000000', 'country', 'Testland',
      'requested_items_text', 'ABC-123 x 200'
    ), 'rls-test-key-hash-0003');
    if v_result2 ->> 'requested_items_text' <> 'ABC-123 x 200' or jsonb_array_length(v_result2 -> 'items') <> 0 then
      raise exception 'FAIL: typed item list quotation not saved correctly';
    end if;
    begin
      perform public.submit_quotation(jsonb_build_object(
        'submission_key', gen_random_uuid(), 'customer_name', 'X', 'company_name', 'X',
        'business_email', 'x@example.test', 'phone_number', '+10000000000', 'country', 'XX'
      ), 'rls-test-key-hash-0003');
      raise exception 'FAIL: empty quotation (no items, no text) was accepted';
    exception when raise_exception then
      if sqlerrm <> 'INVALID_ITEMS' then raise; end if;
    end;

    -- Catalogue / contact inquiries
    v_result2 := public.submit_inquiry(jsonb_build_object(
      'submission_key', gen_random_uuid(), 'inquiry_type', 'catalogue', 'customer_name', 'Cat Buyer',
      'email', 'CAT@Example.test', 'country', 'Testland', 'requested_items_text', 'Scissors x 50'
    ), 'rls-test-key-hash-0004');
    if v_result2 ->> 'reference_number' !~ '^INQ-\d{4}-\d{6}$' then
      raise exception 'FAIL: inquiry reference format is %', v_result2 ->> 'reference_number';
    end if;

    execute 'reset role';

    -- ── Role checks ───────────────────────────────────────────────────────────
    -- kind 'read'  : expected = number of fixture rows the role may see (denied = 0)
    -- kind 'write' : expected = 1 allowed, 0 blocked (error or 0 rows changed)
    for t in
      select * from (values
        -- anon
        ('anon', null::uuid, 'read',  format('select count(*) from public.categories where id in (%L,%L)', c_cat_pub, c_cat_hid), 1),
        ('anon', null, 'read',  format('select count(*) from public.products where id in (%L,%L,%L)', c_p_pub, c_p_draft, c_p_hcat), 1),
        ('anon', null, 'read',  format('select count(*) from public.product_images where product_id in (%L,%L)', c_p_pub, c_p_draft), 1),
        ('anon', null, 'read',  'select count(*) from public.quotations', 0),
        ('anon', null, 'read',  'select count(*) from public.quotation_items', 0),
        ('anon', null, 'read',  'select count(*) from public.orders', 0),
        ('anon', null, 'read',  'select count(*) from public.order_updates', 0),
        ('anon', null, 'read',  'select count(*) from public.admins', 0),
        ('anon', null, 'read',  'select count(*) from public.rate_limit_events', 0),
        ('anon', null, 'read',  $q$select count(*) from public.site_settings where setting_key = 'rls_test_private'$q$, 0),
        ('anon', null, 'write', $q$insert into public.categories (name, slug) values ('x', 'rls-anon-insert')$q$, 0),
        ('anon', null, 'write', format('update public.products set name = %L where id = %L', 'hacked', c_p_pub), 0),
        ('anon', null, 'write', $q$select public.submit_quotation('{}'::jsonb, 'xxxxxxxxxxxxxxxxxxxx')$q$, 0),
        ('anon', null, 'write', $q$select public.create_order('{}'::jsonb)$q$, 0),
        ('anon', null, 'read',  'select count(*) from public.inquiries', 0),
        ('anon', null, 'write', $q$select public.submit_inquiry('{}'::jsonb, 'xxxxxxxxxxxxxxxxxxxx')$q$, 0),
        ('authenticated', c_user, 'read',  'select count(*) from public.inquiries', 0),
        ('authenticated', c_user, 'write', $q$select public.submit_inquiry('{}'::jsonb, 'xxxxxxxxxxxxxxxxxxxx')$q$, 0),
        ('authenticated', c_admin, 'read', $q$select count(*) from public.inquiries where email = 'cat@example.test'$q$, 1),
        ('authenticated', c_admin, 'write', $q$update public.inquiries set status = 'in_progress' where email = 'cat@example.test'$q$, 1),
        ('authenticated', c_admin, 'write', $q$update public.inquiries set email = 'changed@example.test'$q$, 0),
        ('anon', null, 'write', 'select public.dashboard_metrics()', 0),

        -- signed-in but NOT an admin
        ('authenticated', c_user, 'read',  format('select count(*) from public.products where id in (%L,%L,%L)', c_p_pub, c_p_draft, c_p_hcat), 1),
        ('authenticated', c_user, 'read',  'select count(*) from public.quotations', 0),
        ('authenticated', c_user, 'read',  'select count(*) from public.orders', 0),
        ('authenticated', c_user, 'read',  'select count(*) from public.order_updates', 0),
        ('authenticated', c_user, 'read',  'select count(*) from public.admins', 0),
        ('authenticated', c_user, 'write', $q$insert into public.categories (name, slug) values ('x', 'rls-user-insert')$q$, 0),
        ('authenticated', c_user, 'write', format($q$update public.quotations set status = 'approved' where id = %L$q$, v_quote_id), 0),
        ('authenticated', c_user, 'write', format('delete from public.products where id = %L', c_p_pub), 0),
        ('authenticated', c_user, 'write', $q$select public.submit_quotation('{}'::jsonb, 'xxxxxxxxxxxxxxxxxxxx')$q$, 0),
        ('authenticated', c_user, 'write', 'select public.dashboard_metrics()', 0),
        ('authenticated', c_user, 'write', format($q$select public.create_order(jsonb_build_object('customer_name','x','company_name','x','customer_email','x@example.test','items',jsonb_build_array(jsonb_build_object('product_name','x','quantity',1))))$q$), 0),

        -- admin
        ('authenticated', c_admin, 'read',  format('select count(*) from public.categories where id in (%L,%L)', c_cat_pub, c_cat_hid), 2),
        ('authenticated', c_admin, 'read',  format('select count(*) from public.products where id in (%L,%L,%L)', c_p_pub, c_p_draft, c_p_hcat), 3),
        ('authenticated', c_admin, 'read',  format('select count(*) from public.quotations where id = %L', v_quote_id), 1),
        ('authenticated', c_admin, 'read',  format('select count(*) from public.quotation_items where quotation_id = %L', v_quote_id), 1),
        ('authenticated', c_admin, 'read',  $q$select count(*) from public.site_settings where setting_key = 'rls_test_private'$q$, 1),
        ('authenticated', c_admin, 'write', format($q$update public.quotations set status = 'under_review' where id = %L$q$, v_quote_id), 1),
        ('authenticated', c_admin, 'write', $q$insert into public.categories (name, slug) values ('x', 'rls-admin-insert')$q$, 1),
        ('authenticated', c_admin, 'write', 'select public.dashboard_metrics()', 1),
        ('authenticated', c_admin, 'write', format($q$select public.create_order(jsonb_build_object('quotation_id',%L,'customer_name','x','company_name','x','customer_email','x@example.test','items',jsonb_build_array(jsonb_build_object('product_id',%L,'quantity',5))))$q$, v_quote_id, c_p_pub), 1),
        ('authenticated', c_admin, 'write', $q$update public.order_updates set message = 'edited'$q$, 0),
        ('authenticated', c_admin, 'write', $q$delete from public.order_updates$q$, 0),
        ('authenticated', c_admin, 'write', format($q$update public.quotations set customer_name = 'changed' where id = %L$q$, v_quote_id), 0)
      ) as v(role_name, uid, kind, sql, expected)
    loop
      execute format('set local role %I', t.role_name);
      perform set_config('request.jwt.claims',
        case when t.uid is null then '{"role":"anon"}'
             else json_build_object('sub', t.uid, 'role', 'authenticated')::text end,
        true);

      if t.kind = 'read' then
        begin
          execute t.sql into n;
        exception when insufficient_privilege then
          n := 0;
        end;
        execute 'reset role';
        if n <> t.expected then
          raise exception 'FAIL: % (uid %) read "%" → % rows, expected %',
            t.role_name, t.uid, t.sql, n, t.expected;
        end if;
      else
        begin
          execute t.sql;
          get diagnostics n = row_count;
          ok := n > 0;
        exception when insufficient_privilege then
          ok := false;
        end;
        execute 'reset role';
        if ok <> (t.expected = 1) then
          raise exception 'FAIL: % (uid %) write "%" was %, expected %',
            t.role_name, t.uid, t.sql,
            case when ok then 'ALLOWED' else 'BLOCKED' end,
            case when t.expected = 1 then 'ALLOWED' else 'BLOCKED' end;
        end if;
      end if;
    end loop;

    -- The admin's create_order above must have marked the quotation converted.
    if (select status from public.quotations where id = v_quote_id) <> 'converted_to_order' then
      raise exception 'FAIL: create_order did not mark the quotation as converted';
    end if;

    raise exception 'RLS_CHECKS_PASSED';
  exception when raise_exception then
    if sqlerrm <> 'RLS_CHECKS_PASSED' then
      raise;
    end if;
    -- All checks passed. The sub-transaction is rolled back, so no test data remains.
  end;
end;
$$;
