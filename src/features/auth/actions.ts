"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getAdmin } from "@/lib/auth/require-admin";
import { safeAdminNext } from "./safe-next";
import { createSecretClient } from "@/lib/supabase/admin";
import { serverEnv } from "@/config/server-env";
import { clientIpFrom, hashVisitorKey } from "@/lib/security/visitor-key";

/** Max 10 sign-in attempts per visitor per 15 minutes (SQL file 14). Fails open if the check is not installed yet. */
async function loginAllowed(): Promise<boolean> {
  try {
    const env = serverEnv();
    const key = hashVisitorKey(clientIpFrom(await headers()), env.RATE_LIMIT_HMAC_SECRET, "login");
    const { data, error } = await createSecretClient().rpc("check_login_rate_limit", { p_key_hash: key });
    if (error) {
      console.error("[auth] login rate limit unavailable (run SQL file 14):", error.code);
      return true;
    }
    return data !== false;
  } catch (error) {
    console.error("[auth] login rate limit check failed:", (error as Error).message);
    return true;
  }
}

export type SignInState = { error?: string; email?: string };

const signInSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1).max(200),
  next: z.string().optional(),
});

// One generic message: never reveal whether an email exists or is an admin.
const INVALID = "Incorrect email or password.";

export async function signIn(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });
  const email = typeof formData.get("email") === "string" ? String(formData.get("email")) : "";
  if (!parsed.success) return { error: INVALID, email };
  if (!(await loginAllowed())) {
    return { error: "Too many sign-in attempts. Please wait 15 minutes and try again.", email };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) {
    const unconfirmed = /confirm/i.test(error.message);
    return {
      error: unconfirmed
        ? "This email address is not confirmed. In Supabase → Authentication → Users, open the user and confirm it (or recreate it with Auto Confirm)."
        : INVALID,
      email,
    };
  }

  // Signed in, but is this account on the admin allowlist?
  const admin = await getAdmin();
  if (!admin) {
    // The password was correct, so it is safe to say why access is refused.
    await supabase.auth.signOut();
    return {
      error:
        "This account exists but is not an admin yet. In Supabase, run the admin SQL from the setup guide (insert into public.admins …), then sign in again.",
      email,
    };
  }

  redirect(safeAdminNext(parsed.data.next));
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
