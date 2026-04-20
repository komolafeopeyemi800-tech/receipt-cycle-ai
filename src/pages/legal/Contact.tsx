import { useState } from "react";
import { api } from "@convex/_generated/api";
import { convex } from "@/lib/convex";
import { LegalLayout } from "./LegalLayout";
import { SUPPORT_EMAIL, INSTAGRAM_URL, TWITTER_URL } from "@/content/site";
import { Seo } from "@/components/Seo";
import { getRouteSeo } from "@/content/routesSeo";

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "ok"; delivered: boolean }
  | { kind: "error"; message: string };

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const seo = getRouteSeo("/contact");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status.kind === "sending") return;
    setStatus({ kind: "sending" });
    try {
      const result = await convex.action(api.email.sendContactMessage, {
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim() || undefined,
        message: message.trim(),
        website: website.trim() || undefined,
      });
      setStatus({ kind: "ok", delivered: result.delivered });
      if (result.delivered) {
        setName("");
        setEmail("");
        setSubject("");
        setMessage("");
      }
    } catch (err) {
      setStatus({
        kind: "error",
        message: err instanceof Error ? err.message : "Something went wrong. Please email support@receiptcycle.com directly.",
      });
    }
  }

  return (
    <LegalLayout title="Contact">
      {seo ? (
        <Seo
          title={seo.title}
          description={seo.description}
          path="/contact"
          structuredData={seo.structuredData}
        />
      ) : null}

      <p>We'd love to hear from you — product feedback, partnerships, press, or support. We reply within one business day.</p>

      <h2>Send us a message</h2>
      <form onSubmit={handleSubmit} className="not-prose mt-4 grid gap-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-slate-700">Your name</span>
            <input
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-200"
              maxLength={200}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-slate-700">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-200"
              maxLength={320}
            />
          </label>
        </div>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-slate-700">Subject (optional)</span>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-200"
            maxLength={140}
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-slate-700">Message</span>
          <textarea
            required
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-200"
            minLength={5}
            maxLength={10000}
          />
        </label>

        {/* Honeypot — real users never see this; bots happily fill it in. */}
        <label className="hidden" aria-hidden="true">
          Website
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </label>

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={status.kind === "sending"}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-teal-700 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status.kind === "sending" ? "Sending…" : "Send message"}
          </button>
          <span className="text-xs text-slate-500">Or email us directly at {SUPPORT_EMAIL}</span>
        </div>

        {status.kind === "ok" && status.delivered ? (
          <p className="rounded-lg border border-teal-200 bg-teal-50 p-3 text-sm text-teal-900">
            Thanks — your message is on its way. We'll reply within one business day.
          </p>
        ) : null}
        {status.kind === "ok" && !status.delivered ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Got it — please also email {SUPPORT_EMAIL} so we have a copy. (Our mailer may be
            warming up.)
          </p>
        ) : null}
        {status.kind === "error" ? (
          <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {status.message}
          </p>
        ) : null}
      </form>

      <h2>Email</h2>
      <p>
        <a href={`mailto:${SUPPORT_EMAIL}`} className="text-lg font-semibold">
          {SUPPORT_EMAIL}
        </a>
      </p>

      <h2>Social</h2>
      <ul>
        <li>
          <a href={TWITTER_URL} target="_blank" rel="noopener noreferrer">
            X (Twitter)
          </a>
        </li>
        <li>
          <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
            Instagram
          </a>
        </li>
      </ul>

      <h2>Response times</h2>
      <p>
        We aim to reply to every support request within one business day. Security issues should be
        marked "URGENT" in the subject line.
      </p>
    </LegalLayout>
  );
}
