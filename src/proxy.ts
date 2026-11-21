import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

// Only admin routes need the session. Public pages stay cookie-free and cacheable.
export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
