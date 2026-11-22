-- 14 · Security hardening
-- Run AFTER files 01–13. Safe to run again.
--
-- 1. Admin login rate limit: at most 10 sign-in attempts per visitor (hashed IP)
--    per 15 minutes. Called only by the server with the secret key.
-- 2. Public site-assets bucket no longer accepts SVG files (SVG can carry scripts).

create or replace function public.check_login_rate_limit(p_key_hash text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_recent int;
begin
  if p_key_hash is null or char_length(p_key_hash) not between 16 and 128 then
    return false;
  end if;

  perform pg_advisory_xact_lock(hashtextextended('login:' || p_key_hash, 0));
  select count(*) into v_recent
  from public.rate_limit_events
  where action = 'login' and key_hash = p_key_hash and created_at > now() - interval '15 minutes';

  if v_recent >= 10 then
    return false;
  end if;

  insert into public.rate_limit_events (action, key_hash) values ('login', p_key_hash);
  delete from public.rate_limit_events where created_at < now() - interval '2 days';
  return true;
end;
$$;

revoke all on function public.check_login_rate_limit(text) from public, anon, authenticated;
grant execute on function public.check_login_rate_limit(text) to service_role;

update storage.buckets
set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'site-assets';
