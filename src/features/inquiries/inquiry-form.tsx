"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FIELD_LIMITS } from "@/config/limits";
import { submitInquiry } from "@/features/quotations/actions";
import { countryNames } from "@/features/quotations/countries";
import { useHydrated } from "@/features/quote/use-basket";

type Props = {
  type: "catalogue" | "contact";
  defaultMessage?: string;
  /** Pre-selected "What do you need?" option. */
  defaultInterest?: string;
};

type Errors = Partial<Record<string, string>>;

export function InquiryForm({ type, defaultMessage, defaultInterest }: Props) {
  const hydrated = useHydrated();
  // Country names come from the browser's Intl data; render them after hydration
  // so server and client markup always match.
  const countries = useMemo(() => (hydrated ? countryNames() : []), [hydrated]);
  const [errors, setErrors] = useState<Errors>({});
  const [done, setDone] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const mountedAt = useRef(0);
  const submissionKey = useRef<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const isCatalogue = type === "catalogue";

  useEffect(() => {
    mountedAt.current = Date.now();
  }, []);

  if (done) {
    return (
      <div role="status" className="rounded-lg border border-line bg-white p-8 sm:p-10">
        <CheckCircle2 className="size-10 text-cyan-700" strokeWidth={1.5} aria-hidden />
        <h2 className="mt-5 text-h3">{isCatalogue ? "Catalogue request received" : "Message received"}</h2>
        <p className="mt-3 leading-relaxed text-slate-text">
          {isCatalogue
            ? "Our team will send you the catalogue for the products you selected."
            : "Our team will reply to you as soon as possible."}{" "}
          Your reference is <span className="ref-code text-base font-medium text-navy-800">{done}</span>.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/products">Browse products</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/quote">Request a quote</Link>
          </Button>
        </div>
      </div>
    );
  }

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const get = (key: string) => String(form.get(key) ?? "");
    submissionKey.current ??= crypto.randomUUID();

    startTransition(async () => {
      setErrors({});
      const result = await submitInquiry({
        inquiryType: type,
        customerName: get("customerName"),
        companyName: get("companyName"),
        email: get("email"),
        phoneNumber: get("phoneNumber"),
        country: get("country"),
        productInterest: get("productInterest"),
        requestedItemsText: get("requestedItemsText"),
        message: get("message"),
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
      const first = Object.keys(result.fieldErrors ?? {})[0];
      if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
    });
  };

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="grid gap-5 sm:grid-cols-2">
      <TextField name="customerName" label="Your name" autoComplete="name" required maxLength={FIELD_LIMITS.customerName} error={errors.customerName} />
      <TextField name="companyName" label="Company" autoComplete="organization" optional maxLength={FIELD_LIMITS.companyName} error={errors.companyName} />
      <TextField name="email" label="Email" type="email" autoComplete="email" required maxLength={FIELD_LIMITS.email} error={errors.email} />
      <TextField name="phoneNumber" label="Phone or WhatsApp" type="tel" autoComplete="tel" optional maxLength={FIELD_LIMITS.phoneMax} error={errors.phoneNumber} />

      <Field label="Country" htmlFor="country" required={isCatalogue} optional={!isCatalogue} error={errors.country}>
        <select id="country" name="country" defaultValue="" autoComplete="country-name" aria-invalid={errors.country ? true : undefined} className={inputClass(Boolean(errors.country))}>
          <option value="">Select country</option>
          {countries.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </Field>

      {isCatalogue ? (
        <Field label="What do you need?" htmlFor="productInterest" error={errors.productInterest}>
          <input
            id="productInterest"
            name="productInterest"
            type="text"
            maxLength={160}
            defaultValue={defaultInterest?.slice(0, 160)}
            placeholder="e.g. Full catalogue, ENT instruments, dental forceps"
            aria-invalid={errors.productInterest ? true : undefined}
            className={inputClass(Boolean(errors.productInterest))}
          />
        </Field>
      ) : (
        <div className="hidden sm:block" />
      )}

      {isCatalogue ? (
        <Field label="Item codes and quantities" htmlFor="requestedItemsText" optional hint="One per line" className="sm:col-span-2" error={errors.requestedItemsText}>
          <textarea
            id="requestedItemsText"
            name="requestedItemsText"
            rows={4}
            maxLength={FIELD_LIMITS.message}
            placeholder={"Mayo scissors 17 cm  x 200\nAdson forceps  x 500"}
            className={cn(inputClass(Boolean(errors.requestedItemsText)), "h-auto py-3 font-mono text-sm")}
          />
        </Field>
      ) : null}

      <Field label="Message" htmlFor="message" required={!isCatalogue} optional={isCatalogue} className="sm:col-span-2" error={errors.message}>
        <textarea
          id="message"
          name="message"
          rows={5}
          maxLength={FIELD_LIMITS.message}
          defaultValue={defaultMessage}
          placeholder={isCatalogue ? "Material, finish, marking, packaging, delivery date…" : "How can we help?"}
          aria-invalid={errors.message ? true : undefined}
          className={cn(inputClass(Boolean(errors.message)), "h-auto py-3")}
        />
      </Field>

      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={`website-${type}`}>Website</label>
        <input id={`website-${type}`} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {errors.form ? (
        <p role="alert" className="flex items-start gap-2 rounded-md border border-destructive/30 bg-red-50 p-3 text-sm text-destructive sm:col-span-2">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {errors.form}
        </p>
      ) : null}

      <div className="flex flex-col gap-4 sm:col-span-2 sm:flex-row sm:items-center">
        <Button type="submit" size="xl" disabled={pending} className="sm:w-auto">
          {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
          {pending ? "Sending…" : isCatalogue ? "Request catalogue" : "Send message"}
        </Button>
        <p className="text-sm text-slate-text">
          We use your details only to reply.{" "}
          <Link href="/privacy-policy" className="underline underline-offset-2 hover:text-ink">
            Privacy policy
          </Link>
        </p>
      </div>
    </form>
  );
}

export function inputClass(invalid: boolean) {
  return cn(
    "h-12 w-full rounded-md border bg-white px-4 text-[0.9375rem] text-ink outline-none transition-shadow placeholder:text-slate-text/60 focus-visible:ring-3",
    invalid ? "border-destructive focus-visible:ring-destructive/20" : "border-input focus-visible:border-cyan-500 focus-visible:ring-cyan-500/20",
  );
}

function Field({
  label,
  htmlFor,
  required,
  optional,
  hint,
  error,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  optional?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-2 block text-[0.9375rem] font-semibold text-ink">
        {label}
        {required ? <span className="sr-only"> (required)</span> : null}
        {optional || hint ? (
          <span className="ml-1.5 text-sm font-normal text-slate-text">
            {[optional ? "optional" : null, hint?.toLowerCase()].filter(Boolean).join(", ")}
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="mt-1.5 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function TextField({
  name,
  label,
  type = "text",
  required,
  optional,
  autoComplete,
  maxLength,
  error,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  optional?: boolean;
  autoComplete?: string;
  maxLength?: number;
  error?: string;
}) {
  return (
    <Field label={label} htmlFor={name} required={required} optional={optional} error={error}>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        className={inputClass(Boolean(error))}
      />
    </Field>
  );
}
