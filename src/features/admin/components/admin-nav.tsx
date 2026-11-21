"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ADMIN_NAV } from "../nav";

export function AdminNav({ orientation }: { orientation: "vertical" | "horizontal" }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin">
      <ul
        className={cn(
          orientation === "vertical"
            ? "flex flex-col gap-0.5"
            : "-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 [scrollbar-width:none]",
        )}
      >
        {ADMIN_NAV.map(({ href, label, icon: Icon, ready }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          const base =
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors";

          if (!ready) {
            return (
              <li key={href}>
                <span
                  aria-disabled="true"
                  title="Built in a later stage"
                  className={cn(base, "cursor-not-allowed text-sidebar-foreground/40")}
                >
                  <Icon className="size-4" aria-hidden />
                  {label}
                </span>
              </li>
            );
          }

          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  base,
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-white",
                )}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
