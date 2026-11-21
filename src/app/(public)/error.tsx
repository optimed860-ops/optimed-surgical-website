"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PublicError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <section className="flex flex-1 items-center py-section">
      <div className="container-page max-w-2xl text-center">
        <p className="font-mono text-sm text-medical-700">Something went wrong</p>
        <h1 className="mt-4 text-h1">We couldn&apos;t load this page</h1>
        <p className="mt-4 text-lg text-slate-text">Please try again. If the problem continues, come back in a few minutes.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button size="xl" onClick={() => retry()}>
            Try again
          </Button>
          <Button asChild size="xl" variant="outline">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
