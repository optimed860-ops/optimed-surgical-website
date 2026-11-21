"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getAdmin } from "@/lib/auth/require-admin";
import { safeAdminNext } from "./safe-next";

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
