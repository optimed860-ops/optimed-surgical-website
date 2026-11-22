-- KEEP SUPABASE AWAKE (free plan)
-- Paste into Supabase → SQL Editor and click Run. Run it once; it then repeats by itself every day.
--
-- Before running, replace the 3 placeholders below:
--   YOUR-PROJECT-URL       → Project Settings → Data API → Project URL   (e.g. https://abcd1234.supabase.co)
--   YOUR-PUBLISHABLE-KEY   → Project Settings → API Keys → Publishable key (sb_publishable_…)  (twice)
-- Use only the PUBLISHABLE key here, never the secret key.
--
-- What it does every day at 06:00 UTC (11:00 Pakistan):
--   1. updates one row in public.keep_alive (database activity)
--   2. calls your project's own REST API through pg_net (API activity)

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- One-row heartbeat table. RLS on with no policies, so visitors cannot read or change it.
create table if not exists public.keep_alive (
  id        int primary key default 1 check (id = 1),
  pinged_at timestamptz not null default now()
);
alter table public.keep_alive enable row level security;
revoke all on public.keep_alive from anon, authenticated;

-- Replace an older copy of the job if this file is run again.
select cron.unschedule(jobid) from cron.job where jobname = 'keep-supabase-awake';

select cron.schedule(
  'keep-supabase-awake',
  '0 6 * * *',
  $job$
    insert into public.keep_alive (id, pinged_at) values (1, now())
      on conflict (id) do update set pinged_at = excluded.pinged_at;

    select net.http_get(
      url     := 'YOUR-PROJECT-URL/rest/v1/site_settings?select=setting_key&limit=1',
      headers := jsonb_build_object(
        'apikey',        'YOUR-PUBLISHABLE-KEY',
        'Authorization', 'Bearer YOUR-PUBLISHABLE-KEY'
      )
    );
  $job$
);

-- ── Check it is working (run these any time) ──────────────────────────────────
-- select jobname, schedule, active from cron.job;                                   -- the job exists
-- select status, start_time from cron.job_run_details order by start_time desc limit 5;  -- daily runs
-- select pinged_at from public.keep_alive;                                          -- last heartbeat
-- select status_code, created from net._http_response order by created desc limit 5;    -- API call result (200 = OK)

-- ── Run it right now once (optional test) ─────────────────────────────────────
-- Copy the two statements between the $job$ markers above and run them on their own.

-- ── Stop it ───────────────────────────────────────────────────────────────────
-- select cron.unschedule('keep-supabase-awake');
