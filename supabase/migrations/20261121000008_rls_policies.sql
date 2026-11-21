-- 08 · Row Level Security and table privileges
-- anon          = public visitor
-- authenticated = any signed-in user (NOT automatically an admin)
-- admin         = authenticated AND listed in public.admins (app.is_admin())
-- service_role  = server-only secret key; bypasses RLS. Used only for submit_quotation.
-- Public form submissions are visible ONLY to admins (admin panel). No emails are sent.

-- ── 1. Start from zero privileges, then grant explicitly ──────────────────────
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
alter default privileges in schema public revoke all on tables    from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke execute on functions from anon, authenticated, public;

-- Public catalogue (rows are still filtered by RLS below)
grant select on public.categories, public.subcategories, public.products,
                public.product_images, public.certifications, public.site_settings
  to anon, authenticated;

-- Admin write access (rows filtered by RLS below)
grant insert, update, delete on public.categories, public.subcategories, public.products,
                                public.product_images, public.certifications
  to authenticated;
grant update (setting_value, is_public) on public.site_settings to authenticated;
grant insert on public.site_settings to authenticated;

grant select on public.admins to authenticated;

grant select on public.quotations, public.quotation_items to authenticated;
grant update (status, internal_notes) on public.quotations to authenticated;

grant select, insert, update on public.orders to authenticated;
grant select, insert, update, delete on public.order_items to authenticated;
grant select, insert on public.order_updates to authenticated;
grant usage on sequence public.order_ref_seq to authenticated;

-- rate_limit_events: no grants at all. Only submit_quotation touches it.

-- ── 2. Enable RLS on every table ──────────────────────────────────────────────
-- (Not FORCE: the table owner must keep access so SECURITY DEFINER functions work.
--  anon / authenticated never own tables, so RLS always applies to them.)
do $$
declare t text;
begin
  foreach t in array array[
    'admins', 'categories', 'subcategories', 'products', 'product_images',
    'quotations', 'quotation_items', 'orders', 'order_items', 'order_updates',
    'certifications', 'site_settings', 'rate_limit_events'
  ] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end;
$$;

-- ── 3. Policies ───────────────────────────────────────────────────────────────
-- (select app.is_admin()) is wrapped so Postgres evaluates it once per query.

-- admins: a signed-in user can see only their own row (used by requireAdmin).
create policy "admins: read own row" on public.admins
  for select to authenticated
  using (user_id = (select auth.uid()));

-- categories
create policy "categories: public reads published" on public.categories
  for select to anon, authenticated
  using (is_published);
create policy "categories: admin full access" on public.categories
  for all to authenticated
  using ((select app.is_admin())) with check ((select app.is_admin()));

-- subcategories
create policy "subcategories: public reads published" on public.subcategories
  for select to anon, authenticated
  using (
    is_published
    and exists (select 1 from public.categories c where c.id = category_id and c.is_published)
  );
create policy "subcategories: admin full access" on public.subcategories
  for all to authenticated
  using ((select app.is_admin())) with check ((select app.is_admin()));

-- products: visible only if the product, its category and its subcategory are all published.
create policy "products: public reads published" on public.products
  for select to anon, authenticated
  using (
    is_published
    and exists (select 1 from public.categories c where c.id = category_id and c.is_published)
    and (
      subcategory_id is null
      or exists (select 1 from public.subcategories s where s.id = subcategory_id and s.is_published)
    )
  );
create policy "products: admin full access" on public.products
  for all to authenticated
  using ((select app.is_admin())) with check ((select app.is_admin()));

-- product_images: visible when the parent product is visible to the caller.
create policy "product_images: public reads images of visible products" on public.product_images
  for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id));
create policy "product_images: admin full access" on public.product_images
  for all to authenticated
  using ((select app.is_admin())) with check ((select app.is_admin()));

-- quotations / items: admin only. Inserts happen only through submit_quotation.
create policy "quotations: admin reads" on public.quotations
  for select to authenticated using ((select app.is_admin()));
create policy "quotations: admin updates" on public.quotations
  for update to authenticated
  using ((select app.is_admin())) with check ((select app.is_admin()));
create policy "quotation_items: admin reads" on public.quotation_items
  for select to authenticated using ((select app.is_admin()));

-- orders
create policy "orders: admin reads" on public.orders
  for select to authenticated using ((select app.is_admin()));
create policy "orders: admin inserts" on public.orders
  for insert to authenticated with check ((select app.is_admin()));
create policy "orders: admin updates" on public.orders
  for update to authenticated
  using ((select app.is_admin())) with check ((select app.is_admin()));

create policy "order_items: admin full access" on public.order_items
  for all to authenticated
  using ((select app.is_admin())) with check ((select app.is_admin()));

-- order_updates: append-only (no update/delete policy or grant).
create policy "order_updates: admin reads" on public.order_updates
  for select to authenticated using ((select app.is_admin()));
create policy "order_updates: admin inserts" on public.order_updates
  for insert to authenticated with check ((select app.is_admin()));

-- certifications
create policy "certifications: public reads published" on public.certifications
  for select to anon, authenticated
  using (is_published);
create policy "certifications: admin full access" on public.certifications
  for all to authenticated
  using ((select app.is_admin())) with check ((select app.is_admin()));

-- site_settings
create policy "site_settings: public reads public keys" on public.site_settings
  for select to anon, authenticated
  using (is_public);
create policy "site_settings: admin reads all" on public.site_settings
  for select to authenticated using ((select app.is_admin()));
create policy "site_settings: admin inserts" on public.site_settings
  for insert to authenticated with check ((select app.is_admin()));
create policy "site_settings: admin updates" on public.site_settings
  for update to authenticated
  using ((select app.is_admin())) with check ((select app.is_admin()));

-- rate_limit_events: RLS on, no policies → nobody except service_role / definer functions.
