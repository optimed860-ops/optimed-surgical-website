import { QUOTE_LIMITS } from "@/config/limits";

/**
 * Quote list kept in the visitor's browser (localStorage).
 * Holds product IDs, quantities and display labels only: no prices and no
 * customer details. The server re-reads every product from the database on
 * submit, so nothing here is trusted.
 */
export type BasketItem = {
  productId: string;
  quantity: number;
  name: string;
  slug: string;
  productCode: string | null;
  imagePath: string | null;
};

const STORAGE_KEY = "optimed.quote.v1";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Listener = () => void;
const listeners = new Set<Listener>();
let cache: BasketItem[] | null = null;
const EMPTY: BasketItem[] = [];

export function clampQuantity(value: number): number {
  if (!Number.isFinite(value)) return QUOTE_LIMITS.minQuantity;
  return Math.min(QUOTE_LIMITS.maxQuantity, Math.max(QUOTE_LIMITS.minQuantity, Math.round(value)));
}

function sanitize(raw: unknown): BasketItem[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const items: BasketItem[] = [];
  for (const entry of raw) {
    if (typeof entry !== "object" || entry === null) continue;
    const e = entry as Record<string, unknown>;
    if (typeof e.productId !== "string" || !UUID.test(e.productId) || seen.has(e.productId)) continue;
    seen.add(e.productId);
    items.push({
      productId: e.productId,
      quantity: clampQuantity(Number(e.quantity)),
      name: typeof e.name === "string" ? e.name.slice(0, 200) : "Product",
      slug: typeof e.slug === "string" ? e.slug.slice(0, 120) : "",
      productCode: typeof e.productCode === "string" ? e.productCode.slice(0, 80) : null,
      imagePath: typeof e.imagePath === "string" ? e.imagePath.slice(0, 300) : null,
    });
    if (items.length >= QUOTE_LIMITS.maxLines) break;
  }
  return items;
}

function read(): BasketItem[] {
  if (cache) return cache;
  try {
    cache = sanitize(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]"));
  } catch {
    cache = [];
  }
  return cache;
}

function write(items: BasketItem[]) {
  cache = items;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage unavailable (private mode or full): keep the list in memory.
  }
  listeners.forEach((listener) => listener());
}

export const basketStore = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        cache = null;
        listener();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  },
  getSnapshot: read,
  getServerSnapshot: () => EMPTY,

  /** Adds a product, or increases its quantity if it's already listed. */
  add(item: Omit<BasketItem, "quantity">, quantity: number): "added" | "updated" | "full" {
    const items = read();
    const existing = items.find((i) => i.productId === item.productId);
    if (existing) {
      write(items.map((i) => (i.productId === item.productId ? { ...i, ...item, quantity: clampQuantity(i.quantity + quantity) } : i)));
      return "updated";
    }
    if (items.length >= QUOTE_LIMITS.maxLines) return "full";
    write([...items, { ...item, quantity: clampQuantity(quantity) }]);
    return "added";
  },
  setQuantity(productId: string, quantity: number) {
    write(read().map((i) => (i.productId === productId ? { ...i, quantity: clampQuantity(quantity) } : i)));
  },
  remove(productId: string) {
    write(read().filter((i) => i.productId !== productId));
  },
  /** Replace display details with fresh server data and drop products that are no longer available. */
  reconcile(fresh: { productId: string; name: string; slug: string; productCode: string | null; imagePath: string | null }[]) {
    const byId = new Map(fresh.map((f) => [f.productId, f]));
    write(read().filter((i) => byId.has(i.productId)).map((i) => ({ ...i, ...byId.get(i.productId)! })));
  },
  clear() {
    write([]);
  },
};

export const __testing = { sanitize, STORAGE_KEY };
