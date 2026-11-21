import { describe, expect, it } from "vitest";
import { __testing, clampQuantity } from "@/features/quote/basket-store";
import { QUOTE_LIMITS } from "@/config/limits";

const id = (n: number) => `00000000-0000-4000-8000-${n.toString().padStart(12, "0")}`;

describe("basket sanitize", () => {
  it("drops invalid ids, duplicates and junk, and clamps quantities", () => {
    const items = __testing.sanitize([
      { productId: id(1), quantity: 5, name: "A", slug: "a" },
      { productId: id(1), quantity: 9, name: "dup" },
      { productId: "not-a-uuid", quantity: 1 },
      null,
      "x",
      { productId: id(2), quantity: -4, name: "B", slug: "b", price: 10 },
      { productId: id(3), quantity: 99_999_999 },
    ]);
    expect(items.map((i) => i.productId)).toEqual([id(1), id(2), id(3)]);
    expect(items[0].quantity).toBe(5);
    expect(items[1].quantity).toBe(QUOTE_LIMITS.minQuantity);
    expect(items[2].quantity).toBe(QUOTE_LIMITS.maxQuantity);
    expect(items[1]).not.toHaveProperty("price");
  });

  it("returns an empty list for non-arrays", () => {
    expect(__testing.sanitize({ productId: id(1) })).toEqual([]);
  });

  it("caps the number of lines", () => {
    const raw = Array.from({ length: QUOTE_LIMITS.maxLines + 20 }, (_, i) => ({ productId: id(i + 1), quantity: 1 }));
    expect(__testing.sanitize(raw)).toHaveLength(QUOTE_LIMITS.maxLines);
  });
});

describe("clampQuantity", () => {
  it.each([
    [0, 1],
    [2.6, 3],
    [Number.NaN, 1],
    [5, 5],
  ])("%s → %s", (input, expected) => {
    expect(clampQuantity(input)).toBe(expected);
  });
});
