"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, Loader2, Printer, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductVisual } from "@/components/shared/product-visual";
import { cn } from "@/lib/utils";
import { FIELD_LIMITS } from "@/config/limits";
import { quoteCustomerSchema } from "@/features/quotations/schemas";
import { refreshBasket, submitQuotation, type SubmitQuotationResult } from "@/features/quotations/actions";
import { countryNames } from "@/features/quotations/countries";
import { basketStore } from "../basket-store";
import { useBasket, useHydrated } from "../use-basket";
import { QuantityInput } from "./add-to-quote";

type Success = Extract<SubmitQuotationResult, { ok: true }>;
type FieldName = "customerName" | "companyName" | "businessEmail" | "phoneNumber" | "country" | "additionalMessage";
type Errors = Partial<Record<FieldName | "form" | "requestedItemsText", string>>;

const input =
  "w-full rounded-md border border-[#cdd5df] bg-white px-4 text-[0.9375rem] text-ink outline-none transition-shadow placeholder:text-slate-text/60 focus-visible:border-navy-800 focus-visible:ring-2 focus-visible:ring-navy-800/15";
const invalid = "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/15";

/**
 * Request a quote form: buyer details, buying terms and the product list.
 * Products added with "Add to quote" are listed at the top and sent with the request.
 */
