"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { anyOcrProviderConfigured, openRouterApiKey } from "./_ocrEnv";
import { api, internal } from "./_generated/api";

type ExtractedShape = {
  merchant_name?: string;
  total_amount?: number;
  subtotal?: number | null;
  tax_amount?: number | null;
  date?: string;
  /** Time as printed, e.g. 14:32 — omit if not visible */
  time?: string;
  payment_method?: string;
  category?: string;
  currency?: string;
  items?: Array<{ name?: string; quantity?: number; price?: number }>;
  /** Classifier for output template + tags */
  document_type?: string;
  /** BCP-47 or readable language names */
  detected_languages?: string[];
  /** e.g. not_a_receipt, partially_illegible, multi_currency */
  tags?: string[];
  /** Plain-text receipt-style or document summary for user preview */
  formatted_receipt_text?: string;
  ocr_confidence?: string;
};

/** Shared JSON fields for all vision providers */
const EXTENDED_SCHEMA_PROMPT = `Return ONE JSON object with:
- document_type: one of "retail_receipt" | "restaurant_receipt" | "invoice" | "handwritten_note" | "foreign_language_receipt" | "other_document"
- detected_languages: array of language codes or names for text you see (e.g. ["en","es","zh-Hans","ar"])
- tags: string[] of short flags like "not_a_receipt", "partially_illegible", "no_total_visible", "multi_currency", "tax_included" — use [] if none
- formatted_receipt_text: REQUIRED. Multi-line plain text that LOOKS like a printed receipt or official block. Keep merchant/item names in their original language/script. Use simple separators (---, ═══). If NOT a purchase slip, use header "DOCUMENT SUMMARY" and describe content.
- ocr_confidence: "high" | "medium" | "low"
- merchant_name, total_amount (number > 0 when a clear total exists; else omit or 0), subtotal (number|null), tax_amount (number|null), date (YYYY-MM-DD or ""), time (HH:MM 24h or exact string printed on slip; omit if not visible), payment_method, category (Food & Dining, Shopping, Transportation, Entertainment, Bills, Health, Education, Other), currency (3-letter ISO), items (array of {name, quantity, price}).`;

/** Primary path: OpenAI vision — multilingual OCR + receipt-formatted output */
const OPENAI_ADVANCED_PROMPT = `You are an elite multilingual document OCR and layout analyst for Receipt Cycle.

CORE RULES:
1) Read ALL scripts and languages (English, Spanish, French, Chinese/Japanese/Korean, Arabic, Hindi, etc.). Transcribe accurately in UTF-8; keep original spelling for merchant and line items.
2) Identify document_type. If the image is NOT a commercial receipt (e.g. random photo, blank), set tags to include "not_a_receipt" and still fill formatted_receipt_text as a short summary of what you see.
3) total_amount = final amount due (TOTAL / AMOUNT DUE / BALANCE). Never use a line subtotal as total unless no grand total exists; then tag "no_total_visible" if ambiguous.
4) formatted_receipt_text is the PRIMARY user-facing preview: format it like a thermal receipt (title line, items block, dashed line, TOTAL). For invoices, preserve line structure. Minimum ~6 lines when content exists.
5) category: infer from merchant/items. currency: ISO 4217 when possible.

${EXTENDED_SCHEMA_PROMPT}
Output strictly valid JSON only — no markdown code fences.`;

function stripBase64Prefix(b64: string) {
  return b64.replace(/^data:image\/\w+;base64,/, "");
}

/** Unwrap `{ "data": { ... } }` some models return */
function unwrapExtractPayload(raw: unknown): ExtractedShape | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if ("data" in o && o.data && typeof o.data === "object") {
    return o.data as ExtractedShape;
  }
  return raw as ExtractedShape;
}

/** Coerce string totals like "12.34" or "$45.00" — common model mistakes */
function coerceTotalAmount(parsed: ExtractedShape): ExtractedShape {
  const t: unknown = parsed.total_amount;
  if (typeof t === "string") {
    const n = parseFloat(t.replace(/[^0-9.-]/g, ""));
    if (Number.isFinite(n) && n > 0) return { ...parsed, total_amount: n };
  }
  return parsed;
}

