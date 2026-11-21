"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

/**
 * Current year, computed in the browser. Keeps the footer fully static
 * (reading the clock during prerender isn't allowed with Cache Components).
 */
export function CopyrightYear() {
  const year = useSyncExternalStore(noop, () => new Date().getFullYear(), () => null);
  return <>{year ?? ""}</>;
}
