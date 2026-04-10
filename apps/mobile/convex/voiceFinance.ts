"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

async function gateSessionAi(
  ctx: { runQuery: (r: unknown, a: { token: string }) => Promise<{ ok: boolean; canUseAiFeatures?: boolean; blockReason?: string | null }> },
  sessionToken: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const gate = await ctx.runQuery(internal.subscription.evaluateForAction, { token: sessionToken.trim() });
  if (!gate.ok) return { ok: false, error: "Sign in to use this feature." };
  if (!gate.canUseAiFeatures) {
    return {
      ok: false,
      error: gate.blockReason ?? "Upgrade to use voice entry and Ask AI during an active trial or on Pro.",
    };
  }
  return { ok: true };
}

const rowValidator = v.object({
  date: v.string(),
  amount: v.number(),
  type: v.string(),
  category: v.string(),
  merchant: v.optional(v.string()),
  description: v.optional(v.string()),
});

const messageValidator = v.object({
  role: v.union(v.literal("user"), v.literal("assistant")),
  content: v.string(),
});

function requireOpenAiKey(): string | null {
  return process.env.OPENAI_API_KEY?.trim() || null;
}

async function whisperTranscribe(
  audioBase64: string,
  mimeType: string,
  language?: string | null,
): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const key = requireOpenAiKey();
  if (!key) {
    return { ok: false, error: "Add OPENAI_API_KEY to your Convex deployment for voice features." };
  }

  const buf = Buffer.from(audioBase64, "base64");
  const ext =
    mimeType.includes("webm") ? "webm" : mimeType.includes("wav") ? "wav" : mimeType.includes("mp3") ? "mp3" : "m4a";
  const form = new FormData();
  form.append("file", new Blob([buf], { type: mimeType || "audio/m4a" }), `clip.${ext}`);
  form.append("model", "whisper-1");
  const lang = (language ?? "").trim().toLowerCase();
  if (lang && lang !== "auto") {
    const code = lang.length === 2 ? lang : lang.split(/[-_]/)[0] ?? lang;
    if (/^[a-z]{2}$/i.test(code)) {
      form.append("language", code.toLowerCase());
    }
  }

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });

  if (!res.ok) {
    const t = await res.text();
    return { ok: false, error: `Whisper (${res.status}): ${t.slice(0, 200)}` };
  }

  const data = (await res.json()) as { text?: string };
  const text = String(data.text ?? "").trim();
  if (!text) {
    return { ok: false, error: "Could not transcribe audio. Try again or type your purchase." };
  }
  return { ok: true, text };
}

export type VoiceParseHints = {
  expenseCategories?: string[];
  incomeCategories?: string[];
  accountNames?: string[];
};

export type TxDraft = {
  intent: "transaction" | "budget";
  amount: number | null;
  type: "expense" | "income";
  category: string;
  merchant: string | null;
  date: string | null;
  description: string | null;
  payment_method: string | null;
  confidence: "high" | "medium" | "low";
  budgetCategory: string | null;
  budgetLimit: number | null;
  budgetMonth: string | null;
};

function hintsBlock(hints?: VoiceParseHints | null): string {
  if (!hints) return "";
  const exp = (hints.expenseCategories ?? []).map((s) => s.trim()).filter(Boolean);
  const inc = (hints.incomeCategories ?? []).map((s) => s.trim()).filter(Boolean);
  const acc = (hints.accountNames ?? []).map((s) => s.trim()).filter(Boolean);
  const parts: string[] = [];
  if (exp.length)
    parts.push(
      `The user's saved EXPENSE category names (use an EXACT string from this list when the utterance matches; otherwise closest): ${exp.slice(0, 80).join(" | ")}`,
    );
  if (inc.length)
    parts.push(
      `The user's saved INCOME category names (exact match when possible): ${inc.slice(0, 40).join(" | ")}`,
    );
  if (acc.length)
    parts.push(
      `Account / payment labels the user uses — map payment_method to the closest from: ${acc.slice(0, 40).join(" | ")}`,
    );
  return parts.length ? `\n\n${parts.join("\n")}` : "";
}

