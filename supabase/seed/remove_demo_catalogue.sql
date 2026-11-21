-- Removes the DEMO catalogue (everything created by demo_catalogue.sql).
-- Safe: it only deletes products whose code starts with "DEMO-", then the
-- demo categories/subcategories ONLY if no real products use them.
-- Quotations that mention demo products keep their saved names and codes.

begin;

delete from public.products where product_code like 'DEMO-%';

delete from public.subcategories s
where s.slug in ('patient-monitoring', 'infusion-therapy', 'diagnostics', 'scissors', 'forceps-clamps',
                 'retractors', 'handpieces', 'dental-instruments', 'protective-wear', 'disposables')
  and not exists (select 1 from public.products p where p.subcategory_id = s.id);

delete from public.categories c
where c.slug in ('medical-equipment', 'surgical-instruments', 'dental-products', 'hospital-supplies')
  and not exists (select 1 from public.products p where p.category_id = c.id)
  and not exists (select 1 from public.subcategories s where s.category_id = c.id);

commit;
