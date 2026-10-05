/**
 * Ask-AI coach chat and "entry highlights" analysis. Ported from apps/mobile/convex/voiceFinance.ts
 * (financeCoachChat) and moneyLeak.ts; prompts are unchanged.
 */
import type { Env } from "../types";

export type LedgerRow = {
  date: string;
  amount: number;
  type: string;
  category: string;
  merchant?: string | null;
  description?: string | null;
};

export type ChatMessage = { role: "user" | "assistant"; content: string };
export type Finding = { title: string; detail: string; severity: "low" | "medium" | "high" };

const model = (env: Env) => env.OPENAI_VISION_MODEL?.trim() || "gpt-4o-mini";

type ChatResult = { ok: true; content: string } | { ok: false; error: string };

async function chatCompletion(env: Env, body: Record<string, unknown>): Promise<ChatResult> {
  const key = env.OPENAI_API_KEY?.trim();
  if (!key) return { ok: false, error: "missing_key" };
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: model(env), ...body }),
  });
  if (!res.ok) {
    const t = await res.text();
    return { ok: false, error: `OpenAI (${res.status}): ${t.slice(0, 200)}` };
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) return { ok: false, error: "Empty model response." };
  return { ok: true, content };
}

/** Chat grounded in the user's saved transactions: organization/summary only, not financial advice. */
export async function financeCoachChat(
  env: Env,
  args: { periodLabel: string; rows: LedgerRow[]; messages: ChatMessage[] },
): Promise<{ ok: true; reply: string } | { ok: false; error: string }> {
  if (!env.OPENAI_API_KEY?.trim()) return { ok: false, error: "Add OPENAI_API_KEY to the API Worker for Ask AI." };
  const { periodLabel, rows, messages } = args;

  const expenses = rows.filter((r) => r.type === "expense");
  const income = rows.filter((r) => r.type === "income");
  const totalExp = Math.round(expenses.reduce((s, r) => s + r.amount, 0) * 100) / 100;
  const totalInc = Math.round(income.reduce((s, r) => s + r.amount, 0) * 100) / 100;
  const byCat = new Map<string, number>();
  for (const r of expenses) byCat.set(r.category, (byCat.get(r.category) ?? 0) + r.amount);
  const topCats = [...byCat.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([c, a]) => ({ category: c, amount: Math.round(a * 100) / 100 }));
  const slice = expenses.slice(0, 120).map((r) => ({ date: r.date, amount: r.amount, category: r.category, merchant: r.merchant }));
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
  const out = await chatCompletion(env, { temperature: 0.4, messages: [{ role: "system", content: system }, ...recent] });
  return out.ok ? { ok: true, reply: out.content } : { ok: false, error: out.error };
}

export async function analyzeMoneyLeaks(
  env: Env,
  args: { periodLabel: string; rows: LedgerRow[] },
): Promise<
  | { ok: true; summary: string; findings: Finding[]; tips: string[] }
  | { ok: false; error: string }
> {
  if (!env.OPENAI_API_KEY?.trim()) {
    return { ok: false, error: "Add OPENAI_API_KEY to the API Worker for optional entry highlights." };
  }
  const expenses = args.rows.filter((r) => r.type === "expense");
  const payload = JSON.stringify(expenses.slice(0, 350));

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

  const user = `Period: ${args.periodLabel}\n\nExpense transactions (JSON, amount positive numbers):\n${payload.slice(0, 95000)}`;
  const out = await chatCompletion(env, {
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
  });
  if (!out.ok) return { ok: false, error: out.error };

  try {
    const parsed = JSON.parse(out.content) as { summary?: string; findings?: Finding[]; tips?: string[] };
    return {
      ok: true,
      summary: String(parsed.summary ?? "").trim() || "Review complete.",
      findings: Array.isArray(parsed.findings) ? parsed.findings.slice(0, 12) : [],
      tips: Array.isArray(parsed.tips) ? parsed.tips.slice(0, 8) : [],
    };
  } catch {
    return { ok: false, error: "Could not parse the summary." };
  }
}
