"use client";

import { useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { CheckCircle2, Info, X } from "lucide-react";

type Toast = { id: number; message: string; tone: "success" | "info"; action?: { href: string; label: string } };

let toasts: Toast[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function toast(message: string, options: { tone?: Toast["tone"]; action?: Toast["action"] } = {}) {
  const item: Toast = { id: nextId++, message, tone: options.tone ?? "success", action: options.action };
  toasts = [...toasts.slice(-2), item];
  emit();
}

function dismiss(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

const EMPTY: Toast[] = [];

export function Toaster() {
  const items = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => toasts,
    () => EMPTY,
  );

  return (
    <div
      aria-live="polite"
      role="status"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6"
    >
      {items.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}

function ToastItem({ toast: t }: { toast: Toast }) {
  useEffect(() => {
    const timer = window.setTimeout(() => dismiss(t.id), 4500);
    return () => window.clearTimeout(timer);
  }, [t.id]);

  const Icon = t.tone === "success" ? CheckCircle2 : Info;
  return (
    <div className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-md border border-navy-700 bg-navy-900 p-4 text-sm text-white shadow-[0_12px_32px_-12px_rgb(15_18_56/0.55)] animate-in fade-in slide-in-from-bottom-2">
      <Icon className="mt-0.5 size-4 shrink-0 text-medical-300" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="leading-snug">{t.message}</p>
        {t.action ? (
          <Link
            href={t.action.href}
            onClick={() => dismiss(t.id)}
            className="mt-1.5 inline-block font-semibold text-medical-300 underline-offset-4 hover:underline"
          >
            {t.action.label} →
          </Link>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => dismiss(t.id)}
        className="-m-1 rounded p-1 text-white/60 hover:text-white"
        aria-label="Dismiss notification"
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}
