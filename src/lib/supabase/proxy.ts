import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

const LOGIN_PATH = "/admin/login";

/**
 * Refreshes the Supabase session cookie and sends signed-out visitors to the
 * admin login page. This is only a convenience redirect. Real authorization
 * happens in requireAdmin() and in the database (RLS).
 */
export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    // Not configured yet. The login page shows a setup message.
    return request.nextUrl.pathname === LOGIN_PATH
      ? NextResponse.next({ request })
      : NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        for (const [header, value] of Object.entries(headers)) {
          response.headers.set(header, value);
        }
      },
    },
  });

  // Do not put code between createServerClient and getClaims (session refresh).
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);
  const path = request.nextUrl.pathname;

  if (!signedIn && path !== LOGIN_PATH) {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set("next", path);
    return NextResponse.redirect(loginUrl);
  }

  // Admin responses are private and must never be cached by a CDN.
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
