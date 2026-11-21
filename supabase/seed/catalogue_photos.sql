-- Product photos (free-licence images from Wikimedia Commons; credits on /image-credits).
-- The image files are already uploaded to Storage → product-images/catalogue/.
-- Run once in the SQL Editor after catalogue_products.sql. Safe to run again.
-- Products that already have a main photo are left unchanged.

insert into public.product_images (product_id, storage_path, alt_text, display_order, is_primary)
select p.id, v.storage_path, v.alt_text, 0, true
from (values
  ('mayo-dissecting-scissors-curved', 'catalogue/mayo-dissecting-scissors-curved.jpg', 'Mayo dissecting scissors'),
  ('metzenbaum-dissecting-scissors', 'catalogue/metzenbaum-dissecting-scissors.jpg', 'Metzenbaum dissecting scissors'),
  ('kelly-haemostatic-forceps', 'catalogue/kelly-haemostatic-forceps.jpg', 'Kelly haemostatic forceps'),
  ('adson-tissue-forceps-1x2-teeth', 'catalogue/adson-tissue-forceps-1x2-teeth.jpg', 'Adson tissue forceps'),
  ('mayo-hegar-needle-holder', 'catalogue/mayo-hegar-needle-holder.jpg', 'Mayo-Hegar needle holder'),
  ('scalpel-handle-no-3', 'catalogue/scalpel-handle-no-3.jpg', 'Scalpel handles'),
  ('weitlaner-self-retaining-retractor', 'catalogue/weitlaner-self-retaining-retractor.jpg', 'Weitlaner self-retaining retractor'),
  ('debakey-atraumatic-forceps', 'catalogue/debakey-atraumatic-forceps.jpg', 'DeBakey atraumatic forceps'),
  ('kerrison-rongeur-40', 'catalogue/kerrison-rongeur-40.jpg', 'Kerrison rongeurs'),
  ('sims-vaginal-speculum', 'catalogue/sims-vaginal-speculum.jpg', 'Sims vaginal speculum'),
  ('hegar-uterine-dilators-set', 'catalogue/hegar-uterine-dilators-set.jpg', 'Set of Hegar uterine dilators in a case'),
  ('liston-bone-cutting-forceps', 'catalogue/liston-bone-cutting-forceps.jpg', 'Bone cutting forceps'),
  ('volkmann-bone-curette', 'catalogue/volkmann-bone-curette.jpg', 'Bone curette'),
  ('dental-extraction-forceps-upper-molars', 'catalogue/dental-extraction-forceps-upper-molars.jpg', 'Dental extraction forceps for upper molars'),
  ('coupland-dental-elevator', 'catalogue/coupland-dental-elevator.jpg', 'Coupland dental elevators'),
  ('killian-nasal-speculum', 'catalogue/killian-nasal-speculum.jpg', 'Nasal speculum')
) as v(slug, storage_path, alt_text)
join public.products p on p.slug = v.slug
where not exists (select 1 from public.product_images i where i.product_id = p.id and i.is_primary)
on conflict (storage_path) do nothing;

select count(*) as products_with_photos
from public.products p
where exists (select 1 from public.product_images i where i.product_id = p.id);
