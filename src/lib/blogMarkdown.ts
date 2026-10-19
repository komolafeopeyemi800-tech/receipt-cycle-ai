/**
 * Tiny inline-markdown helpers for blog copy: only [label](href) links are supported.
 * Framework-free (no React) so routesSeo.ts and the build scripts can use it.
 */

export interface InlineLink {
  label: string;
  href: string;
}

const LINK_RE = /\[([^\]]+)\]\(([^)\s]+)\)/g;

export type InlineToken = { type: "text"; text: string } | { type: "link"; label: string; href: string };

/** Split text into plain text and [label](href) link tokens. */
export function tokenizeInline(text: string): InlineToken[] {
  const out: InlineToken[] = [];
  let last = 0;
  for (const m of text.matchAll(LINK_RE)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push({ type: "text", text: text.slice(last, idx) });
    out.push({ type: "link", label: m[1], href: m[2] });
    last = idx + m[0].length;
  }
  if (last < text.length) out.push({ type: "text", text: text.slice(last) });
  return out;
}

/** Visible text only: "[label](href)" becomes "label". */
export function stripInlineLinks(text: string): string {
  return text.replace(LINK_RE, "$1");
}

export function extractInlineLinks(text: string): InlineLink[] {
  return Array.from(text.matchAll(LINK_RE), (m) => ({ label: m[1], href: m[2] }));
}

export function isInternalHref(href: string): boolean {
  return href.startsWith("/") && !href.startsWith("//");
}

export function hostnameOf(href: string): string {
  if (isInternalHref(href)) return "receiptcycle.com";
  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return href;
  }
}
