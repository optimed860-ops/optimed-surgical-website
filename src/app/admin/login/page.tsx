import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/features/auth/components/login-form";
import { safeAdminNext } from "@/features/auth/safe-next";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

const configured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);

export default function AdminLoginPage({ searchParams }: PageProps<"/admin/login">) {
  return (
    <main className="grid min-h-dvh lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <section
        aria-hidden
        className="relative hidden flex-col justify-between bg-navy-950 p-12 text-[#dbe3ee] lg:flex"
      >
        <p className="text-sm font-semibold text-cyan-300">Administration</p>
        <div className="space-y-4">
          <p className="font-heading text-h2 text-white">Catalogue, quotations and orders, in one place.</p>
          <p className="max-w-sm text-sm leading-relaxed text-[#9fb0c6]">
            Restricted area for authorised company staff.
          </p>
        </div>
        <div className="h-px w-16 bg-medical-500" />
      </section>

      <section className="flex items-center justify-center px-4 py-16 sm:px-8">
        <div className="w-full max-w-sm">
          <h1 className="text-h1">Sign in</h1>
          <p className="mt-2 mb-8 text-sm text-muted-foreground">Admin access only.</p>

          {configured ? (
            <Suspense fallback={<LoginForm />}>
              <LoginFormWithNext searchParams={searchParams} />
            </Suspense>
          ) : (
            <div role="status" className="rounded-md border border-line bg-surface p-4 text-sm leading-relaxed">
              <p className="font-semibold text-navy-900">Supabase is not connected yet.</p>
              <p className="mt-1 text-muted-foreground">
                Add <code className="ref-code">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
                <code className="ref-code">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> to{" "}
                <code className="ref-code">.env.local</code>, then restart the dev server.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

async function LoginFormWithNext({ searchParams }: { searchParams: PageProps<"/admin/login">["searchParams"] }) {
  const { next } = await searchParams;
  const raw = Array.isArray(next) ? next[0] : next;
  return <LoginForm next={raw ? safeAdminNext(raw) : undefined} />;
}
