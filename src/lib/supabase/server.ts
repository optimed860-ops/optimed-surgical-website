import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { publicEnv } from "@/config/env";
import type { Database } from "@/types/database";

/**
 * Supabase client for the current request, acting as the signed-in user.
 * RLS decides what it can read and write. Use it for admin pages and actions.
 * It reads cookies, so it can't run inside a `"use cache"` scope.
 */
export async function createClient() {
  // Read cookies first: this marks the render as request-time, so the build
  // never tries to prerender admin pages with real credentials.
  const cookieStore = await cookies();
  const env = publicEnv();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component, where cookies are read-only.
            // The proxy refreshes the session, so this is safe to ignore.
          }
        },
      },
    },
  );
}