async function openaiParseTransaction(
  transcript: string,
  hints?: VoiceParseHints | null,
): Promise<{ ok: true; draft: TxDraft } | { ok: false; error: string }> {
  const key = requireOpenAiKey();
  if (!key) {
    return { ok: false, error: "Add OPENAI_API_KEY to your Convex deployment." };
  }

  const todayUtc = new Date().toISOString().split("T")[0];
  const system = `You parse spoken or typed money notes into structured JSON for a personal receipt app.

Two intents:
1) "transaction" — a purchase, bill, refund, or income line they want to log (amount, merchant, category, date, etc.).
2) "budget" — they want a monthly spending cap for a category (e.g. "set groceries budget to 300", "cap food at 500 this month").

Rules for transaction:
- type: "expense" unless they clearly earned income.
- amount: positive number; null only if truly unclear.
- category: MUST prefer an EXACT match from the user's lists when provided; otherwise best short label.
- merchant: store or payee if inferable.
- date: YYYY-MM-DD from what they said (relative like "yesterday" vs today UTC ${todayUtc}) or null.
- description: short note or null.
- payment_method: how they paid ONLY if they say it (e.g. cash, card, Venmo) — match to their account list when provided; else null.

Rules for budget:
- intent "budget", budgetLimit = monthly cap as a positive number, budgetCategory = category name (match their list when possible), budgetMonth = YYYY-MM if they name a month/year else null (app will default to current month).
- Other fields can be null or sensible defaults.${hintsBlock(hints)}`;

  const jsonShape = `{"intent":"transaction"|"budget","amount":number|null,"type":"expense"|"income","category":"string","merchant":string|null,"date":"YYYY-MM-DD"|null,"description":string|null,"payment_method":string|null,"confidence":"high"|"medium"|"low","budgetCategory":string|null,"budgetLimit":number|null,"budgetMonth":"YYYY-MM"|null}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_VISION_MODEL?.trim() || "gpt-4o-mini",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: `Transcript:\n${transcript.slice(0, 4000)}\n\nReply with JSON only:\n${jsonShape}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    return { ok: false, error: `OpenAI (${res.status}): ${t.slice(0, 200)}` };
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const raw = data.choices?.[0]?.message?.content?.trim();
  if (!raw) {
    return { ok: false, error: "Empty model response." };
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const intent = parsed.intent === "budget" ? "budget" : "transaction";
    const type = parsed.type === "income" ? "income" : "expense";
    let amount: number | null = null;
    if (parsed.amount !== null && parsed.amount !== undefined && Number.isFinite(Number(parsed.amount))) {
      amount = Math.round(Number(parsed.amount) * 100) / 100;
      if (amount <= 0) amount = null;
    }
    let budgetLimit: number | null = null;
    if (parsed.budgetLimit !== null && parsed.budgetLimit !== undefined && Number.isFinite(Number(parsed.budgetLimit))) {
      budgetLimit = Math.round(Number(parsed.budgetLimit) * 100) / 100;
      if (budgetLimit <= 0) budgetLimit = null;
    }
    const budgetMonth =
      parsed.budgetMonth != null && String(parsed.budgetMonth).trim()
        ? String(parsed.budgetMonth).trim().slice(0, 7)
        : null;
    const monthOk = budgetMonth && /^\d{4}-\d{2}$/.test(budgetMonth) ? budgetMonth : null;
    const catBudget =
      parsed.budgetCategory != null ? String(parsed.budgetCategory).trim() || null : null;
    const draft: TxDraft = {
      intent,
      amount,
      type,
      category: String(parsed.category ?? "Other").trim() || "Other",
      merchant: parsed.merchant != null ? String(parsed.merchant).trim() || null : null,
      date: parsed.date != null ? String(parsed.date).trim().slice(0, 10) || null : null,
      description: parsed.description != null ? String(parsed.description).trim() || null : null,
      payment_method: parsed.payment_method != null ? String(parsed.payment_method).trim() || null : null,
      confidence: parsed.confidence === "low" || parsed.confidence === "medium" ? parsed.confidence : "high",
      budgetCategory: intent === "budget" ? catBudget : null,
      budgetLimit: intent === "budget" ? budgetLimit : null,
      budgetMonth: intent === "budget" ? monthOk : null,
    };
    return { ok: true, draft };
  } catch {
    return { ok: false, error: "Could not parse transaction from speech." };
  }
}

const hintsValidator = v.optional(
  v.object({
    expenseCategories: v.optional(v.array(v.string())),
    incomeCategories: v.optional(v.array(v.string())),
    accountNames: v.optional(v.array(v.string())),
  }),
);

/** Audio clip → text only (for chat input). */
export const transcribeUserAudio = action({
  args: {
    audioBase64: v.string(),
    mimeType: v.optional(v.string()),
    /** ISO-639-1 or "auto" — improves accuracy when speech is mostly one language */
    language: v.optional(v.string()),
    sessionToken: v.string(),
  },
  handler: async (ctx, { audioBase64, mimeType, language, sessionToken }) => {
    const g = await gateSessionAi(ctx, sessionToken);
    if (!g.ok) return { ok: false as const, error: g.error, text: "" };
    const mt = (mimeType ?? "audio/m4a").trim() || "audio/m4a";
    const tr = await whisperTranscribe(audioBase64, mt, language);
    if (!tr.ok) {
      return { ok: false as const, error: tr.error, text: "" };
    }
    return { ok: true as const, error: undefined as string | undefined, text: tr.text };
  },
});

