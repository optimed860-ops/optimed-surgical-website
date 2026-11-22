import { getSiteSettings } from "@/features/catalogue/queries";

/**
 * Floating WhatsApp button (bottom right on every public page), with the number on larger screens. Uses the phone
 * number shown in the footer (Admin → Settings → Phone), so both stay in sync.
 */
export async function WhatsAppButton() {
  const settings = await getSiteSettings();
  const digits = (settings.phoneNumber ?? "").replace(/\D/g, "");
  if (digits.length < 8) return null;
  const text = encodeURIComponent("Hello Optimed Surgical, I would like to ask about your instruments.");

  return (
    <a
      href={`https://wa.me/${digits}?text=${text}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Chat with us on WhatsApp (${settings.phoneNumber})`}
      title="Chat on WhatsApp"
      className="fixed right-5 bottom-5 z-[60] inline-flex h-14 min-w-14 items-center justify-center gap-2.5 rounded-full bg-[#25d366] px-4 text-white shadow-[0_12px_28px_-8px_rgb(0_0_0/0.45)] transition-transform hover:scale-105 focus-visible:ring-4 focus-visible:ring-[#25d366]/40 focus-visible:outline-none print:hidden sm:right-6 sm:bottom-6 sm:pr-5"
    >
      <svg viewBox="0 0 24 24" className="size-7 shrink-0" fill="currentColor" aria-hidden>
        <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.05 21.8h-.01a9.8 9.8 0 0 1-4.99-1.37l-.36-.21-3.71.97.99-3.62-.23-.37A9.78 9.78 0 0 1 2.25 12c0-5.4 4.4-9.8 9.81-9.8a9.74 9.74 0 0 1 6.93 2.88 9.74 9.74 0 0 1 2.87 6.93c0 5.41-4.4 9.8-9.81 9.8zm8.35-18.15A11.72 11.72 0 0 0 12.05.2C5.55.2.26 5.48.26 11.99c0 2.08.54 4.11 1.58 5.9L.16 24l6.25-1.64a11.8 11.8 0 0 0 5.64 1.43h.01c6.5 0 11.79-5.29 11.79-11.79 0-3.15-1.23-6.11-3.45-8.35z" />
      </svg>
      <span className="hidden text-[0.9375rem] font-semibold whitespace-nowrap sm:inline">{settings.phoneNumber}</span>
    </a>
  );
}