function normalizeShape(parsed: ExtractedShape): ExtractedShape {
  const tags = Array.isArray(parsed.tags)
    ? parsed.tags.filter((t): t is string => typeof t === "string" && t.trim().length > 0).map((t) => t.trim())
    : undefined;
  const detected_languages = Array.isArray(parsed.detected_languages)
    ? parsed.detected_languages.filter((t): t is string => typeof t === "string").map((t) => t.trim())
    : undefined;
  return { ...parsed, tags, detected_languages };
}

/** Models sometimes wrap JSON in ```json ... ``` — parse safely */
function parseJsonFromModelText(text: string): ExtractedShape | null {
  let t = text.trim();
  const fence = /^```(?:json)?\s*\r?\n?([\s\S]*?)\r?\n?```$/m.exec(t);
  if (fence) t = fence[1]!.trim();
  try {
    const raw = JSON.parse(t) as unknown;
    let parsed = unwrapExtractPayload(raw);
    if (!parsed) return null;
    parsed = coerceTotalAmount(parsed);
    return normalizeShape(parsed);
  } catch {
    return null;
  }
}

function ensureFormattedPreview(e: ExtractedShape): ExtractedShape {
  const t = (e.formatted_receipt_text ?? "").trim();
  if (t.length >= 12) return e;
  const lines: string[] = [];
  lines.push("══════════════════════════");
  lines.push("       SCAN RESULT");
  lines.push("══════════════════════════");
  if (e.document_type) lines.push(`Type: ${e.document_type}`);
  if (e.detected_languages?.length) lines.push(`Languages: ${e.detected_languages.join(", ")}`);
  if (e.merchant_name) lines.push(String(e.merchant_name));
  if (e.date) lines.push(`Date: ${e.date}`);
  if (e.items?.length) {
    lines.push("— Items —");
    for (const i of e.items) {
      const p = i.price != null && Number.isFinite(i.price) ? String(i.price) : "";
      lines.push(`  ${i.name ?? "?"}  ${p}`);
    }
  }
  if (e.total_amount != null && e.total_amount > 0) {
    lines.push(`TOTAL: ${e.total_amount} ${e.currency ?? ""}`.trim());
  }
  if (e.tags?.length) lines.push(`Tags: ${e.tags.join(", ")}`);
  lines.push("══════════════════════════");
  return { ...e, formatted_receipt_text: lines.join("\n") };
}

/** Preview text OR valid monetary total */
function hasUsableScan(e: ExtractedShape | null): boolean {
  if (!e) return false;
  const preview = (e.formatted_receipt_text ?? "").trim();
  if (preview.length >= 20) return true;
  return isValidExtract(e);
}

function isValidExtract(e: ExtractedShape | null | undefined): e is ExtractedShape {
  return !!(
    e &&
    typeof e.total_amount === "number" &&
    Number.isFinite(e.total_amount) &&
    e.total_amount > 0
  );
}

/**
 * Gemini via OpenRouter (same models, different quota/billing than Google AI Studio).
 * @see https://openrouter.ai/docs
 */
async function geminiViaOpenRouterExtract(base64: string, mime: string): Promise<ExtractedShape | null> {
  const key = openRouterApiKey();
  if (!key) return null;

  const model =
    process.env.OPENROUTER_GEMINI_MODEL?.trim() || "google/gemini-2.0-flash-001";

  const messages = [
    {
      role: "user" as const,
      content: [
        {
          type: "text" as const,
          text: `You are a multilingual receipt/document OCR expert. ${EXTENDED_SCHEMA_PROMPT}\nReply with JSON only, no markdown.`,
        },
        {
          type: "image_url" as const,
          image_url: {
            url: `data:${mime || "image/jpeg"};base64,${stripBase64Prefix(base64)}`,
          },
        },
      ],
    },
  ];

  const baseBody = {
    model,
    temperature: 0.05,
    max_tokens: 8192,
    messages,
  };

  let res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.OPENROUTER_HTTP_REFERER?.trim() || "https://receiptcycle.app",
      "X-Title": "Receipt Cycle",
    },
    body: JSON.stringify({
      ...baseBody,
      response_format: { type: "json_object" as const },
    }),
  });

  // Some Gemini routes reject json_object mode — retry without it
  if (!res.ok && (res.status === 400 || res.status === 422)) {
    res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.OPENROUTER_HTTP_REFERER?.trim() || "https://receiptcycle.app",
        "X-Title": "Receipt Cycle",
      },
      body: JSON.stringify(baseBody),
    });
  }

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OpenRouter Gemini (${res.status}): ${t.slice(0, 280)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content;
  if (!text) return null;
  return parseJsonFromModelText(text);
}

