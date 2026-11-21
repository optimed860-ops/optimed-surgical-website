import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/config/env";
import { serverEnv } from "@/config/server-env";
import type { Database } from "@/types/database";

/**
 * Client using the SECRET key. It bypasses RLS.
 *
 * Allowed uses (keep this list short):
 *   - submit_quotation RPC (public quotation form → appears in the admin panel)
 *   - 60-second signed URLs for certification files, only after RLS confirmed
 *     the document is published (/api/certifications/[id]/download)
 *
 * Admin pages must use `createClient()` from ./server, so RLS still applies.
 */
export function createSecretClient() {
  const env = publicEnv();
  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, serverEnv().SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
