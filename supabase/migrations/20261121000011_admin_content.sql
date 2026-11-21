-- 11 · Admin-editable website content and extra contact settings
-- Run AFTER files 01–10.
--
-- site_content holds text edited in Admin → Website content. It is merged over
-- the built-in defaults, so an empty value simply means "use the default".

insert into public.site_settings (setting_key, setting_value, is_public) values
  ('site_content',    '{}'::jsonb, true),
  ('whatsapp_number', null,        true)
on conflict (setting_key) do nothing;

-- Admins may also remove a quotation/inquiry by mistake? No: records stay for
-- auditability (status only). Orders: allow admins to delete an order that was
-- created by mistake, together with its items and history.
grant delete on public.orders to authenticated;
drop policy if exists "orders: admin deletes" on public.orders;
create policy "orders: admin deletes" on public.orders
  for delete to authenticated using ((select app.is_admin()));
