import { describe, expect, it } from "vitest";
import { DEFAULT_CONTENT, mergeContent } from "@/content/editable";

describe("mergeContent", () => {
  it("returns defaults for empty or junk input", () => {
    expect(mergeContent(null)).toEqual(DEFAULT_CONTENT);
    expect(mergeContent("nonsense")).toEqual(DEFAULT_CONTENT);
    expect(mergeContent({ hero: 42 })).toEqual(DEFAULT_CONTENT);
  });

  it("applies valid text overrides and ignores unknown keys", () => {
    const merged = mergeContent({ hero: { titleLine1: "New title", hack: "<script>" }, unknown: { x: 1 } });
    expect(merged.hero.titleLine1).toBe("New title");
    expect(merged.hero.titleLine2).toBe(DEFAULT_CONTENT.hero.titleLine2);
    expect(merged.hero).not.toHaveProperty("hack");
    expect(merged).not.toHaveProperty("unknown");
  });

  it("treats empty object text as 'use default'", () => {
    expect(mergeContent({ hero: { lead: "   " } }).hero.lead).toBe(DEFAULT_CONTENT.hero.lead);
  });

  it("replaces lists, drops empty items, and falls back when the list is empty", () => {
    const merged = mergeContent({
      faq: [
        { q: "New question?", a: "Answer." },
        { q: "", a: "" },
        { q: "Only question", a: "" },
      ],
    });
    expect(merged.faq).toEqual([
      { q: "New question?", a: "Answer." },
      { q: "Only question", a: "" },
    ]);
    expect(mergeContent({ faq: [] }).faq).toEqual(DEFAULT_CONTENT.faq);
  });

  it("handles string lists and nullable fields", () => {
    const merged = mergeContent({
      whatWeMake: { disciplines: ["A", "", 5, "B"] },
      certificates: { items: [{ mark: "ISO 13485", name: "ISO 13485", short: "", detail: "QMS", number: "CERT-1" }] },
    });
    expect(merged.whatWeMake.disciplines).toEqual(["A", "B"]);
    expect(merged.certificates.items[0].number).toBe("CERT-1");
  });
});
