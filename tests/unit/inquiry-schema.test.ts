import { describe, expect, it } from "vitest";
import { inquirySubmissionSchema, toInquiryPayload } from "@/features/quotations/schemas";

const base = {
  submissionKey: "5b1c4e30-ad9f-4081-9c3d-4e5f6a7b8c9d",
  customerName: "Sam Buyer",
  email: " Sam@Example.com ",
  elapsedMs: 9000,
};

describe("inquirySubmissionSchema", () => {
  it("accepts a catalogue request with a country", () => {
    const parsed = inquirySubmissionSchema.parse({ ...base, inquiryType: "catalogue", country: "Germany", companyName: "" });
    expect(parsed.email).toBe("sam@example.com");
    expect(toInquiryPayload(parsed).company_name).toBeNull();
  });

  it("requires a country for catalogue requests", () => {
    expect(inquirySubmissionSchema.safeParse({ ...base, inquiryType: "catalogue" }).success).toBe(false);
  });

  it("requires a message or a product list for contact enquiries", () => {
    expect(inquirySubmissionSchema.safeParse({ ...base, inquiryType: "contact" }).success).toBe(false);
    expect(inquirySubmissionSchema.safeParse({ ...base, inquiryType: "contact", message: "Hello" }).success).toBe(true);
    expect(inquirySubmissionSchema.safeParse({ ...base, inquiryType: "contact", requestedItemsText: "ABC x 10" }).success).toBe(true);
  });

  it("rejects unknown types, bad emails and a filled honeypot", () => {
    expect(inquirySubmissionSchema.safeParse({ ...base, inquiryType: "order", message: "x" }).success).toBe(false);
    expect(inquirySubmissionSchema.safeParse({ ...base, inquiryType: "contact", message: "x", email: "nope" }).success).toBe(false);
    expect(inquirySubmissionSchema.safeParse({ ...base, inquiryType: "contact", message: "x", website: "spam" }).success).toBe(false);
  });
});
