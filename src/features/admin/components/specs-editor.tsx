"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { adminInput } from "../ui";

type Spec = { label: string; value: string };

/** Editable list of specification rows; submitted as JSON in a hidden field. */
export function SpecsEditor({ name, initial }: { name: string; initial: Spec[] }) {
  const [rows, setRows] = useState<Spec[]>(initial.length ? initial : [{ label: "", value: "" }]);
  const update = (i: number, key: keyof Spec, v: string) => setRows((r) => r.map((row, j) => (j === i ? { ...row, [key]: v } : row)));

  return (
    <div>
      <input type="hidden" name={name} value={JSON.stringify(rows.filter((r) => r.label.trim() && r.value.trim()))} />
      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="grid grid-cols-[1fr_1.5fr_auto] gap-2">
            <input aria-label={`Specification ${i + 1} name`} placeholder="e.g. Length" value={row.label} maxLength={80} onChange={(e) => update(i, "label", e.target.value)} className={`${adminInput} h-10`} />
            <input aria-label={`Specification ${i + 1} value`} placeholder="e.g. 14 cm, 17 cm" value={row.value} maxLength={300} onChange={(e) => update(i, "value", e.target.value)} className={`${adminInput} h-10`} />
            <button type="button" onClick={() => setRows((r) => r.filter((_, j) => j !== i))} className="grid size-10 place-items-center rounded-md text-slate-text hover:bg-red-50 hover:text-red-700" aria-label="Remove specification">
              <Trash2 className="size-4" aria-hidden />
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => setRows((r) => [...r, { label: "", value: "" }])} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-700 hover:underline">
        <Plus className="size-4" aria-hidden /> Add specification
      </button>
    </div>
  );
}
