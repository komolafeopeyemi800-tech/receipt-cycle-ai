import { Hono } from "hono";
import { z } from "zod";
import { analyzeMoneyLeaks, financeCoachChat } from "../ai/chat";
import { sendContactMessage } from "../ai/email";
import {
  type ExtractedShape,
  anyOcrProviderConfigured,
  ensureFormattedPreview,
  geminiExtractWithSource,
  hasUsableScan,
  landingAiExtract,
  openaiTextOnlyExtract,
  openaiVisionExtract,
} from "../ai/scan";
import { openaiParseTransaction, whisperTranscribe } from "../ai/voice";
import { getRuntimeConfig } from "../lib/config";
import { parseBody } from "../lib/http";
import { computeSubscriptionState, sessionErrorMessage } from "../lib/subscription";
import { requireUser } from "../middleware/auth";
import type { AppEnv, AuthedUser } from "../types";

/** Signed-in + subscription gate shared by every AI route. Returns an error message, or null when allowed. */
function aiGate(u: AuthedUser, fallback: string): string | null {
  const st = computeSubscriptionState(
    {
      createdAt: u.createdAt,
      proSubscriptionActive: u.profile.proSubscriptionActive,
      trialStartedAt: u.profile.trialStartedAt,
      trialLifetimeAdds: u.profile.trialLifetimeAdds,
    },
    Date.now(),
  );
  return st.canUseAiFeatures ? null : (sessionErrorMessage(st.phase) ?? fallback);
}

const ledgerRow = z.object({
  date: z.string(),
  amount: z.number(),
  type: z.string(),
  category: z.string(),
  merchant: z.string().nullish(),
  description: z.string().nullish(),
});

const hints = z
  .object({
    expenseCategories: z.array(z.string()).optional(),
    incomeCategories: z.array(z.string()).optional(),
    accountNames: z.array(z.string()).optional(),
  })
  .nullish();

const blocked = (error: string) => ({ success: false as const, extracted_data: null, error, pipeline: "blocked" });

export const aiRoutes = new Hono<AppEnv>();
aiRoutes.use("*", requireUser);

/** Receipt photo to structured data. Provider order: OpenAI, then Gemini (OpenRouter or Google), then Landing AI. */
aiRoutes.post("/scan", async (c) => {
  const body = await parseBody(c, z.object({ imageBase64: z.string().min(1), mimeType: z.string().optional() }));
  const gate = aiGate(c.get("user"), "Upgrade to Pro or use a trial slot to scan receipts.");
  if (gate) return c.json(blocked(gate));
  const cfg = await getRuntimeConfig(c.get("db"));
  if (cfg.maintenanceMode) return c.json(blocked("System is in maintenance mode."));
  if (!cfg.scannerEnabled) return c.json(blocked("Scanner is currently disabled by admin."));

  const env = c.env;
  const mime = body.mimeType || "image/jpeg";
  const errs: string[] = [];
  let pipeline = "none";
  let extracted: ExtractedShape | null = null;

  try {
    extracted = await openaiVisionExtract(env, body.imageBase64, mime);
    if (extracted) pipeline = "openai_vision";
  } catch (e) {
    errs.push(e instanceof Error ? e.message : "openai_vision");
  }
  if (!extracted) {
    try {
      const { shape, via, notes } = await geminiExtractWithSource(env, body.imageBase64, mime);
      extracted = shape;
      errs.push(...notes);
      if (extracted) pipeline = via === "openrouter" ? "gemini_openrouter" : "gemini_google";
    } catch (e) {
      errs.push(e instanceof Error ? e.message : "gemini");
    }
  }
  if (!extracted) {
    try {
      extracted = await landingAiExtract(env, body.imageBase64, mime);
      if (extracted) pipeline = "landing_ai";
    } catch (e) {
      errs.push(e instanceof Error ? e.message : "landing_ai");
    }
  }
  if (extracted) extracted = ensureFormattedPreview(extracted);

  if (!extracted || !hasUsableScan(extracted)) {
    const detail = errs.filter(Boolean).join(" | ");
    const error = !anyOcrProviderConfigured(env)
      ? "This API has no OCR keys configured. Set at least one of OPENAI_API_KEY, OPENROUTER_API_KEY, GEMINI_API_KEY or LANDING_AI_API_KEY as a Worker secret."
      : `Could not read document (need a clear total or readable preview text). ${detail ? `API: ${detail}` : "Try better lighting, full frame, or CSV import for statements."}`;
    return c.json({ success: true as const, extracted_data: null, error, pipeline });
  }
  return c.json({
    success: true as const,
    extracted_data: extracted,
    pipeline,
    raw_data: { warnings: errs.length ? errs : undefined },
  });
});

