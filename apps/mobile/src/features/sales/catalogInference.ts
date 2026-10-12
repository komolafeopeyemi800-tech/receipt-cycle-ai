import type { CatalogItemKind } from "./setupData";

const productWords = /\b(product|item|unit|piece|pack|box|device|equipment|material|supply|supplies|shirt|book|food|part|component|license)\b/i;
const serviceWords = /\b(service|consult|design|development|repair|installation|maintenance|training|writing|marketing|audit|cleaning|photography|editing|support|labor|labour|hour|session)\b/i;

/** Tangible-language wins; otherwise billed work is treated as a service. */
export function inferCatalogKind(name: string, description: string): CatalogItemKind {
  const text = `${name} ${description}`;
  if (productWords.test(text)) return "product";
  if (serviceWords.test(text)) return "service";
  return "service";
}

export function normalizedCatalogName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}
