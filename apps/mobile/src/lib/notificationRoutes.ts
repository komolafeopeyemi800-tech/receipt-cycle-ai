import { navigationRef } from "../../App";

type Target = { name: string; params?: object };
const TABS: Record<string, string[]> = {
  home: ["Main", "Home"], transactions: ["Main", "Records"], insights: ["Main", "Analysis"], reports: ["Main", "Sales", "SalesReports"], invoices: ["Main", "Sales", "SalesInvoices"],
  budgets: ["Main", "More", "Budgets"],
};
const SCREENS: Record<string, Target> = {
  scan: { name: "ScanReceipt" }, add: { name: "AddTransaction" }, invoice_new: { name: "InvoiceCreate" }, budget_new: { name: "BudgetSet" }, export: { name: "UploadStatement" },
};

/** Opens the screen a notification points at. Unknown names fall back to the app's home screen. */
export function openNotificationRoute(route: unknown) {
  if (typeof route !== "string" || !navigationRef.isReady()) return;
  const nav = navigationRef as unknown as { navigate: (name: string, params?: object) => void };
  const screen = SCREENS[route];
  if (screen) return nav.navigate(screen.name, screen.params);
  const path = TABS[route] ?? (route === "voice" || route === "coach" ? TABS.home : null);
  if (!path) return;
  const [, tab, inner] = path;
  nav.navigate("Main", inner ? { screen: tab, params: { screen: inner } } : { screen: tab });
}
