/**
 * Turn backend / Convex / vendor errors into short, plain English.
 * Strips request IDs, file paths, and stack fragments users should never see.
 */

const UNCAUGHT_ERROR_PREFIX = /^Uncaught Error:\s*/i;

function stripUncaughtPrefix(s: string): string {
  let m = s.trim();
  for (let i = 0; i < 8; i++) {
    if (!UNCAUGHT_ERROR_PREFIX.test(m)) break;
    m = m.replace(UNCAUGHT_ERROR_PREFIX, "").trim();
  }
  return m;
}

/** Remove Convex / tooling noise from a single-line or short message. */
export function stripTechnicalNoise(raw: string): string {
  let m = stripUncaughtPrefix(raw);

  m = m.replace(/\s*\[?\s*Request ID\s*:\s*[^\]\n\r]+]?\s*/gi, " ");
  m = m.replace(/\bRequest ID\s*[:`]\s*[\w-]+\b/gi, " ");
  m = m.replace(/\s*at\s+handler\s+\([^)]+\)\s*/gi, " ");
  m = m.replace(/\s*at\s+[\w$.]+\s+\([^)]+\)\s*/g, " ");
  m = m.replace(/\([^)]*\.(?:ts|js|tsx):\d+:\d+\)/g, " ");
  m = m.replace(/\(\s*[\w.]+\s*:\s*[\w.]+\s*\)/g, " ");
  m = m.replace(/\bconvex[/.][\w/.-]+\b/gi, " ");
  m = m.replace(/\[CONVEX[^\]]*]/gi, " ");
  // Handler / module labels like "categories:create" or "transactions:update"
  m = m.replace(/\b[a-z][a-z0-9_]*:(?:create|update|remove|delete|insert|patch)\b/gi, " ");
  m = m.replace(/\s+/g, " ").trim();

  return m;
}

function looksLikeTechnicalGarbage(m: string): boolean {
  if (!m) return true;
  const lower = m.toLowerCase();
  if (lower.includes("argumentvalidation") || lower.includes("value does not match validator")) return true;
  if (lower.includes("functionreturnvalidator") || lower.includes("returnsvalidator")) return true;
  if (/\[CONVEX|^Server Error$/i.test(m)) return true;
  if (m.length > 320) return true;
  if (/^[\s;:,[\]{}0-9a-f-]{30,}$/i.test(m) && /[;[\]{}]/.test(m)) return true;
  return false;
}

function mapKnownMessage(m: string): string | null {
  const lower = m.toLowerCase();

  if (/openai_api_key|add openai_api_key to your convex/i.test(lower)) {
    return "Smart fill is temporarily unavailable. Try again later, or type the transaction yourself.";
  }
  if (/^\s*openai\s*\(/i.test(m) || /empty model response/i.test(lower)) {
    return "The assistant hit a temporary issue. Try again in a moment, or enter details manually.";
  }
  if (/whisper\s*\(/i.test(m) || /could not transcribe audio/i.test(lower)) {
    return "We couldn’t hear that clearly. Try recording again or type what you bought.";
  }
  if (/could not parse transaction from speech|could not parse/i.test(lower) && /speech|json|model/i.test(lower)) {
    return "We couldn’t turn that into a transaction. Include an amount and store (or category), or fill the form below.";
  }
  if (/say or type what you bought/i.test(lower)) {
    return "Say or type what you spent and where — for example: “12 dollars coffee at Starbucks.”";
  }
  if (/sign in to use/i.test(lower)) {
    return null;
  }
  if (/category name required/i.test(lower)) {
    return "Add or choose a category, then try again.";
  }
  if (
    /categories?\s*[:.]\s*create|categories?:create|mutation.*categor/i.test(lower) ||
    (/category/i.test(lower) && /required|missing|must (?:be )?provide|cannot be empty/i.test(lower))
  ) {
    return "We need a category for this. Pick one from the list, add a category, or enter the transaction manually.";
  }
  if (
    (/vendor|merchant|store/i.test(lower) && /required|missing|must (?:be )?provide|cannot be empty/i.test(lower)) ||
    /no merchant|merchant not/i.test(lower)
  ) {
    return "We couldn’t tell where you spent this. Say or type the store name, or fill it in on the form.";
  }
  if (/category with this name already exists/i.test(lower)) {
    return "You already have a category with that name. Pick it from the list or use a different name.";
  }
  if (/upgrade to pro|trial ended|active trial/i.test(lower)) {
    return null;
  }
  if (/no data returned|check convex|expo_public_convex|openrouter|gemini quota/i.test(lower)) {
    return "We couldn’t read that document. Check your connection and try again. If it keeps failing, try later or enter the details manually.";
  }

  return null;
}

/**
 * Customer-safe message for tooltips, alerts, and inline errors.
 */
export function userFacingError(raw: string | undefined | null): string {
  const m0 = (raw ?? "").trim();
  if (!m0) return "Something went wrong. Please try again.";

  const mappedEarly = mapKnownMessage(m0);
  if (mappedEarly) return mappedEarly;

  let m = stripTechnicalNoise(m0);
  const mapped = mapKnownMessage(m);
  if (mapped) return mapped;

  if (looksLikeTechnicalGarbage(m)) {
    return "Something went wrong on our side. Please try again, or enter the transaction manually.";
  }

  if (m.length > 220) {
    return "Something went wrong. Please try again, or fill the form manually.";
  }

  return m;
}

export function userFacingErrorFromUnknown(err: unknown): string {
  if (err instanceof Error) return userFacingError(err.message);
  if (typeof err === "object" && err !== null && "message" in err) {
    const msg = (err as { message: unknown }).message;
    if (typeof msg === "string") return userFacingError(msg);
  }
  return userFacingError(null);
}
