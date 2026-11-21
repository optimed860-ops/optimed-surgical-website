import { describe, expect, it } from "vitest";
import { quoteSubmissionSchema, toSubmitPayload } from "@/features/quotations/schemas";
import { QUOTE_LIMITS } from "@/config/limits";

const productA = "3f9a2c1e-8b7d-4e6f-9a1b-2c3d4e5f6a7b";
const productB = "4a0b3d2f-9c8e-4f70-8b2c-3d4e5f6a7b8c";

const valid = {
  submissionKey: "5b1c4e30-ad9f-4081-9c3d-4e5f6a7b8c9d",
  customerName: "  Jane Buyer ",
  companyName: "Acme Medical Distribution",
  businessEmail: " Jane.Buyer@Example.COM ",
  phoneNumber: "+44 20 7946 0000",
  country: "United Kingdom",
  additionalMessage: "",
  items: [
    { productId: productA, quantity: 10 },
    { productId: productB, quantity: "250" },
  ],
  website: "",
  elapsedMs: 8000,
};

describe("quoteSubmissionSchema", () => {
  it("accepts a valid submission and normalises fields", () => {
    const parsed = quoteSubmissionSchema.parse(valid);
    expect(parsed.customerName).toBe("Jane Buyer");
    expect(parsed.businessEmail).toBe("jane.buyer@example.com");
    expect(parsed.additionalMessage).toBeUndefined();
    expect(parsed.items[1].quantity).toBe(250);
  });

  it("requires products or a typed item list", () => {
    expect(quoteSubmissionSchema.safeParse({ ...valid, items: [] }).success).toBe(false);
    expect(quoteSubmissionSchema.safeParse({ ...valid, items: [], requestedItemsText: "   " }).success).toBe(false);
    expect(quoteSubmissionSchema.safeParse({ ...valid, items: [], requestedItemsText: "ABC-123 x 200" }).success).toBe(true);
  });

  it("rejects duplicate products", () => {
    const result = quoteSubmissionSchema.safeParse({
      ...valid,
      items: [
        { productId: productA, quantity: 1 },
        { productId: productA, quantity: 2 },
      ],
    });
    expect(result.success).toBe(false);
  });

  it.each([0, -1, 1.5, QUOTE_LIMITS.maxQuantity + 1, "abc"])("rejects quantity %s", (quantity) => {
    const result = quoteSubmissionSchema.safeParse({
      ...valid,
      items: [{ productId: productA, quantity }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects too many lines", () => {
    const items = Array.from({ length: QUOTE_LIMITS.maxLines + 1 }, (_, i) => ({
      productId: `00000000-0000-4000-8000-${i.toString().padStart(12, "0")}`,
      quantity: 1,
    }));
    expect(quoteSubmissionSchema.safeParse({ ...valid, items }).success).toBe(false);
  });

  it("rejects a non-UUID product id", () => {
    const result = quoteSubmissionSchema.safeParse({
      ...valid,
      items: [{ productId: "1 OR 1=1", quantity: 1 }],
    });
    expect(result.success).toBe(false);
  });

  it.each([
    ["customerName", ""],
    ["companyName", "   "],
    ["businessEmail", "not-an-email"],
    ["phoneNumber", "123"],
    ["phoneNumber", "call me maybe"],
    ["country", ""],
  ])("rejects invalid %s", (field, value) => {
    expect(quoteSubmissionSchema.safeParse({ ...valid, [field]: value }).success).toBe(false);
  });

  it("rejects a filled honeypot", () => {
    expect(quoteSubmissionSchema.safeParse({ ...valid, website: "http://spam" }).success).toBe(false);
  });

  it("ignores any extra fields such as price or product name", () => {
    const parsed = quoteSubmissionSchema.parse({
      ...valid,
      items: [{ productId: productA, quantity: 1, name: "Fake", price: 0 }],
    });
    expect(parsed.items[0]).toEqual({ productId: productA, quantity: 1 });
  });
});

describe("toSubmitPayload", () => {
  it("sends only ids and quantities for items", () => {
    const payload = toSubmitPayload(quoteSubmissionSchema.parse(valid));
    expect(payload.items).toEqual([
      { product_id: productA, quantity: 10 },
      { product_id: productB, quantity: 250 },
    ]);
    expect(payload.additional_message).toBeNull();
    expect(payload).not.toHaveProperty("website");
  });
});
