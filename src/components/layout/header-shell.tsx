"use client";

import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

function subscribe(callback: () => void) {
  window.addEventListener("scroll", callback, { passive: true });
  return () => window.removeEventListener("scroll", callback);
}

/** Transparent over the hero at the top of the page; white once the page scrolls. */
export function HeaderShell({ children }: { children: React.ReactNode }) {
  const scrolled = useSyncExternalStore(subscribe, () => window.scrollY > 8, () => false);
  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-[background-color,box-shadow] duration-200 will-change-[background-color]",
        scrolled ? "bg-white shadow-[0_1px_0_var(--color-line)]" : "bg-transparent",
      )}
    >
      {children}
    </header>
  );
}
