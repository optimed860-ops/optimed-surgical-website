import type { Metadata } from "next";
import { Suspense } from "react";
import { LogOut } from "lucide-react";
import { requireAdmin } from "@/lib/auth/require-admin";
import { signOut } from "@/features/auth/actions";
import { AdminNav } from "@/features/admin/components/admin-nav";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

export default function ProtectedAdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="min-h-dvh bg-surface lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="min-w-0 bg-sidebar text-sidebar-foreground lg:sticky lg:top-0 lg:h-dvh">
        <div className="flex h-full min-w-0 flex-col gap-3 px-4 py-3 lg:gap-4 lg:py-6">
          <div className="flex items-center justify-between">
            <p className="px-3 text-sm font-semibold text-cyan-300">Admin</p>
            <div className="lg:hidden">
              <Suspense fallback={null}>
                <MobileSignOut />
              </Suspense>
            </div>
          </div>
          <div className="hidden lg:block">
            <Suspense fallback={<div className="h-80" />}>
              <AdminNav orientation="vertical" />
            </Suspense>
          </div>
          <div className="min-w-0 lg:hidden">
            <Suspense fallback={<div className="h-10" />}>
              <AdminNav orientation="horizontal" />
            </Suspense>
          </div>
          <div className="mt-auto hidden border-t border-sidebar-border pt-4 lg:block">
            <Suspense fallback={null}>
              <AdminIdentity />
            </Suspense>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        {/* Every admin page waits for the server-side admin check before rendering. */}
        <Suspense fallback={<AdminPageSkeleton />}>
          <AdminGate>{children}</AdminGate>
        </Suspense>
      </div>
    </div>
  );
}

async function AdminGate({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-10 lg:py-10 [&_.grid>*]:min-w-0">{children}</main>;
}

async function AdminIdentity() {
  const admin = await requireAdmin();
  return (
    <div className="space-y-3 px-3">
      <p className="truncate text-xs text-sidebar-foreground/70" title={admin.email ?? undefined}>
        {admin.fullName ?? admin.email}
      </p>
      <form action={signOut}>
        <button
          type="submit"
          className="flex items-center gap-2 text-sm font-medium text-sidebar-foreground hover:text-white"
        >
          <LogOut className="size-4" aria-hidden />
          Sign out
        </button>
      </form>
    </div>
  );
}

async function MobileSignOut() {
  await requireAdmin();
  return (
    <form action={signOut}>
      <button type="submit" className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-sidebar-foreground hover:text-white">
        <LogOut className="size-3.5" aria-hidden />
        Sign out
      </button>
    </form>
  );
}

function AdminPageSkeleton() {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-10 lg:py-10" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="h-8 w-48 animate-pulse rounded bg-line" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-md bg-white" />
        ))}
      </div>
    </div>
  );
}
