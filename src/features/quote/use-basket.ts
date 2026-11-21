"use client";

import { useSyncExternalStore } from "react";
import { basketStore } from "./basket-store";

/** Current quote list. Empty during server render; fills in after hydration. */
export function useBasket() {
  return useSyncExternalStore(basketStore.subscribe, basketStore.getSnapshot, basketStore.getServerSnapshot);
}

const subscribeNoop = () => () => {};
/** False on the server and during hydration, true afterwards. */
export function useHydrated() {
  return useSyncExternalStore(subscribeNoop, () => true, () => false);
}
