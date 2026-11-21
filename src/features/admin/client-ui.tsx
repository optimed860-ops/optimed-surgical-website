"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActionResult } from "./result";

/** Form bound to a server action with a status line (saved / error). */
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess,
}: {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  children: React.ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction] = useActionState(action, { ok: true, message: "" });
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok && state.message && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <form ref={ref} action={formAction} className={className}>
      {children}
      {state.message ? (
        <p
          role={state.ok ? "status" : "alert"}
          className={cn("mt-4 flex items-start gap-2 text-sm", state.ok ? "text-emerald-700" : "text-red-700")}
        >
          {state.ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden /> : <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />}
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

/** Submit button that shows a spinner while the action runs; optional confirmation. */
export function SubmitButton({
  children,
  className,
  confirm,
  name,
  value,
}: {
  children: React.ReactNode;
  className?: string;
  confirm?: string;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      className={className}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
}
