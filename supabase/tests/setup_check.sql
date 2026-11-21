-- SETUP CHECK · paste into the Supabase SQL Editor and click Run.
-- Shows what is installed (✅) and what is still missing (❌). Changes nothing.
-- Works even when some files have not been run yet (counts use dynamic SQL).

with n as (
  select
    case when to_regclass('public.admins') is not null then
      (xpath('/row/c/text()', query_to_xml('select count(*) as c from public.admins', false, true, '')))[1]::text::int
    else 0 end as admins,
    case when to_regclass('public.products') is not null then
      (xpath('/row/c/text()', query_to_xml('select count(*) as c from public.products', false, true, '')))[1]::text::int
    else 0 end as products,
    case when to_regclass('public.site_settings') is not null then
      (xpath('/row/c/text()', query_to_xml($q$select count(*) as c from public.site_settings where setting_key = 'site_content'$q$, false, true, '')))[1]::text::int
    else 0 end as content_rows,
    case when to_regclass('public.blog_posts') is not null then
      (xpath('/row/c/text()', query_to_xml('select count(*) as c from public.blog_posts', false, true, '')))[1]::text::int
    else 0 end as blog_posts
)
select step, item, case when ok then '✅ done' else '❌ missing' end as status, how_to_fix
from n, lateral (values
  (1,  'File 01 · helpers',               exists(select 1 from pg_proc p join pg_namespace s on s.oid = p.pronamespace where s.nspname = 'app' and p.proname = 'set_updated_at'), 'Run migrations/20261121000001_extensions_and_helpers.sql'),
  (2,  'File 02 · admins table',          to_regclass('public.admins') is not null,         'Run migrations/20261121000002_admins.sql'),
  (3,  'File 03 · catalogue tables',      to_regclass('public.products') is not null,       'Run migrations/20261121000003_catalogue.sql'),
  (4,  'File 04 · quotations',            to_regclass('public.quotations') is not null,     'Run migrations/20261121000004_quotations.sql'),
  (5,  'File 05 · orders',                to_regclass('public.orders') is not null,         'Run migrations/20261121000005_orders.sql'),
  (6,  'File 06 · certifications/settings', to_regclass('public.site_settings') is not null, 'Run migrations/20261121000006_certifications_and_settings.sql'),
  (7,  'File 07 · functions',             exists(select 1 from pg_proc where proname = 'create_order'), 'Run migrations/20261121000007_functions.sql'),
  (8,  'File 08 · security (RLS)',        exists(select 1 from pg_policies where tablename = 'products'), 'Run migrations/20261121000008_rls_policies.sql'),
  (9,  'File 09 · storage buckets',       exists(select 1 from storage.buckets where id = 'product-images'), 'Run migrations/20261121000009_storage.sql'),
  (10, 'File 10 · forms (inquiries)',     to_regclass('public.inquiries') is not null,      'Run migrations/20261121000010_inquiries_and_free_text.sql'),
  (11, 'File 11 · admin content',         n.content_rows > 0,                               'Run migrations/20261121000011_admin_content.sql'),
  (12, 'File 12 · blog',                  to_regclass('public.blog_posts') is not null,     'Run migrations/20261121000012_blog.sql'),
  (13, 'Admin account linked',            n.admins > 0,
       'Create a user in Authentication → Users (tick Auto Confirm), then run: insert into public.admins (user_id, full_name) select id, ''Admin'' from auth.users where email = ''YOUR@EMAIL'';'),
  (14, 'Products loaded (optional)',      n.products > 0,                                   'Run seed/catalogue_products.sql, then seed/catalogue_photos.sql'),
  (15, 'Blog articles (optional)',        n.blog_posts > 0,                                 'Run seed/blog_posts.sql')
) as t(step, item, ok, how_to_fix)
order by step;