/** Direct Google Generative Language API (can hit 429 if project quota exceeded). */
async function geminiGoogleDirectExtract(base64: string, mime: string): Promise<ExtractedShape | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              inline_data: {
                mime_type: mime || "image/jpeg",
                data: stripBase64Prefix(base64),
              },
            },
            { text: `You are a multilingual receipt OCR expert. ${EXTENDED_SCHEMA_PROMPT}\nReply with JSON only.` },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.05,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Gemini (${res.status}): ${t.slice(0, 280)}`);
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return null;
  return parseJsonFromModelText(text);
}

async function geminiExtractWithSource(
  base64: string,
  mime: string,
): Promise<{ shape: ExtractedShape | null; via: "openrouter" | "google" | null; notes: string[] }> {
  const notes: string[] = [];
  if (openRouterApiKey()) {
    try {
      const r = await geminiViaOpenRouterExtract(base64, mime);
      if (r) return { shape: r, via: "openrouter", notes };
    } catch (e) {
      notes.push(e instanceof Error ? e.message : "openrouter");
    }
  }
  try {
    const r = await geminiGoogleDirectExtract(base64, mime);
    return { shape: r, via: r ? "google" : null, notes };
  } catch (e) {
    notes.push(e instanceof Error ? e.message : "gemini_google");
    return { shape: null, via: null, notes };
  }
}

async function openaiVisionExtract(base64: string, mime: string): Promise<ExtractedShape | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  /** Default gpt-4o-mini + detail:high; set OPENAI_VISION_MODEL=gpt-4o for best multilingual OCR */
  const model = process.env.OPENAI_VISION_MODEL?.trim() || "gpt-4o-mini";

  const maxTokens = Math.min(
    16384,
    Math.max(4096, parseInt(process.env.OPENAI_VISION_MAX_TOKENS ?? "8192", 10) || 8192),
  );

  const messages = [
    {
      role: "user" as const,
      content: [
        {
          type: "text" as const,
          text: OPENAI_ADVANCED_PROMPT,
        },
        {
          type: "image_url" as const,
          image_url: {
            url: `data:${mime || "image/jpeg"};base64,${stripBase64Prefix(base64)}`,
            detail: "high" as const,
          },
        },
      ],
    },
  ];

  const baseBody = {
    model,
    temperature: 0.05,
    max_tokens: maxTokens,
    messages,
  };

  let res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...baseBody,
      response_format: { type: "json_object" as const },
    }),
  });

  if (!res.ok && (res.status === 400 || res.status === 422)) {
    res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(baseBody),
    });
  }

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OpenAI vision (${res.status}): ${t.slice(0, 280)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content;
  if (!text) return null;
  return parseJsonFromModelText(text);
}

/** Text-only path for PDF/CSV/plain text uploads (no image). */
async function openaiTextOnlyExtract(documentText: string): Promise<ExtractedShape | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  const model = process.env.OPENAI_VISION_MODEL?.trim() || "gpt-4o-mini";
  const maxChars = 100_000;
  const body =
    documentText.length > maxChars
      ? `${documentText.slice(0, maxChars)}\n\n...[truncated for model]`
      : documentText;

  const prompt = `You are given TEXT extracted from a bank statement, receipt scan, invoice, or CSV export.

Infer a single representative transaction OR the clearest purchase line if multiple unrelated rows appear.
${EXTENDED_SCHEMA_PROMPT}

