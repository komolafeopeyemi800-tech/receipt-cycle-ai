"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

type Finding = { title: string; detail: string; severity: "low" | "medium" | "high" };

export const analyzeMoneyLeaks = action({
  args: {
    periodLabel: v.string(),
    sessionToken: v.string(),
    rows: v.array(
      v.object({
        date: v.string(),
        amount: v.number(),
        type: v.string(),
        category: v.string(),
        merchant: v.optional(v.string()),
        description: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, { periodLabel, rows, sessionToken }) => {
    const gate = await ctx.runQuery(internal.subscription.evaluateForAction, { token: sessionToken.trim() });
    if (!gate.ok) {
      return {
        ok: false as const,
        error: "Sign in to generate entry highlights.",
        summary: "",
        findings: [] as { title: string; detail: string; severity: "low" | "medium" | "high" }[],
        tips: [] as string[],
      };
    }
    if (!gate.canUseAiFeatures) {
      return {
        ok: false as const,
        error: gate.blockReason ?? "Upgrade to use optional entry highlights.",
        summary: "",
        findings: [] as { title: string; detail: string; severity: "low" | "medium" | "high" }[],
        tips: [] as string[],
      };
    }
    const key = process.env.OPENAI_API_KEY?.trim();
    if (!key) {
      return {
        ok: false as const,
        error: "Add OPENAI_API_KEY to your Convex deployment for optional entry highlights.",
        summary: "",
        findings: [] as Finding[],
        tips: [] as string[],
      };
    }

    const expenses = rows.filter((r) => r.type === "expense");
    const slice = expenses.slice(0, 350);
    const payload = JSON.stringify(slice);

    const system = `You scan ONLY the expense rows the user exported into this tool. Highlight POSSIBLE PATTERNS or DATA ANOMALIES so they can double-check their own records — you are not a financial advisor.

STRICT:
- Do NOT tell the user to spend less, save, invest, cancel services, or change behavior. No budgeting, debt, tax, investment, or legal guidance.
- Use neutral wording: "appears in the data", "may be worth verifying against your bank statement", "similar entries on these dates".
- "tips" must be non-advisory (e.g. "Compare with your statement if unsure") — not lifestyle or savings advice.

When evidence exists in the rows, you may note:
1) Repeated small amounts / same merchant
2) Pairs of entries that might be duplicates (similar merchant, amount, close dates)
3) Same amount on nearby dates (possible double-posting — user should verify)
4) Amounts that stand out vs the rest of THIS dataset (describe only, no "you should" fixes)

If the dataset is small or unclear, say so briefly.`;

    const user = `Period: ${periodLabel}\n\nExpense transactions (JSON, amount positive numbers):\n${payload.slice(0, 95000)}`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_VISION_MODEL?.trim() || "gpt-4o-mini",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content: `${user}\n\nReply with JSON only:
{"summary":"string","findings":[{"title":"string","detail":"string","severity":"low"|"medium"|"high"}],"tips":["string"]}`,
          },
        ],
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      return {
        ok: false as const,
        error: `OpenAI (${res.status}): ${t.slice(0, 200)}`,
        summary: "",
        findings: [] as Finding[],
        tips: [] as string[],
      };
    }

    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = data.choices?.[0]?.message?.content?.trim();
    if (!raw) {
      return { ok: false as const, error: "Empty model response.", summary: "", findings: [], tips: [] };
    }

    try {
      const parsed = JSON.parse(raw) as {
        summary?: string;
        findings?: Finding[];
        tips?: string[];
      };
      return {
        ok: true as const,
        error: undefined as string | undefined,
        summary: String(parsed.summary ?? "").trim() || "Review complete.",
        findings: Array.isArray(parsed.findings) ? parsed.findings.slice(0, 12) : [],
        tips: Array.isArray(parsed.tips) ? parsed.tips.slice(0, 8) : [],
      };
    } catch {
      return { ok: false as const, error: "Could not parse the summary.", summary: "", findings: [], tips: [] };
    }
  },
});
