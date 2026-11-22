"use client";

import { useState } from "react";
import { Check, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/shared/toaster";
import { cn } from "@/lib/utils";
import { QUOTE_LIMITS } from "@/config/limits";
import { basketStore, clampQuantity } from "../basket-store";
import { useBasket } from "../use-basket";

export type QuoteProduct = {
  id: string;
  name: string;
  slug: string;
  productCode: string | null;
  imagePath: string | null;
};

function addProduct(product: QuoteProduct, quantity: number) {
  const result = basketStore.add(
    {
      productId: product.id,
      name: product.name,
      slug: product.slug,
      productCode: product.productCode,
      imagePath: product.imagePath,
    },
    quantity,
  );
  if (result === "full") {
    toast(`Your quote list can hold up to ${QUOTE_LIMITS.maxLines} products.`, { tone: "info" });
    return;
  }
  toast(result === "added" ? `${product.name} added to your quote.` : `Quantity updated for ${product.name}.`, {
    action: { href: "/quote", label: "View quote" },
  });
}

/** Compact button used on product cards. */
export function AddToQuoteButton({ product, className }: { product: QuoteProduct; className?: string }) {
  const items = useBasket();
  const inQuote = items.some((item) => item.productId === product.id);

  return (
    <Button
      type="button"
      size="lg"
      variant={inQuote ? "outline" : "default"}
      className={cn("w-full", className)}
      onClick={() => addProduct(product, 1)}
      aria-label={inQuote ? `Add one more ${product.name} to quote` : `Add ${product.name} to quote`}
    >
      {inQuote ? <Check className="text-medical-600" aria-hidden /> : <Plus aria-hidden />}
      {inQuote ? "In your quote" : "Add to quote"}
    </Button>
  );
}

/** Quantity stepper + button used on the product detail page. */
export function AddToQuoteWithQuantity({ product }: { product: QuoteProduct }) {
  const [quantity, setQuantity] = useState(1);
  const items = useBasket();
  const inQuote = items.find((item) => item.productId === product.id);

  return (
    <div className="space-y-3">
      {/* Quantity and button side by side on every screen; the button fills the rest of the row. */}
      <div className="flex items-stretch gap-3">
        <QuantityInput value={quantity} onChange={setQuantity} label={`Quantity for ${product.name}`} />
        <Button type="button" size="xl" className="h-12 min-w-0 flex-1 text-base" onClick={() => addProduct(product, quantity)}>
          <Plus aria-hidden />
          Add to quote
        </Button>
      </div>
      {inQuote ? (
        <p className="flex items-center gap-2 text-sm text-slate-text">
          <Check className="size-4 text-medical-600" aria-hidden />
          {inQuote.quantity.toLocaleString("en")} already in your quote.
        </p>
      ) : null}
    </div>
  );
}

export function QuantityInput({
  value,
  onChange,
  label,
  size = "lg",
}: {
  value: number;
  onChange: (value: number) => void;
  label: string;
  size?: "md" | "lg";
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const height = size === "lg" ? "h-12" : "h-10";

  const commit = (raw: string) => {
    setDraft(null);
    const parsed = Number.parseInt(raw, 10);
    onChange(clampQuantity(Number.isNaN(parsed) ? value : parsed));
  };

  return (
    <div className={cn("inline-flex items-stretch rounded-md border border-input bg-white", height)} role="group" aria-label={label}>
      <button
        type="button"
        className="grid w-10 place-items-center text-navy-800 hover:bg-surface disabled:opacity-40"
        onClick={() => onChange(clampQuantity(value - 1))}
        disabled={value <= QUOTE_LIMITS.minQuantity}
        aria-label="Decrease quantity"
      >
        <Minus className="size-4" aria-hidden />
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={draft ?? String(value)}
        onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, "").slice(0, 7))}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit((e.target as HTMLInputElement).value);
          }
        }}
        aria-label="Quantity"
        className="w-16 border-x border-input text-center font-mono text-sm tabular-nums text-ink outline-none focus-visible:bg-medical-50"
      />
      <button
        type="button"
        className="grid w-10 place-items-center text-navy-800 hover:bg-surface disabled:opacity-40"
        onClick={() => onChange(clampQuantity(value + 1))}
        disabled={value >= QUOTE_LIMITS.maxQuantity}
        aria-label="Increase quantity"
      >
        <Plus className="size-4" aria-hidden />
      </button>
    </div>
  );
}
