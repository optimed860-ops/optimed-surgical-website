import "server-only";
import nodemailer from "nodemailer";

/**
 * Free admin notification by email over SMTP (for example Gmail with an App Password).
 * Optional: if the SMTP_* / NOTIFY_EMAIL variables are not set, nothing is sent and
 * the request is still saved in the admin panel. Runs after the response (after()),
 * so a slow or failing mail server never affects the visitor.
 */

type Line = [label: string, value: string | null | undefined];

function smtpConfig() {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.replace(/\s+/g, "");
  const to = process.env.NOTIFY_EMAIL?.trim() || user;
  if (!host || !user || !pass || !to) return null;
  const port = Number(process.env.SMTP_PORT || 465);
  return { host, port, secure: port === 465, auth: { user, pass }, to, from: user };
}

/**
 * Resend (https://resend.com, free plan). Used when RESEND_API_KEY is set.
 * Without a verified domain, EMAIL_FROM must stay "onboarding@resend.dev" and
 * NOTIFY_EMAIL must be the email address of your own Resend account.
 */
function resendConfig() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const to = process.env.NOTIFY_EMAIL?.trim();
  if (!apiKey || !to) return null;
  const fromAddress = process.env.EMAIL_FROM?.trim() || "onboarding@resend.dev";
  return {
    apiKey,
    to: to.split(",").map((e) => e.trim()).filter(Boolean).slice(0, 5),
    from: fromAddress.includes("<") ? fromAddress : `Website <${fromAddress}>`,
  };
}

/** One line, no control characters (keeps headers safe). */
const oneLine = (value: string, max = 120) => value.replace(/[\r\n\t\u0000-\u001f]+/g, " ").trim().slice(0, max);

export async function notifyAdmin({
  subject,
  heading,
  lines,
  sections = [],
  replyTo,
  adminPath,
}: {
  subject: string;
  heading: string;
  lines: Line[];
  sections?: Line[];
  replyTo?: string;
  adminPath: string;
}): Promise<void> {
  const resend = resendConfig();
  const config = resend ? null : smtpConfig();
  if (!resend && !config) return;

  const site = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  const text = [
    heading,
    "",
    ...lines.filter(([, v]) => v).map(([label, v]) => `${label}: ${v}`),
    ...sections.filter(([, v]) => v).flatMap(([label, v]) => ["", `${label}:`, v as string]),
    "",
    site ? `Open in the admin panel: ${site}${adminPath}` : `Open the admin panel: ${adminPath}`,
  ].join("\n");

  const safeReplyTo = replyTo && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(replyTo) ? replyTo : undefined;

  if (resend) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resend.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: resend.from,
          to: resend.to,
          subject: oneLine(subject, 160),
          text,
          ...(safeReplyTo ? { reply_to: safeReplyTo } : {}),
        }),
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { message?: string } | null;
        console.error("[email] Resend refused the notification:", res.status, body?.message ?? "");
      }
    } catch (error) {
      console.error("[email] notification not sent:", (error as Error).message);
    }
    return;
  }
  if (!config) return;

  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
    await transporter.sendMail({
      from: { name: "Website", address: config.from },
      to: config.to,
      replyTo: safeReplyTo,
      subject: oneLine(subject, 160),
      text,
      disableFileAccess: true,
      disableUrlAccess: true,
    });
  } catch (error) {
    // Never log the password; the message from the mail server is enough.
    console.error("[email] notification not sent:", (error as Error).message);
  }
}
