"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

type Finding = { title: string; detail: string; severity: "low" | "medium" | "high" };

export const analyzeMoneyLeaks = action({
  args: {
    periodLabel: v.string(),
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
  handler: async (_ctx, { periodLabel, rows }) => {
    const key = process.env.OPENAI_API_KEY?.trim();
    if (!key) {
      return {
        ok: false as const,
        error: "Add OPENAI_API_KEY to your Convex deployment for AI money-leak analysis.",
        summary: "",
        findings: [] as Finding[],
        tips: [] as string[],
      };
    }

    const expenses = rows.filter((r) => r.type === "expense");
    const slice = expenses.slice(0, 350);
    const payload = JSON.stringify(slice);

    const system = `You are a personal finance analyst. Detect MONEY LEAKS from expense transactions.

RULES — identify and explain (only when evidence exists in data):
1) Recurring monthly micro-fees (small repeated charges, same merchant)
2) Subscription duplicates (overlapping or duplicate subscriptions)
3) High transfer / wire / FX / convenience fees vs typical
4) Suspicious double charges (same amount + similar merchant + close dates)
5) Unusual spikes vs the user's usual spending in this dataset

Be specific: reference merchant/category and dates when possible. If data is sparse, say so and give general tips.`;

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
        summary: String(parsed.summary ?? "").trim() || "Analysis complete.",
        findings: Array.isArray(parsed.findings) ? parsed.findings.slice(0, 12) : [],
        tips: Array.isArray(parsed.tips) ? parsed.tips.slice(0, 8) : [],
      };
    } catch {
      return { ok: false as const, error: "Could not parse AI response.", summary: "", findings: [], tips: [] };
    }
  },
});
