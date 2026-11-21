import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/config/env";
import type { Database } from "@/types/database";

/**
 * Cookie-free client for public catalogue reads. It acts as an anonymous
 * visitor, so RLS only returns published content. Because it doesn't touch
 * cookies, it can be used inside `"use cache"` functions.
 */
export function createPublicClient() {
  const env = publicEnv();
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
  );
}
