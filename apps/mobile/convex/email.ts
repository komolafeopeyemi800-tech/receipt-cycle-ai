"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";

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

async function sendEmail(args: {
  from: string;
  to: string | string[];
  replyTo?: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Email delivery is not configured (missing RESEND_API_KEY).");
  }
  const res = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
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
 * Public contact-form submission. Sends the message to the support inbox
 * (RESEND_SUPPORT_EMAIL or support@receiptcycle.com), sets `reply_to` to the
 * visitor's email, and sends them an auto-acknowledgement.
 *
 * No PII is logged; errors are normalized so we don't leak configuration.
 */
export const sendContactMessage = action({
  args: {
    name: v.string(),
    email: v.string(),
    subject: v.optional(v.string()),
    message: v.string(),
    /** Optional turnstile-style honeypot. If non-empty we silently accept. */
    website: v.optional(v.string()),
  },
  handler: async (_ctx, args): Promise<{ ok: true; delivered: boolean }> => {
    if (typeof args.website === "string" && args.website.trim().length > 0) {
      return { ok: true, delivered: false };
    }

    const name = args.name.trim();
    const email = args.email.trim().toLowerCase();
    const subject = (args.subject?.trim() || "New contact form message").slice(0, 140);
    const message = args.message.trim();

    if (!name || name.length > 200) throw new Error("Please enter a valid name.");
    if (!email.includes("@") || email.length > 320) throw new Error("Please enter a valid email address.");
    if (!message || message.length < 5) throw new Error("Message is too short.");
    if (message.length > 10000) throw new Error("Message is too long (max 10,000 characters).");

    const from = process.env.RESEND_FROM_EMAIL?.trim() || DEFAULT_FROM;
    const supportTo = process.env.RESEND_SUPPORT_EMAIL?.trim() || SUPPORT_TO;

    const apiKey = process.env.RESEND_API_KEY?.trim();
    if (!apiKey) {
      // Don't reveal that email is unconfigured to the client; the Contact
      // page shows a generic "we've got it" message either way.
      return { ok: true, delivered: false };
    }

    const inboundHtml = `
      <h2>New contact form message</h2>
      <p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
      <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
      <hr />
      <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
    `;
    const inboundText = `From: ${name} <${email}>\nSubject: ${subject}\n\n${message}`;

    const ackHtml = `
      <p>Hi ${escapeHtml(name.split(" ")[0] || "there")},</p>
      <p>Thanks for reaching out to Receipt Cycle — we've got your message and we'll reply within one business day.</p>
      <p>For reference, here's what you sent:</p>
      <blockquote style="border-left:3px solid #0f766e;padding:8px 12px;color:#475569;white-space:pre-wrap">${escapeHtml(message)}</blockquote>
      <p>— The Receipt Cycle team</p>
    `;

    await sendEmail({
      from,
      to: supportTo,
      replyTo: email,
      subject: `[Contact] ${subject}`,
      html: inboundHtml,
      text: inboundText,
    });

    try {
      await sendEmail({
        from,
        to: email,
        subject: "We got your message — Receipt Cycle",
        html: ackHtml,
        text: `Hi ${name.split(" ")[0] || "there"},\n\nThanks for reaching out — we've got your message and we'll reply within one business day.\n\n— The Receipt Cycle team`,
      });
    } catch {
      // The inbound email to support landed — that's what matters.
      // A failed auto-ack (e.g. invalid user inbox) must not fail the request.
    }

    return { ok: true, delivered: true };
  },
});
