/** Contact-form email via Resend. Ported from apps/mobile/convex/email.ts. */
import { ApiError } from "../lib/errors";
import type { Env } from "../types";

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_FROM = "Receipt Cycle <onboarding@resend.dev>";
const SUPPORT_TO = "support@receiptcycle.com";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function sendEmail(
  apiKey: string,
  args: { from: string; to: string | string[]; replyTo?: string; subject: string; html: string; text?: string },
): Promise<void> {
  const res = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: args.from,
      to: Array.isArray(args.to) ? args.to : [args.to],
      reply_to: args.replyTo,
      subject: args.subject,
      html: args.html,
      text: args.text,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend error (${res.status}): ${body || res.statusText}`);
  }
}

/**
 * Public contact form: mails the support inbox with reply-to set to the visitor, then sends them an
 * acknowledgement. No PII is logged; a missing key looks like success to the client.
 */
export async function sendContactMessage(
  env: Env,
  input: { name: string; email: string; subject?: string; message: string; website?: string },
): Promise<{ ok: true; delivered: boolean }> {
  if (typeof input.website === "string" && input.website.trim().length > 0) return { ok: true, delivered: false };

  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const subject = (input.subject?.trim() || "New contact form message").slice(0, 140);
  const message = input.message.trim();
  if (!name || name.length > 200) throw new ApiError(400, "Please enter a valid name.");
  if (!email.includes("@") || email.length > 320) throw new ApiError(400, "Please enter a valid email address.");
  if (!message || message.length < 5) throw new ApiError(400, "Message is too short.");
  if (message.length > 10000) throw new ApiError(400, "Message is too long (max 10,000 characters).");

  const apiKey = env.RESEND_API_KEY?.trim();
  if (!apiKey) return { ok: true, delivered: false };
  const from = env.RESEND_FROM_EMAIL?.trim() || DEFAULT_FROM;
  const supportTo = env.RESEND_SUPPORT_EMAIL?.trim() || SUPPORT_TO;
  const firstName = name.split(" ")[0] || "there";

  await sendEmail(apiKey, {
    from,
    to: supportTo,
    replyTo: email,
    subject: `[Contact] ${subject}`,
    html: `
      <h2>New contact form message</h2>
      <p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
      <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
      <hr />
      <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
    `,
    text: `From: ${name} <${email}>\nSubject: ${subject}\n\n${message}`,
  });

  try {
    await sendEmail(apiKey, {
      from,
      to: email,
      subject: "We got your message — Receipt Cycle",
      html: `
      <p>Hi ${escapeHtml(firstName)},</p>
      <p>Thanks for reaching out to Receipt Cycle — we've got your message and we'll reply within one business day.</p>
      <p>For reference, here's what you sent:</p>
      <blockquote style="border-left:3px solid #0f766e;padding:8px 12px;color:#475569;white-space:pre-wrap">${escapeHtml(message)}</blockquote>
      <p>— The Receipt Cycle team</p>
    `,
      text: `Hi ${firstName},\n\nThanks for reaching out — we've got your message and we'll reply within one business day.\n\n— The Receipt Cycle team`,
    });
  } catch {
    // The inbound email to support landed, which is what matters. A failed auto-ack must not fail the request.
  }
  return { ok: true, delivered: true };
}
