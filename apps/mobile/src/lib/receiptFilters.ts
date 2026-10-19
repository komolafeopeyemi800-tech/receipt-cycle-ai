/** Filtering receipts by category, merchant and type. Shared by the web Analysis page and the phone Analysis screen. */
export type ReceiptFilterState = { category: string; merchant: string; type: "all" | "expense" | "income" };
export const NO_FILTER: ReceiptFilterState = { category: "", merchant: "", type: "all" };

export const isFiltering = (f: ReceiptFilterState) => Boolean(f.category || f.merchant.trim() || f.type !== "all");

type Filterable = { category: string; merchant: string | null; type: string };

const sameText = (a: string | null | undefined, b: string) => (a ?? "").trim().toLowerCase() === b.trim().toLowerCase();

/** Receipts that match the category, merchant and type chosen. The merchant box matches part of a name, so "star" finds Starbucks. */
export function applyReceiptFilters<T extends Filterable>(rows: T[], f: ReceiptFilterState): T[] {
  const merchant = f.merchant.trim().toLowerCase();
  return rows.filter((t) => {
    if (f.category && !sameText(t.category, f.category)) return false;
    if (f.type !== "all" && t.type !== f.type) return false;
    if (merchant && !(t.merchant ?? "").toLowerCase().includes(merchant)) return false;
    return true;
  });
}

/** Sorted, de-duplicated names for the category and merchant pickers. */
export function filterChoices<T extends Filterable>(rows: T[]): { categories: string[]; merchants: string[] } {
  const categories = [...new Set(rows.map((t) => t.category).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const merchants = [...new Set(rows.map((t) => (t.merchant ?? "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  return { categories, merchants };
}

/** A safe file-name part from the chosen filters, e.g. "groceries-target". */
export function filterFilePrefix(f: ReceiptFilterState): string {
  const label = [f.category, f.merchant.trim()].filter(Boolean).join("-").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `receipt-cycle-${label || "filtered"}`;
}
