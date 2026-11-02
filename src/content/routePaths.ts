/** Lightweight route facts shared by the client entry and canonical edge router. */
export const PRIVATE_ROUTE_PATHS: readonly string[] = [
  "/signin", "/signup", "/forgot-password", "/reset-password", "/checkout-return", "/onboarding",
  "/dashboard", "/transactions", "/insights", "/budgets", "/accounts", "/categories", "/sales",
  "/customers", "/items-services", "/business-profile", "/invoice-settings", "/invoices", "/estimates",
  "/payments", "/reports", "/reports/cash-flow", "/reports/overdue", "/ai-assistant", "/notifications",
  "/subscription", "/profile", "/more", "/upload-statement", "/settings", "/backup-export", "/admin",
];

export function isPrivatePath(path: string): boolean {
  return PRIVATE_ROUTE_PATHS.includes(path.replace(/\/+$/, "") || "/");
}
