-- 09 · Storage buckets and policies
-- Public buckets: files are readable by URL. Paths use random UUIDs.
-- Private bucket (certifications): files are served only through the app,
-- which checks the document is published and returns a short-lived signed URL.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('product-images',  'product-images',  true,  5242880,
     array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('category-images', 'category-images', true,  5242880,
     array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('site-assets',     'site-assets',     true,  2097152,
     array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']),
  ('certifications',  'certifications',  false, 10485760,
     array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Admins can read, upload, replace and delete files in all four buckets.
-- Nobody else can write. Anonymous users get no storage.objects access at all;
-- public bucket files are served by Supabase's public URL endpoint.
create policy "storage: admin reads app buckets" on storage.objects
  for select to authenticated
  using (
    bucket_id in ('product-images', 'category-images', 'site-assets', 'certifications')
    and (select app.is_admin())
  );

create policy "storage: admin uploads to app buckets" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('product-images', 'category-images', 'site-assets', 'certifications')
    and (select app.is_admin())
  );

create policy "storage: admin updates app buckets" on storage.objects
  for update to authenticated
  using (
    bucket_id in ('product-images', 'category-images', 'site-assets', 'certifications')
    and (select app.is_admin())
  )
  with check (
    bucket_id in ('product-images', 'category-images', 'site-assets', 'certifications')
    and (select app.is_admin())
  );

create policy "storage: admin deletes from app buckets" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('product-images', 'category-images', 'site-assets', 'certifications')
    and (select app.is_admin())
  );
