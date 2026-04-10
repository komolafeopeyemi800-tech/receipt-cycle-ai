import type { DocTx } from "../types/transaction";

/** 2-decimal currency rounding — use for displayed totals */
export function roundMoney(n: number) {
  return Math.round(n * 100) / 100;
}

/** Calendar date in the user's local timezone as `YYYY-MM-DD` (avoid `toISOString()` UTC shifts). */
export function toLocalISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function monthRangeISO() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { startStr: toLocalISODate(start), endStr: toLocalISODate(end) };
}

function txKind(type: string): "income" | "expense" | "other" {
  const k = type.trim().toLowerCase();
  if (k === "income") return "income";
  if (k === "expense") return "expense";
  return "other";
}

export function filterByMonth(transactions: DocTx[]) {
  const { startStr, endStr } = monthRangeISO();
  return transactions.filter((t) => t.date >= startStr && t.date <= endStr);
}

/** Current calendar month as `YYYY-MM` */
export function todayYm(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Shift `YYYY-MM` by whole months */
export function addMonthsYm(ym: string, delta: number): string {
  const [y, m] = ym.split("-").map((x) => parseInt(x, 10));
  if (!Number.isFinite(y) || !Number.isFinite(m)) return todayYm();
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** e.g. "March 2026" */
export function formatMonthYearLabel(ym: string): string {
  const [y, m] = ym.split("-").map((x) => parseInt(x, 10));
  if (!Number.isFinite(y) || !Number.isFinite(m)) return ym;
  const d = new Date(y, m - 1, 1);
  return d.toLocaleString(undefined, { month: "long", year: "numeric" });
}

/** `ym` = "YYYY-MM" → inclusive calendar bounds */
export function ymToDateRange(ym: string): { start: string; end: string } {
  const [y, m] = ym.split("-").map((x) => parseInt(x, 10));
  if (!Number.isFinite(y) || !Number.isFinite(m)) {
    const { startStr, endStr } = monthRangeISO();
    return { start: startStr, end: endStr };
  }
  const start = `${y}-${String(m).padStart(2, "0")}-01`;
  const last = new Date(y, m, 0).getDate();
  const end = `${y}-${String(m).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
  return { start, end };
}

/** Sum expense amounts per category for dates in [start, end] inclusive (YYYY-MM-DD). */
export function expenseTotalsByCategory(transactions: DocTx[], start: string, end: string) {
  const map = new Map<string, number>();
  for (const t of transactions) {
    if (txKind(t.type) !== "expense") continue;
    if (t.date < start || t.date > end) continue;
    const prev = map.get(t.category) ?? 0;
    map.set(t.category, roundMoney(prev + Math.abs(t.amount)));
  }
  return map;
}

export function buildSummary(transactions: DocTx[]) {
  const totalIncome = roundMoney(
    transactions.filter((t) => txKind(t.type) === "income").reduce((s, t) => s + Math.abs(t.amount), 0),
  );
  const totalExpenses = roundMoney(
    transactions.filter((t) => txKind(t.type) === "expense").reduce((s, t) => s + Math.abs(t.amount), 0),
  );
  const netBalance = roundMoney(totalIncome - totalExpenses);
  const savingsRate = totalIncome > 0 ? roundMoney((netBalance / totalIncome) * 100) : null;
  const categoryMap = new Map<string, { amount: number; count: number }>();
  transactions
    .filter((t) => txKind(t.type) === "expense")
    .forEach((t) => {
      const cur = categoryMap.get(t.category) || { amount: 0, count: 0 };
      categoryMap.set(t.category, {
        amount: roundMoney(cur.amount + Math.abs(t.amount)),
        count: cur.count + 1,
      });
    });
  const categoryBreakdown = Array.from(categoryMap.entries())
    .map(([category, data]) => ({ category, ...data }))
    .sort((a, b) => b.amount - a.amount);
  return {
    totalIncome,
    totalExpenses,
    netBalance,
    savingsRate,
    transactionCount: transactions.length,
    categoryBreakdown,
  };
}
