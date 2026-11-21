import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Small, safe Markdown subset for blog articles. No HTML is ever injected:
 * text becomes React elements, so admin-written content cannot run scripts.
 *
 *   ## Heading / ### Sub-heading
 *   - bullet / 1. numbered
 *   > quote
 *   **bold**, *italic*, [link text](https://… or /internal-page)
 *   blank line = new paragraph
 */

type Block =
  | { type: "h2" | "h3" | "p" | "quote"; text: string }
  | { type: "ul" | "ol"; items: string[] };

export function slugifyHeading(text: string) {
  return text
    .toLowerCase()
    .replace(/[*_`[\]()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function parseBlocks(source: string): Block[] {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) blocks.push({ type: "p", text: para.join(" ") });
    para = [];
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flush();
      continue;
    }
    const h = line.match(/^(#{2,3})\s+(.*)$/);
    const ul = line.match(/^[-*]\s+(.*)$/);
    const ol = line.match(/^\d+[.)]\s+(.*)$/);
    const q = line.match(/^>\s?(.*)$/);
    if (h) {
      flush();
      blocks.push({ type: h[1].length === 2 ? "h2" : "h3", text: h[2] });
    } else if (ul || ol) {
      flush();
      const type = ul ? "ul" : "ol";
      const last = blocks[blocks.length - 1];
      const item = (ul ?? ol)![1];
      if (last && last.type === type) last.items.push(item);
      else blocks.push({ type, items: [item] });
    } else if (q) {
      flush();
      blocks.push({ type: "quote", text: q[1] });
    } else {
      para.push(line);
    }
  }
  flush();
  return blocks;
}

/** Headings for a table of contents. */
export function extractHeadings(source: string) {
  return parseBlocks(source)
    .filter((b): b is { type: "h2"; text: string } => b.type === "h2")
    .map((b) => ({ id: slugifyHeading(b.text), text: stripInline(b.text) }));
}

export function stripInline(text: string) {
  return text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1");
}

export function readingMinutes(source: string) {
  return Math.max(1, Math.round(source.split(/\s+/).filter(Boolean).length / 220));
}

function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const key = `${keyBase}-${i++}`;
    if (m[1] && m[2]) {
      const href = m[2];
      if (href.startsWith("/")) {
        out.push(
          <Link key={key} href={href} className="font-medium text-cyan-700 underline decoration-cyan-700/40 underline-offset-4 hover:decoration-cyan-700">
            {m[1]}
          </Link>,
        );
      } else if (/^https:\/\//.test(href)) {
        out.push(
          <a key={key} href={href} target="_blank" rel="noopener noreferrer" className="font-medium text-cyan-700 underline decoration-cyan-700/40 underline-offset-4 hover:decoration-cyan-700">
            {m[1]}
          </a>,
        );
      } else {
        out.push(m[1]);
      }
    } else if (m[3]) {
      out.push(
        <strong key={key} className="font-semibold text-ink">
          {m[3]}
        </strong>,
      );
    } else if (m[4]) {
      out.push(<em key={key}>{m[4]}</em>);
    }
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ source }: { source: string }) {
  return (
    <div className="space-y-5 text-[1.0625rem] leading-[1.75] text-ink/90">
      {parseBlocks(source).map((b, i) => {
        const k = `b${i}`;
        switch (b.type) {
          case "h2":
            return (
              <h2 key={k} id={slugifyHeading(b.text)} className="scroll-mt-28 pt-6 text-[1.625rem] leading-tight font-bold tracking-tight text-navy-800">
                {inline(b.text, k)}
              </h2>
            );
          case "h3":
            return (
              <h3 key={k} className="pt-2 text-xl leading-snug font-semibold tracking-normal text-navy-800">
                {inline(b.text, k)}
              </h3>
            );
          case "quote":
            return (
              <blockquote key={k} className="border-l-4 border-cyan-500 bg-steel/60 py-3 pr-4 pl-5 text-navy-800">
                {inline(b.text, k)}
              </blockquote>
            );
          case "ul":
            return (
              <ul key={k} className="list-disc space-y-2 pl-6 marker:text-cyan-600">
                {b.items.map((it, j) => (
                  <li key={j}>{inline(it, `${k}-${j}`)}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={k} className="list-decimal space-y-2 pl-6 marker:font-semibold marker:text-navy-800">
                {b.items.map((it, j) => (
                  <li key={j}>{inline(it, `${k}-${j}`)}</li>
                ))}
              </ol>
            );
          default:
            return <p key={k}>{inline(b.text, k)}</p>;
        }
      })}
    </div>
  );
}