Rules: If many unrelated lines exist, pick the largest expense or summarize the document in formatted_receipt_text and set merchant_name from the payee if obvious.
Output strictly valid JSON only — no markdown.`;

  const messages = [
    {
      role: "user" as const,
      content: `${prompt}\n\n--- DOCUMENT TEXT ---\n${body}`,
    },
  ];

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.05,
      max_tokens: 8192,
      messages,
      response_format: { type: "json_object" as const },
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OpenAI text (${res.status}): ${t.slice(0, 280)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content;
  if (!text) return null;
  let parsed = parseJsonFromModelText(text);
  if (parsed) parsed = coerceTotalAmount(parsed);
  return parsed ? normalizeShape(parsed) : null;
}

async function landingAiExtract(base64: string, mime: string): Promise<ExtractedShape | null> {
  const apiKey = process.env.LANDING_AI_API_KEY;
  if (!apiKey) return null;

  const clean = stripBase64Prefix(base64);
  const binary = Buffer.from(clean, "base64");
  const blob = new Blob([binary], { type: mime || "image/jpeg" });

  const parseFormData = new FormData();
  parseFormData.append("document", blob, "receipt.jpg");
  parseFormData.append("model", "dpt-2-latest");

  const parseResponse = await fetch("https://api.va.landing.ai/v1/ade/parse", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: parseFormData,
  });

  if (!parseResponse.ok) {
    const errTxt = await parseResponse.text().catch(() => "");
    throw new Error(`Landing parse (${parseResponse.status}): ${errTxt.slice(0, 200)}`);
  }
  const parseResult = (await parseResponse.json()) as { markdown?: string; chunks?: unknown[] };

  const extractSchema = {
    type: "object",
    properties: {
      merchant_name: { type: "string" },
      total_amount: { type: "number" },
      date: { type: "string" },
      payment_method: { type: "string" },
      category: { type: "string" },
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            quantity: { type: "number" },
            price: { type: "number" },
          },
        },
      },
    },
    required: ["merchant_name", "total_amount"],
  };

  const extractResponse = await fetch("https://api.va.landing.ai/v1/ade/extract", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      markdown: parseResult.markdown,
      chunks: parseResult.chunks,
      schema: extractSchema,
    }),
  });

  if (!extractResponse.ok) return null;
  const extractResult = await extractResponse.json();
  const raw = extractResult as Record<string, unknown>;
  const inner = (raw?.data ?? raw?.extracted_data ?? raw) as ExtractedShape;
  const normalized = normalizeShape(coerceTotalAmount(inner));
  const withPreview = ensureFormattedPreview(normalized);
  return hasUsableScan(withPreview) ? withPreview : null;
}

export const scanFromBase64 = action({
  args: {
    imageBase64: v.string(),
    mimeType: v.optional(v.string()),
    /** Signed-in session — required for subscription / AI access gating */
    sessionToken: v.string(),
  },
  handler: async (ctx, { imageBase64, mimeType, sessionToken }) => {
    const gate = await ctx.runQuery(internal.subscription.evaluateForAction, { token: sessionToken });
    if (!gate.ok) {
      return { success: false as const, extracted_data: null, error: "Sign in to scan receipts.", pipeline: "blocked" };
    }
    if (!gate.canUseAiFeatures) {
      return {
        success: false as const,
        extracted_data: null,
        error: gate.blockReason ?? "Upgrade to Pro or use a trial slot to scan receipts.",
        pipeline: "blocked",
      };
    }
    const cfg = await ctx.runQuery(api.admin.publicConfig, {});
    if (cfg.maintenanceMode) {
      return { success: false as const, extracted_data: null, error: "System is in maintenance mode.", pipeline: "blocked" };
    }
    if (!cfg.scannerEnabled) {
      return { success: false as const, extracted_data: null, error: "Scanner is currently disabled by admin.", pipeline: "blocked" };
    }
    const mime = mimeType || "image/jpeg";
    const errs: string[] = [];
    let pipeline = "none";

    let extracted: ExtractedShape | null = null;

    /**
     * Order: OpenAI (primary — document understanding + vision; works with only OPENAI_API_KEY)
     * → Gemini → Landing AI as fallbacks (e.g. if OpenAI key missing or Gemini quota OK).
     */
    try {
      extracted = await openaiVisionExtract(imageBase64, mime);
      if (extracted) pipeline = "openai_vision";
    } catch (e) {
      errs.push(e instanceof Error ? e.message : "openai_vision");
    }

    if (!extracted) {
      try {
        const { shape, via, notes } = await geminiExtractWithSource(imageBase64, mime);
        extracted = shape;
        errs.push(...notes);
        if (extracted) {
          pipeline = via === "openrouter" ? "gemini_openrouter" : "gemini_google";
        }
      } catch (e) {
        errs.push(e instanceof Error ? e.message : "gemini");
      }
    }

    if (!extracted) {
      try {
        extracted = await landingAiExtract(imageBase64, mime);
        if (extracted) pipeline = "landing_ai";
      } catch (e) {
        errs.push(e instanceof Error ? e.message : "landing_ai");
      }
    }

    if (extracted) {
      extracted = ensureFormattedPreview(extracted);
    }

    if (!extracted || !hasUsableScan(extracted)) {
      const detail = errs.filter(Boolean).join(" | ");
      const noKeysOnDeployment = !anyOcrProviderConfigured();
      const error = noKeysOnDeployment
        ? `This Convex deployment has no OCR API keys. Add at least one in Convex Dashboard → Environment Variables (same project as EXPO_PUBLIC_CONVEX_URL): OPENAI_API_KEY, OPENROUTER_AI_API_KEY or OPENROUTER_API_KEY, GEMINI_API_KEY, or LANDING_AI_API_KEY. Then redeploy or restart convex dev.`
        : `Could not read document (need a clear total or readable preview text). ${detail ? `API: ${detail}` : "Try better lighting, full frame, or CSV import for statements."} Keys are on this deployment — if you just added them, run \`npx convex dev\` / deploy again. Confirm the app points at this deployment (EXPO_PUBLIC_CONVEX_URL).`;
      return {
        success: true as const,
        extracted_data: null,
        error,
        pipeline,
      };
    }

    return {
      success: true as const,
      extracted_data: extracted,
      pipeline,
      raw_data: { warnings: errs.length ? errs : undefined },
    };
  },
});