/** Text already pulled from a PDF/CSV/statement to structured data (OpenAI text model only). */
aiRoutes.post("/scan-text", async (c) => {
  const { text } = await parseBody(c, z.object({ text: z.string() }));
  const gate = aiGate(c.get("user"), "Upgrade to Pro or use a trial slot for upload scanning.");
  if (gate) return c.json(blocked(gate));
  const cfg = await getRuntimeConfig(c.get("db"));
  if (cfg.maintenanceMode) return c.json(blocked("System is in maintenance mode."));
  if (!cfg.uploadEnabled) return c.json(blocked("Upload scanning is currently disabled by admin."));

  const trimmed = text.trim();
  if (trimmed.length < 8) {
    return c.json({ success: false as const, extracted_data: null, error: "Document text is too short to scan.", pipeline: "text" });
  }
  let extracted: ExtractedShape | null = null;
  const errs: string[] = [];
  try {
    extracted = await openaiTextOnlyExtract(c.env, trimmed);
    if (extracted) extracted = ensureFormattedPreview(extracted);
  } catch (e) {
    errs.push(e instanceof Error ? e.message : "openai_text");
  }
  if (!extracted || !hasUsableScan(extracted)) {
    const error = !c.env.OPENAI_API_KEY?.trim()
      ? "Add OPENAI_API_KEY to the API Worker for text scanning."
      : `Could not extract structured data from text. ${errs.join(" | ")}`;
    return c.json({ success: true as const, extracted_data: null, error, pipeline: "openai_text" });
  }
  return c.json({ success: true as const, extracted_data: extracted, pipeline: "openai_text" });
});

aiRoutes.post("/money-leaks", async (c) => {
  const body = await parseBody(c, z.object({ periodLabel: z.string(), rows: z.array(ledgerRow) }));
  const empty = { summary: "", findings: [], tips: [] as string[] };
  const gate = aiGate(c.get("user"), "Upgrade to use optional entry highlights.");
  if (gate) return c.json({ ok: false as const, error: gate, ...empty });
  const out = await analyzeMoneyLeaks(c.env, body);
  return c.json(out.ok ? { ...out, error: undefined } : { ok: false as const, error: out.error, ...empty });
});

aiRoutes.post("/voice/transcribe", async (c) => {
  const body = await parseBody(
    c,
    z.object({ audioBase64: z.string().min(1), mimeType: z.string().optional(), language: z.string().optional() }),
  );
  const gate = aiGate(c.get("user"), "Upgrade to use voice entry and Ask AI during an active trial or on Pro.");
  if (gate) return c.json({ ok: false as const, error: gate, text: "" });
  const tr = await whisperTranscribe(c.env, body.audioBase64, (body.mimeType ?? "audio/m4a").trim() || "audio/m4a", body.language);
  return c.json(tr.ok ? { ok: true as const, text: tr.text } : { ok: false as const, error: tr.error, text: "" });
});

aiRoutes.post("/voice/parse", async (c) => {
  const body = await parseBody(c, z.object({ text: z.string(), hints }));
  const gate = aiGate(c.get("user"), "Upgrade to use voice entry and Ask AI during an active trial or on Pro.");
  if (gate) return c.json({ ok: false as const, error: gate, draft: null });
  const t = body.text.trim();
  if (!t) return c.json({ ok: false as const, error: "Say or type what you bought.", draft: null });
  const out = await openaiParseTransaction(c.env, t, body.hints ?? undefined);
  return c.json(out.ok ? { ok: true as const, draft: out.draft } : { ok: false as const, error: out.error, draft: null });
});

aiRoutes.post("/voice/transaction", async (c) => {
  const body = await parseBody(
    c,
    z.object({ audioBase64: z.string().min(1), mimeType: z.string().optional(), language: z.string().optional(), hints }),
  );
  const gate = aiGate(c.get("user"), "Upgrade to use voice entry and Ask AI during an active trial or on Pro.");
  if (gate) return c.json({ ok: false as const, error: gate, transcript: "", draft: null });
  const tr = await whisperTranscribe(c.env, body.audioBase64, (body.mimeType ?? "audio/m4a").trim() || "audio/m4a", body.language);
  if (!tr.ok) return c.json({ ok: false as const, error: tr.error, transcript: "", draft: null });
  const parsed = await openaiParseTransaction(c.env, tr.text, body.hints ?? undefined);
  if (!parsed.ok) return c.json({ ok: false as const, error: parsed.error, transcript: tr.text, draft: null });
  return c.json({ ok: true as const, transcript: tr.text, draft: parsed.draft });
});

aiRoutes.post("/coach", async (c) => {
  const body = await parseBody(
    c,
    z.object({
      periodLabel: z.string(),
      rows: z.array(ledgerRow),
      messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })),
    }),
  );
  const gate = aiGate(c.get("user"), "Upgrade to use voice entry and Ask AI during an active trial or on Pro.");
  if (gate) return c.json({ ok: false as const, error: gate, reply: "" });
  const out = await financeCoachChat(c.env, body);
  return c.json(out.ok ? { ok: true as const, reply: out.reply } : { ok: false as const, error: out.error, reply: "" });
});

/** Public contact form (no sign-in). */
export const contactRoutes = new Hono<AppEnv>();
contactRoutes.post("/", async (c) => {
  const body = await parseBody(
    c,
    z.object({
      name: z.string(),
      email: z.string(),
      subject: z.string().optional(),
      message: z.string(),
      website: z.string().optional(),
    }),
  );
  return c.json(await sendContactMessage(c.env, body));
});
