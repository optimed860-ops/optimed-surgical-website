import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type AdminUser = {
  id: string;
  email: string | null;
  fullName: string | null;
};

/**
 * Returns the current admin, or null. Verifies the token with Supabase Auth
 * (getUser) and checks the admins allowlist. Never trust a role value sent by
 * the browser. Wrapped in React cache(), so it runs once per request.
 */
export const getAdmin = cache(async function getAdmin(): Promise<AdminUser | null> {
  // Admin checks always run per request: Supabase compares token times with the
  // clock (Date.now), which Next.js must never try to prerender.
  await connection();
  const supabase = await createClient();
  const { data: userData, error } = await supabase.auth.getUser();
  if (error || !userData.user) return null;

  // RLS lets a user read only their own admins row, so this also proves membership.
  const { data: admin } = await supabase
    .from("admins")
    .select("user_id, full_name")
    .eq("user_id", userData.user.id)
    .maybeSingle();
  if (!admin) return null;

  return { id: admin.user_id, email: userData.user.email ?? null, fullName: admin.full_name };
});

/** Use at the top of every admin page and admin server action. */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

/** For server actions that should return an error instead of redirecting. */
export async function assertAdmin(): Promise<AdminUser> {
  const admin = await getAdmin();
  if (!admin) throw new Error("UNAUTHORIZED");
  return admin;
}
