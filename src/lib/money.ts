import { formatMoneyAmount } from "@mobile-lib/preferences";

/**
 * The currency the person chose under Settings. WebPreferencesProvider keeps it current, so plain functions
 * (and every page) print money the same way: chosen currency symbol and chosen digit grouping (number format).
 */
let activeCurrency = "USD";
export function setActiveCurrency(code: string) {
  activeCurrency = code && code.length === 3 ? code.toUpperCase() : "USD";
}
export const getActiveCurrency = () => activeCurrency;

/** Money in the person's currency and number format, e.g. $1,234,567.89 or ₹12,34,567.89. */
export const money = (value: number) => formatMoneyAmount(value, activeCurrency);
