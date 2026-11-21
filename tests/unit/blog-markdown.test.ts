import { describe, expect, it } from "vitest";
import { extractHeadings, parseBlocks, readingMinutes, slugifyHeading } from "@/features/blog/markdown";

describe("blog markdown", () => {
  it("parses headings, lists, quotes and paragraphs", () => {
    const blocks = parseBlocks("## Title\n\nLine one\nline two\n\n- a\n- b\n\n1. x\n2. y\n\n> quote\n\n### Sub");
    expect(blocks.map((b) => b.type)).toEqual(["h2", "p", "ul", "ol", "quote", "h3"]);
    expect(blocks[1]).toEqual({ type: "p", text: "Line one line two" });
    expect(blocks[2]).toEqual({ type: "ul", items: ["a", "b"] });
  });

  it("builds a table of contents from ## headings only", () => {
    expect(extractHeadings("## What are **Mayo** scissors?\n\n### Not this\n\n## Ordering tips")).toEqual([
      { id: "what-are-mayo-scissors", text: "What are Mayo scissors?" },
      { id: "ordering-tips", text: "Ordering tips" },
    ]);
    expect(slugifyHeading("Mayo vs Metzenbaum: at a glance")).toBe("mayo-vs-metzenbaum-at-a-glance");
  });

  it("estimates reading time", () => {
    expect(readingMinutes("word ".repeat(1100))).toBe(5);
    expect(readingMinutes("short")).toBe(1);
  });
});