/** Turn a spoken/typed sentence into transaction fields (no audio). */
export const parseTransactionFromSpeech = action({
  args: { text: v.string(), sessionToken: v.string(), hints: hintsValidator },
  handler: async (ctx, { text, sessionToken, hints }) => {
    const g = await gateSessionAi(ctx, sessionToken);
    if (!g.ok) return { ok: false as const, error: g.error, draft: null as TxDraft | null };
    const t = text.trim();
    if (!t) {
      return { ok: false as const, error: "Say or type what you bought.", draft: null as TxDraft | null };
    }
    const out = await openaiParseTransaction(t, hints ?? undefined);
    if (!out.ok) {
      return { ok: false as const, error: out.error, draft: null };
    }
    return { ok: true as const, error: undefined as string | undefined, draft: out.draft };
  },
});

/** Recorded clip → transcript + structured draft (Whisper + parser). */
export const voiceTransactionFromAudio = action({
  args: {
    audioBase64: v.string(),
    mimeType: v.optional(v.string()),
    language: v.optional(v.string()),
    sessionToken: v.string(),
    hints: hintsValidator,
  },
  handler: async (ctx, { audioBase64, mimeType, language, sessionToken, hints }) => {
    const g = await gateSessionAi(ctx, sessionToken);
    if (!g.ok) return { ok: false as const, error: g.error, transcript: "", draft: null as TxDraft | null };
    const mt = (mimeType ?? "audio/m4a").trim() || "audio/m4a";
    const tr = await whisperTranscribe(audioBase64, mt, language);
    if (!tr.ok) {
      return { ok: false as const, error: tr.error, transcript: "", draft: null as TxDraft | null };
    }
    const parsed = await openaiParseTransaction(tr.text, hints ?? undefined);
    if (!parsed.ok) {
      return {
        ok: false as const,
        error: parsed.error,
        transcript: tr.text,
        draft: null,
      };
    }
    return {
      ok: true as const,
      error: undefined as string | undefined,
      transcript: tr.text,
      draft: parsed.draft,
    };
  },
});

/** Chat grounded in the user’s saved transactions — organization/summary only, not financial advice. */
export const financeCoachChat = action({
  args: {
    periodLabel: v.string(),
    rows: v.array(rowValidator),
    messages: v.array(messageValidator),
    sessionToken: v.string(),
  },
  handler: async (ctx, { periodLabel, rows, messages, sessionToken }) => {
    const g = await gateSessionAi(ctx, sessionToken);
    if (!g.ok) return { ok: false as const, error: g.error, reply: "" };
    const key = requireOpenAiKey();
    if (!key) {
      return {
        ok: false as const,
        error: "Add OPENAI_API_KEY to your Convex deployment for Ask AI.",
        reply: "",
      };
    }

    const expenses = rows.filter((r) => r.type === "expense");
    const income = rows.filter((r) => r.type === "income");
    const totalExp = Math.round(expenses.reduce((s, r) => s + r.amount, 0) * 100) / 100;
    const totalInc = Math.round(income.reduce((s, r) => s + r.amount, 0) * 100) / 100;
    const byCat = new Map<string, number>();
    for (const r of expenses) {
      byCat.set(r.category, (byCat.get(r.category) ?? 0) + r.amount);
    }
    const topCats = [...byCat.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([c, a]) => ({ category: c, amount: Math.round(a * 100) / 100 }));

    const slice = expenses.slice(0, 120).map((r) => ({
      date: r.date,
      amount: r.amount,
      category: r.category,
      merchant: r.merchant,
    }));
    const stats = {
      periodLabel,
      transactionCount: rows.length,
      expenseCount: expenses.length,
      incomeCount: income.length,
      totalExpenses: totalExp,
      totalIncome: totalInc,
      topExpenseCategories: topCats,
      recentExpensesSample: slice,
    };

    const system = `You are Receipt Cycle’s in-app assistant. The user only sees summaries built from transaction rows they saved (JSON below).

Your job: help them understand and organize THEIR OWN logged data — e.g. restate totals, list expense categories by amount, describe neutral patterns in plain language, or produce a short recap of what they entered.

STRICT — you must NOT:
- Act as a financial, investment, tax, legal, or accounting advisor.
- Tell the user to cut spending, save, cancel subscriptions, choose products, or change money behavior (no “you should”, “stop wasting”, “recommend cutting”).
- Give budgeting plans, debt advice, or personal recommendations.

If they ask what to do with their money, say you only summarize or reorganize the entries they saved, not personal financial advice, and that a qualified professional can help with decisions.

Keep answers concise unless they ask for detail. Avoid long markdown tables.

Data (JSON):\n${JSON.stringify(stats).slice(0, 48000)}`;

    const recent = messages.slice(-24).map((m) => ({ role: m.role, content: m.content.slice(0, 8000) }));

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_VISION_MODEL?.trim() || "gpt-4o-mini",
        temperature: 0.4,
        messages: [{ role: "system", content: system }, ...recent],
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      return { ok: false as const, error: `OpenAI (${res.status}): ${t.slice(0, 200)}`, reply: "" };
    }

    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const reply = data.choices?.[0]?.message?.content?.trim() ?? "";
    if (!reply) {
      return { ok: false as const, error: "Empty model response.", reply: "" };
    }
    return { ok: true as const, error: undefined as string | undefined, reply };
  },
});
