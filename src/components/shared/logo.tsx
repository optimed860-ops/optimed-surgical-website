import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { SITE } from "@/content/site";

/** Optimed wordmark. `inverse` uses the white version for dark backgrounds. */
export function Logo({ inverse = false, className }: { inverse?: boolean; className?: string }) {
  return (
    <Link href="/" className={cn("inline-flex shrink-0 items-center", className)} aria-label={`${SITE.name}, home`}>
      <Image
        src={inverse ? "/brand/optimed-surgical-logo-white.png" : "/brand/optimed-surgical-logo.png"}
        alt={SITE.legalName}
        width={535}
        height={141}
        sizes="(min-width: 640px) 182px, 152px"
        priority={!inverse}
        className="h-10 w-auto sm:h-12"
      />
    </Link>
  );
}