export const scanFromDocumentText = action({
  args: {
    text: v.string(),
    sessionToken: v.string(),
  },
  handler: async (ctx, { text, sessionToken }) => {
    const gate = await ctx.runQuery(internal.subscription.evaluateForAction, { token: sessionToken });
    if (!gate.ok) {
      return { success: false as const, extracted_data: null, error: "Sign in to scan uploads.", pipeline: "blocked" };
    }
    if (!gate.canUseAiFeatures) {
      return {
        success: false as const,
        extracted_data: null,
        error: gate.blockReason ?? "Upgrade to Pro or use a trial slot for upload scanning.",
        pipeline: "blocked",
      };
    }
    const cfg = await ctx.runQuery(api.admin.publicConfig, {});
    if (cfg.maintenanceMode) {
      return { success: false as const, extracted_data: null, error: "System is in maintenance mode.", pipeline: "blocked" };
    }
    if (!cfg.uploadEnabled) {
      return { success: false as const, extracted_data: null, error: "Upload scanning is currently disabled by admin.", pipeline: "blocked" };
    }
    const trimmed = text.trim();
    if (trimmed.length < 8) {
      return {
        success: false as const,
        extracted_data: null,
        error: "Document text is too short to scan.",
        pipeline: "text",
      };
    }
    let extracted: ExtractedShape | null = null;
    const errs: string[] = [];
    try {
      extracted = await openaiTextOnlyExtract(trimmed);
      if (extracted) extracted = ensureFormattedPreview(extracted);
    } catch (e) {
      errs.push(e instanceof Error ? e.message : "openai_text");
    }

    if (!extracted || !hasUsableScan(extracted)) {
      const noKeys = !process.env.OPENAI_API_KEY?.trim();
      const error = noKeys
        ? "Add OPENAI_API_KEY to this Convex deployment for text scanning."
        : `Could not extract structured data from text. ${errs.join(" | ")}`;
      return {
        success: true as const,
        extracted_data: null,
        error,
        pipeline: "openai_text",
      };
    }

    return {
      success: true as const,
      extracted_data: extracted,
      pipeline: "openai_text",
    };
  },
});
