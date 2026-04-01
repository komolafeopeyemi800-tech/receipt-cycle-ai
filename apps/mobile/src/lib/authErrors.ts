/**
 * Surface Convex action errors as readable, user-facing strings.
 */
export function formatAuthError(err: unknown): string {
  if (err instanceof Error) {
    let m = err.message.trim();
    // Convex / network wrappers sometimes prefix the real message
    const uncaught = /^Uncaught Error:\s*/i;
    if (uncaught.test(m)) m = m.replace(uncaught, "").trim();
    if (m.length > 0) return m;
  }
  if (typeof err === "object" && err !== null && "message" in err) {
    const msg = (err as { message: unknown }).message;
    if (typeof msg === "string" && msg.trim()) return msg.trim();
  }
  return "Something went wrong. Please try again.";
}