export function QuoteBuilder({
  buyerTypes,
  payment,
  defaultNotes,
}: {
  buyerTypes: string[];
  payment: string[];
  defaultNotes?: string;
}) {
  const items = useBasket();
  const hydrated = useHydrated();
  const countries = useMemo(() => (hydrated ? countryNames() : []), [hydrated]);
  const [success, setSuccess] = useState<Success | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [pending, startTransition] = useTransition();
  const refreshed = useRef(false);
  const mountedAt = useRef(0);
  const submissionKey = useRef<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    mountedAt.current = Date.now();
  }, []);

  // Once per visit: refresh names/images and drop products that are no longer published.
  useEffect(() => {
    if (!hydrated || refreshed.current || items.length === 0) return;
    refreshed.current = true;
    const before = items.length;
    refreshBasket(items.map((i) => i.productId)).then((fresh) => {
      basketStore.reconcile(fresh);
      const removed = before - fresh.length;
      if (removed > 0) setNotice(`${removed} ${removed === 1 ? "product is" : "products are"} no longer available and ${removed === 1 ? "was" : "were"} removed.`);
    });
  }, [hydrated, items]);

  if (success) return <SuccessView result={success} />;

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const get = (k: string) => String(form.get(k) ?? "").trim();
    const terms = [
      get("buyerType") && `Buyer type: ${get("buyerType")}`,
      get("payment") && `Preferred payment: ${get("payment")}`,
      get("itemCode") && `Item code: ${get("itemCode")}`,
      get("neededBy") && `Needed by: ${get("neededBy")}`,
    ].filter(Boolean);
    const note = get("additionalMessage");
    const values = {
      customerName: get("customerName"),
      companyName: get("companyName"),
      businessEmail: get("businessEmail"),
      phoneNumber: get("phoneNumber"),
      country: get("country"),
      // Buying terms are saved at the top of the message.
      additionalMessage: [terms.join("\n"), note].filter(Boolean).join("\n\n"),
    };
    const requestedItemsText = get("requestedItemsText");
    const basket = basketStore.getSnapshot();

    const next: Errors = {};
    const check = quoteCustomerSchema.safeParse(values);
    if (!check.success) for (const issue of check.error.issues) next[issue.path[0] as FieldName] ??= issue.message;
    // Clearer messages for empty fields.
    if (!values.customerName) next.customerName = "Full name is required";
    if (!values.companyName) next.companyName = "Hospital, clinic or company is required";
    if (!values.businessEmail) next.businessEmail = "Email is required";
    if (!values.phoneNumber) next.phoneNumber = "Phone or WhatsApp number is required";
    if (!values.country) next.country = "Select the delivery country";
    if (basket.length === 0 && !requestedItemsText) {
      next.requestedItemsText = "Tell us the products and quantities you need";
    }
    if (Object.keys(next).length > 0) {
      setErrors(next);
      formRef.current?.querySelector<HTMLElement>(`[name="${Object.keys(next)[0]}"]`)?.focus();
      return;
    }

    submissionKey.current ??= crypto.randomUUID();
    startTransition(async () => {
      setErrors({});
      const result = await submitQuotation({
        ...values,
        requestedItemsText,
        items: basket.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        submissionKey: submissionKey.current,
        website: get("website"),
        elapsedMs: Date.now() - mountedAt.current,
      });
      if (result.ok) {
        submissionKey.current = null;
        basketStore.clear();
        setSuccess(result);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (result.unavailableProducts) {
        basketStore.reconcile(await refreshBasket(basketStore.getSnapshot().map((i) => i.productId)));
      }
      setErrors({ form: result.error, ...(result.fieldErrors as Errors) });
    });
  };

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
      {/* Products added with "Add to quote" (only shown when there are some) */}
      {hydrated && items.length > 0 ? (
        <div className="rounded-lg border border-[#cdd5df] bg-steel/60 p-5 sm:col-span-2">
          <p className="text-[0.9375rem] font-semibold text-ink">
            Products in your quote list <span className="font-normal text-slate-text">({items.length})</span>
          </p>
          {notice ? (
            <p role="status" className="mt-3 flex items-start gap-2 text-sm text-amber-800">
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden /> {notice}
            </p>
          ) : null}
          <ul className="mt-3 divide-y divide-line">
            {items.map((item) => (
              <li key={item.productId} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <ProductVisual imagePath={item.imagePath} alt={item.name} hints={[item.name]} sizes="48px" className="size-12 shrink-0 rounded-md border border-line" iconClassName="size-5" />
                  <div className="min-w-0">
                    <Link href={`/products/${item.slug}`} className="text-[0.9375rem] font-medium text-ink hover:underline">
                      {item.name}
                    </Link>
                    {item.productCode ? <p className="ref-code text-cyan-700">{item.productCode}</p> : null}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <QuantityInput size="md" value={item.quantity} onChange={(q) => basketStore.setQuantity(item.productId, q)} label={`Quantity for ${item.name}`} />
                  <button
                    type="button"
                    onClick={() => basketStore.remove(item.productId)}
                    className="grid size-10 place-items-center rounded-md text-slate-text hover:bg-red-50 hover:text-destructive"
                    aria-label={`Remove ${item.name}`}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <Field label="Full name" name="customerName" required error={errors.customerName} className="sm:col-span-2">
        <input id="customerName" name="customerName" autoComplete="name" maxLength={FIELD_LIMITS.customerName} aria-invalid={!!errors.customerName || undefined} className={cn(input, "h-11", errors.customerName && invalid)} />
      </Field>
      <Field label="Hospital / clinic / company" name="companyName" required error={errors.companyName} className="sm:col-span-2">
        <input id="companyName" name="companyName" autoComplete="organization" maxLength={FIELD_LIMITS.companyName} aria-invalid={!!errors.companyName || undefined} className={cn(input, "h-11", errors.companyName && invalid)} />
      </Field>
      <Field label="Email" name="businessEmail" required error={errors.businessEmail}>
        <input id="businessEmail" name="businessEmail" type="email" autoComplete="email" maxLength={FIELD_LIMITS.email} aria-invalid={!!errors.businessEmail || undefined} className={cn(input, "h-11", errors.businessEmail && invalid)} />
      </Field>
      <Field label="Phone / WhatsApp" name="phoneNumber" required error={errors.phoneNumber}>
        <input id="phoneNumber" name="phoneNumber" type="tel" autoComplete="tel" maxLength={FIELD_LIMITS.phoneMax} aria-invalid={!!errors.phoneNumber || undefined} className={cn(input, "h-11", errors.phoneNumber && invalid)} />
      </Field>
      <Field label="You are" name="buyerType">
        <select id="buyerType" name="buyerType" defaultValue={buyerTypes[0]} className={cn(input, "h-11")}>
          {buyerTypes.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </Field>
      <Field label="Preferred payment" name="payment">
        <select id="payment" name="payment" defaultValue={payment[0]} className={cn(input, "h-11")}>
          {payment.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </Field>
      <Field label="Item code" hint="optional, if you have one" name="itemCode" className="sm:col-span-2">
        <input id="itemCode" name="itemCode" maxLength={120} placeholder="e.g. OS-1023 or your own code" className={cn(input, "h-11 font-mono")} />
      </Field>
      <Field
        label="Products and quantities"
        required={items.length === 0}
        hint={items.length > 0 ? "optional, add more items here" : undefined}
        name="requestedItemsText"
        error={errors.requestedItemsText}
        className="sm:col-span-2"
      >
        <textarea
          id="requestedItemsText"
          name="requestedItemsText"
          rows={4}
          maxLength={FIELD_LIMITS.message}
          placeholder={"Product name or item code, quantity, one per line\ne.g. Mayo scissors 17 cm  x 200"}
          aria-invalid={!!errors.requestedItemsText || undefined}
          className={cn(input, "resize-y py-3", errors.requestedItemsText && invalid)}
        />
      </Field>
      <Field label="Delivery country" name="country" required error={errors.country}>
        <select id="country" name="country" defaultValue="" autoComplete="country-name" aria-invalid={!!errors.country || undefined} className={cn(input, "h-11", errors.country && invalid)}>
          <option value="">Select country</option>
          {countries.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Needed by" name="neededBy">
        <input id="neededBy" name="neededBy" maxLength={60} placeholder="e.g. 30 March or ASAP" className={cn(input, "h-11")} />
      </Field>
      <Field label="Notes (tender number, specs, questions)" name="additionalMessage" error={errors.additionalMessage} className="sm:col-span-2">
        <textarea id="additionalMessage" name="additionalMessage" rows={3} maxLength={FIELD_LIMITS.message - 300} defaultValue={defaultNotes} className={cn(input, "resize-y py-3")} />
      </Field>

      {/* Honeypot: hidden from people, tempting for bots */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="website-quote">Website</label>
        <input id="website-quote" name="website" type="text" tabIndex={-1} autoComplete="off" />
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
          {pending ? "Sending…" : "Request my quote"}
        </button>
        <p className="mt-2 text-sm text-slate-text">Every request is reviewed and answered by our team.</p>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  hint,
  required,
  error,
  className,
  children,
}: {
  label: string;
  name: string;
  hint?: string;
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
        {hint ? <span className="ml-1.5 text-sm font-normal text-slate-text">{hint}</span> : null}
      </label>
      {children}
      {error ? (
        <p id={`${name}-error`} className="mt-1.5 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function SuccessView({ result }: { result: Success }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headingRef.current?.focus(), []);
  const date = new Date(result.createdAt).toLocaleString("en", { dateStyle: "long", timeStyle: "short" });

  return (
    <div className="rounded-lg border border-line bg-white p-8 sm:p-10">
      <CheckCircle2 className="size-11 text-cyan-700" strokeWidth={1.5} aria-hidden />
      <h2 ref={headingRef} tabIndex={-1} className="mt-6 text-h2 outline-none">
        Enquiry received
      </h2>
      <p className="mt-3 max-w-xl text-lg leading-relaxed text-slate-text">
        Our team will review your request and send you a written quotation. Keep your reference for any follow-up.
      </p>
      <dl className="mt-8 grid border-t-2 border-navy-800 sm:grid-cols-2">
        <div className="border-b border-line py-4">
          <dt className="text-sm text-slate-text">Reference</dt>
          <dd className="mt-1 font-mono text-xl font-medium text-navy-800">{result.reference}</dd>
        </div>
        <div className="border-b border-line py-4">
          <dt className="text-sm text-slate-text">Sent</dt>
          <dd className="mt-1 font-medium text-ink">{date}</dd>
        </div>
      </dl>
      {result.items.length > 0 ? (
        <table className="mt-8 w-full text-[0.9375rem]">
          <caption className="mb-3 text-left font-semibold text-ink">Products</caption>
          <tbody className="divide-y divide-line border-y border-line">
            {result.items.map((item, i) => (
              <tr key={`${item.productName}-${i}`}>
                <td className="py-3 pr-4 text-ink">{item.productName}</td>
                <td className="ref-code py-3 pr-4 text-cyan-700">{item.productCode ?? ""}</td>
                <td className="py-3 text-right tabular-nums">× {item.quantity.toLocaleString("en")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      {result.requestedItemsText ? (
        <div className="mt-8">
          <p className="font-semibold text-ink">Your items</p>
          <pre className="mt-2 rounded-md bg-steel p-4 font-mono text-sm whitespace-pre-wrap text-ink">{result.requestedItemsText}</pre>
        </div>
      ) : null}
      <div className="mt-10 flex flex-wrap gap-3 print:hidden">
        <Button asChild size="lg">
          <Link href="/products">Continue browsing</Link>
        </Button>
        <Button type="button" size="lg" variant="outline" onClick={() => window.print()}>
          <Printer aria-hidden /> Print summary
        </Button>
      </div>
    </div>
  );
}
