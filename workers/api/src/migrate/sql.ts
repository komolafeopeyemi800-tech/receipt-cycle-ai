/** Tiny SQL literal builder. Every statement is a single line so any runner can split on newlines. */

function str(s: string): string {
  const escaped = s.replace(/\0/g, "").replace(/'/g, "''");
  if (!/[\r\n]/.test(escaped)) return `'${escaped}'`;
  // Keep one statement per line: spell line breaks out with char().
  return escaped
    .split(/(\r\n|\r|\n)/)
    .filter((part) => part !== "")
    .map((part) => (part === "\n" ? "char(10)" : part === "\r" ? "char(13)" : part === "\r\n" ? "char(13) || char(10)" : `'${part}'`))
    .join(" || ");
}

export function lit(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "NULL";
  if (typeof v === "boolean") return v ? "1" : "0";
  if (typeof v === "string") return str(v);
  return str(JSON.stringify(v));
}

/** Idempotent insert: re-running the whole script never duplicates rows. */
export function insert(table: string, row: Record<string, unknown>): string {
  const cols = Object.keys(row);
  return `INSERT INTO ${table} (${cols.join(", ")}) VALUES (${cols.map((c) => lit(row[c])).join(", ")}) ON CONFLICT DO NOTHING;`;
}
