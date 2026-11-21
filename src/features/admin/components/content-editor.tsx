"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Loader2, Plus, RotateCcw, Trash2 } from "lucide-react";
import { blankOf } from "@/content/editable";
import { saveContentSection, resetContentSection } from "../actions/site";
import { adminInput, primaryButton, secondaryButton } from "../ui";

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

/** Keys that hold icon names or logo marks: kept as they are, not shown. */
const HIDDEN_KEYS = new Set(["icon", "mark", "href", "slug", "key", "id"]);
/** Keys that usually hold longer text: shown as a multi-line box. */
const LONG_KEYS = /^(body|text|description|answer|intro|lead|subtitle|paragraphs?|summary|content|note|story|mission|vision)$/i;

function humanize(key: string) {
  const words = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function setAt(root: Json, path: (string | number)[], value: Json): Json {
  if (path.length === 0) return value;
  const [head, ...rest] = path;
  if (Array.isArray(root)) {
    const copy = [...root];
    copy[head as number] = setAt(copy[head as number], rest, value);
    return copy;
  }
  const obj = (root ?? {}) as Record<string, Json>;
  return { ...obj, [head]: setAt(obj[head as string], rest, value) };
}

export function ContentEditor({ section, initial, template }: { section: string; initial: Json; template: Json }) {
  const router = useRouter();
  const [value, setValue] = useState<Json>(initial);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  const change = (path: (string | number)[], v: Json) => {
    setValue((root) => setAt(root, path, v));
    setDirty(true);
    setMessage(null);
  };

  const save = () =>
    start(async () => {
      const r = await saveContentSection(section, value);
      setMessage({ ok: r.ok, text: r.message });
      if (r.ok) {
        setDirty(false);
        router.refresh();
      }
    });

  const reset = () => {
    if (!window.confirm("Bring back the original text for this section? Your changes to it will be removed.")) return;
    start(async () => {
      const r = await resetContentSection(section);
      setMessage({ ok: r.ok, text: r.message });
      if (r.ok) {
        setDirty(false);
        router.refresh();
        window.location.reload();
      }
    });
  };

  return (
    <div>
      <Field path={[]} value={value} template={template} onChange={change} />
      <div className="sticky bottom-0 -mx-5 mt-6 flex flex-wrap items-center gap-3 border-t border-line bg-white/95 px-5 py-4 sm:-mx-6 sm:px-6">
        <button type="button" onClick={save} disabled={pending || !dirty} className={primaryButton}>
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Save section
        </button>
        <button type="button" onClick={reset} disabled={pending} className={secondaryButton}>
          <RotateCcw className="size-4" aria-hidden /> Restore original
        </button>
        <p role="status" className={message ? (message.ok ? "text-sm text-emerald-700" : "text-sm text-red-700") : "text-sm text-slate-text"}>
          {message?.text ?? (dirty ? "You have unsaved changes." : "")}
        </p>
      </div>
    </div>
  );
}

function Field({
  path,
  label,
  value,
  template,
  onChange,
}: {
  path: (string | number)[];
  label?: string;
  value: Json;
  template: Json;
  onChange: (path: (string | number)[], v: Json) => void;
}) {
  const key = String(path[path.length - 1] ?? "");

  if (typeof template === "string" || template === null) {
    const text = typeof value === "string" ? value : "";
    const long = LONG_KEYS.test(key) || (typeof template === "string" && template.length > 90) || text.length > 90 || text.includes("\n");
    return (
      <label className="block">
        {label ? <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span> : null}
        {long ? (
          <textarea value={text} onChange={(e) => onChange(path, e.target.value)} rows={Math.min(10, Math.max(3, Math.ceil(text.length / 90)))} maxLength={8000} className={`${adminInput} py-2 leading-relaxed`} />
        ) : (
          <input value={text} onChange={(e) => onChange(path, e.target.value)} maxLength={template === null ? 200 : 8000} className={`${adminInput} h-10`} />
        )}
      </label>
    );
  }

  if (typeof template === "number" || typeof template === "boolean") return null;

  if (Array.isArray(template)) {
    const items = Array.isArray(value) ? value : [];
    const itemTemplate = (template[0] ?? "") as Json;
    const move = (from: number, to: number) => {
      const copy = [...items];
      const [x] = copy.splice(from, 1);
      copy.splice(to, 0, x);
      onChange(path, copy);
    };
    return (
      <fieldset className="rounded-lg border border-line p-4">
        {label ? <legend className="px-1.5 text-sm font-semibold text-ink">{label} ({items.length})</legend> : null}
        <ol className="space-y-3">
          {items.map((item, i) => (
            <li key={i} className="rounded-md bg-steel/50 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-text">Item {i + 1}</span>
                <span className="flex gap-1">
                  <IconButton label="Move up" disabled={i === 0} onClick={() => move(i, i - 1)}><ArrowUp className="size-3.5" /></IconButton>
                  <IconButton label="Move down" disabled={i === items.length - 1} onClick={() => move(i, i + 1)}><ArrowDown className="size-3.5" /></IconButton>
                  <IconButton label="Remove" danger disabled={items.length <= 1} onClick={() => onChange(path, items.filter((_, j) => j !== i))}><Trash2 className="size-3.5" /></IconButton>
                </span>
              </div>
              <Field path={[...path, i]} value={item} template={itemTemplate} onChange={onChange} />
            </li>
          ))}
        </ol>
        <button
          type="button"
          onClick={() => onChange(path, [...items, blankOf(itemTemplate)])}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-800 hover:underline"
        >
          <Plus className="size-4" aria-hidden /> Add item
        </button>
      </fieldset>
    );
  }

  const obj = (value && typeof value === "object" && !Array.isArray(value) ? value : {}) as Record<string, Json>;
  const entries = Object.entries(template as Record<string, Json>).filter(([k, t]) => !HIDDEN_KEYS.has(k) && typeof t !== "number" && typeof t !== "boolean");
  const body = (
    <div className="space-y-4">
      {entries.map(([k, t]) => (
        <Field key={k} path={[...path, k]} label={humanize(k)} value={obj[k] ?? null} template={t} onChange={onChange} />
      ))}
    </div>
  );
  if (!label) return body;
  return (
    <fieldset className="rounded-lg border border-line p-4">
      <legend className="px-1.5 text-sm font-semibold text-ink">{label}</legend>
      {body}
    </fieldset>
  );
}

function IconButton({ children, label, onClick, disabled, danger }: { children: React.ReactNode; label: string; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`grid size-7 place-items-center rounded border border-line bg-white disabled:opacity-40 ${danger ? "text-red-700 hover:bg-red-50" : "text-navy-800 hover:bg-steel"}`}
    >
      {children}
    </button>
  );
}
