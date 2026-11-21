"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { FIELD_LIMITS } from "@/config/limits";
import { submitInquiry } from "@/features/quotations/actions";
import { CONTACT_SUBJECTS } from "./subjects";

type Errors = Partial<Record<string, string>>;

const input =
  "w-full rounded-md border border-[#cdd5df] bg-white px-3.5 text-[0.9375rem] text-ink outline-none transition-shadow placeholder:text-slate-text/60 focus-visible:border-navy-800 focus-visible:ring-2 focus-visible:ring-navy-800/15";
const invalid = "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/15";


/** Simple contact form for any question. Saved as a message for the admin panel. */
export function ContactForm({ defaultSubject }: { defaultSubject?: string }) {
  const [errors, setErrors] = useState<Errors>({});
  const [done, setDone] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const mountedAt = useRef(0);
  const submissionKey = useRef<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    mountedAt.current = Date.now();
  }, []);

  if (done) {
    return (
      <div role="status" className="py-4">
        <CheckCircle2 className="size-10 text-cyan-700" strokeWidth={1.5} aria-hidden />
        <h2 className="mt-5 text-h3">Message sent</h2>
        <p className="mt-3 leading-relaxed text-slate-text">
          Thank you. Our team will reply to you by email. Your reference is{" "}
          <span className="ref-code text-base font-medium text-navy-800">{done}</span>.
        </p>
      </div>
    );
  }

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const get = (k: string) => String(form.get(k) ?? "").trim();

    const next: Errors = {};
    if (!get("customerName")) next.customerName = "Your name is required";
    if (!get("email")) next.email = "Email is required";
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(get("email"))) next.email = "Enter a valid email address";
    if (!get("message")) next.message = "Write your message";
    if (Object.keys(next).length > 0) {
      setErrors(next);
      formRef.current?.querySelector<HTMLElement>(`[name="${Object.keys(next)[0]}"]`)?.focus();
      return;
    }

    submissionKey.current ??= crypto.randomUUID();
    startTransition(async () => {
      setErrors({});
      const result = await submitInquiry({
        inquiryType: "contact",
        customerName: get("customerName"),
        companyName: get("companyName"),
        email: get("email"),
        phoneNumber: get("phoneNumber"),
        message: `Subject: ${get("subject") || CONTACT_SUBJECTS[0]}\n\n${get("message")}`,
        submissionKey: submissionKey.current,
        website: get("website"),
        elapsedMs: Date.now() - mountedAt.current,
      });
      if (result.ok) {
        submissionKey.current = null;
        setDone(result.reference);
        return;
      }
      setErrors({ form: result.error, ...(result.fieldErrors ?? {}) });
    });
  };

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
      <Field label="Your name" name="customerName" required error={errors.customerName}>
        <input id="customerName" name="customerName" autoComplete="name" maxLength={FIELD_LIMITS.customerName} aria-invalid={!!errors.customerName || undefined} className={cn(input, "h-11", errors.customerName && invalid)} />
      </Field>
      <Field label="Company" name="companyName" error={errors.companyName}>
        <input id="companyName" name="companyName" autoComplete="organization" maxLength={FIELD_LIMITS.companyName} className={cn(input, "h-11")} />
      </Field>
      <Field label="Email" name="email" required error={errors.email}>
        <input id="email" name="email" type="email" autoComplete="email" maxLength={FIELD_LIMITS.email} aria-invalid={!!errors.email || undefined} className={cn(input, "h-11", errors.email && invalid)} />
      </Field>
      <Field label="Phone / WhatsApp" name="phoneNumber" error={errors.phoneNumber}>
        <input id="phoneNumber" name="phoneNumber" type="tel" autoComplete="tel" maxLength={FIELD_LIMITS.phoneMax} aria-invalid={!!errors.phoneNumber || undefined} className={cn(input, "h-11", errors.phoneNumber && invalid)} />
      </Field>
      <Field label="Subject" name="subject" className="sm:col-span-2">
        <select id="subject" name="subject" defaultValue={defaultSubject ?? CONTACT_SUBJECTS[0]} className={cn(input, "h-11")}>
          {CONTACT_SUBJECTS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </Field>
      <Field label="Message" name="message" required error={errors.message} className="sm:col-span-2">
        <textarea id="message" name="message" rows={6} maxLength={FIELD_LIMITS.message - 200} aria-invalid={!!errors.message || undefined} className={cn(input, "resize-y py-3", errors.message && invalid)} />
      </Field>

      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="website-contact">Website</label>
        <input id="website-contact" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {errors.form ? (
        <p role="alert" className="flex items-start gap-2 rounded-md border border-destructive/30 bg-red-50 p-3 text-sm text-destructive sm:col-span-2">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {errors.form}
        </p>
      ) : null}

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-12 items-center gap-2 rounded-md bg-navy-800 px-7 text-[0.9375rem] font-semibold text-white transition-colors hover:bg-navy-950 disabled:opacity-60"
        >
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          {pending ? "Sending…" : "Send message"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  required,
  error,
  className,
  children,
}: {
  label: string;
  name: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={name} className="mb-1.5 block text-sm font-semibold text-ink">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </label>
      {children}
      {error ? <p className="mt-1.5 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
