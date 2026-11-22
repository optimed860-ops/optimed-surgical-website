import { NextResponse, connection } from "next/server";
import { timingSafeEqual } from "node:crypto";

/**
 * Daily keep-alive for the free Supabase project (paused after 7 days without
 * requests). Called by Vercel Cron (see vercel.json), which sends
 * "Authorization: Bearer <CRON_SECRET>". Reads one public settings row.
 */
export async function GET(request: Request) {
  await connection();
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret ?? ""}`;
  const authorised =
    Boolean(secret) && auth.length === expected.length && timingSafeEqual(Buffer.from(auth), Buffer.from(expected));
  if (!authorised) return new NextResponse("Unauthorized", { status: 401 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return new NextResponse("Supabase not configured", { status: 500 });

  const res = await fetch(`${url.replace(/\/$/, "")}/rest/v1/site_settings?select=setting_key&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  console.log(`[keep-alive] Supabase answered ${res.status}`);
  return NextResponse.json({ supabase: res.status }, { status: res.ok ? 200 : 502, headers: { "Cache-Control": "no-store" } });
}
