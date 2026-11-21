/**
 * Netlify Scheduled Function: runs once a day and makes one small read request
 * to Supabase, so a free-plan project never counts as "inactive" (free projects
 * are paused after 7 days without requests).
 *
 * Uses only the public publishable key and reads one public settings row.
 * Logs: Netlify → Logs → Functions → keep-supabase-awake.
 */
export default async function keepSupabaseAwake(): Promise<Response> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    console.error("[keep-awake] Supabase URL or publishable key is not set in Netlify environment variables");
    return new Response("not configured", { status: 500 });
  }

  const res = await fetch(`${url.replace(/\/$/, "")}/rest/v1/site_settings?select=setting_key&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(20_000),
  });
  console.log(`[keep-awake] Supabase answered ${res.status} at ${new Date().toISOString()}`);
  return new Response(`supabase ${res.status}`, { status: res.ok ? 200 : 502 });
}

/** Every day at 06:00 UTC (11:00 in Pakistan). */
export const config = { schedule: "0 6 * * *" };
