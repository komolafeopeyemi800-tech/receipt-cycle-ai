import type { Env } from "../types";

export type Mail = { to: string; subject: string; html: string; text: string };

const FALLBACK_FROM = "Receipt Cycle <no-reply@receiptcycle.com>";

/** True when at least one way of sending email is set up (Cloudflare Email Sending or Resend). */
export function mailEnabled(env: Env): boolean {
  return Boolean((env.EMAIL && env.MAIL_FROM?.trim()) || env.RESEND_API_KEY?.trim());
}

/**
 * Sends one email. Prefers Cloudflare Email Sending (the `EMAIL` binding, no extra account);
 * falls back to Resend when a key is set. Throws when it could not be sent.
 */
export async function sendMail(env: Env, mail: Mail): Promise<void> {
  const from = env.MAIL_FROM?.trim() || env.RESEND_FROM_EMAIL?.trim() || FALLBACK_FROM;
  if (env.EMAIL && env.MAIL_FROM?.trim()) {
    await env.EMAIL.send({ from, to: mail.to, subject: mail.subject, html: mail.html, text: mail.text });
    return;
  }
  const key = env.RESEND_API_KEY?.trim();
  if (!key) throw new Error("Email is not set up on the server.");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [mail.to], subject: mail.subject, html: mail.html, text: mail.text }),
  });
  if (!res.ok) throw new Error(`Could not send email: ${(await res.text()) || res.statusText}`);
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** One simple, on-brand layout shared by every email we send. */
export function layout(title: string, bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f1f5f9;font-family:Inter,Segoe UI,Arial,sans-serif;color:#0f172a">
<div style="max-width:520px;margin:0 auto;padding:28px 16px">
<div style="font-weight:700;font-size:18px;color:#0f766e;margin-bottom:16px">Receipt Cycle</div>
<div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:28px">
<h1 style="font-size:20px;margin:0 0 14px">${escapeHtml(title)}</h1>${bodyHtml}</div>
<p style="font-size:12px;color:#64748b;text-align:center;margin-top:16px">Receipt Cycle · receiptcycle.com</p>
</div></body></html>`;
}
