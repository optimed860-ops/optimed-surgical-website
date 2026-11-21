import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="flex flex-1 items-center py-section">
      <div className="container-page max-w-2xl text-center">
        <p className="text-sm font-semibold text-cyan-700">Page not found</p>
        <h1 className="mt-4 text-h1">This page isn&apos;t available</h1>
        <p className="mt-4 text-lg text-slate-text">
          The product or page may have been moved or is no longer listed. Try the catalogue or send us your requirements.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="xl">
            <Link href="/products">
              Browse products
            </Link>
          </Button>
          <Button asChild size="xl" variant="outline">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
