import { lazy, Suspense } from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppRouteFallback } from "@/components/AppRouteFallback";
import { LEGACY_BLOG_ROUTES } from "@/content/legacyBlogRoutes";

// Literal imports let Vite split public pages from the signed-in application.
export const publicPageDefinitions = [
  { path: "/", module: "src/pages/MarketingLanding.tsx", load: () => import("./pages/MarketingLanding") },
  { path: "/about", module: "src/pages/About.tsx", load: () => import("./pages/About") },
  { path: "/blog", module: "src/pages/Blog.tsx", load: () => import("./pages/Blog") },
  { path: "/blog/:slug", module: "src/pages/BlogPost.tsx", load: () => import("./pages/BlogPost") },
  { path: "/pricing", module: "src/pages/PublicPricing.tsx", load: () => import("./pages/PublicPricing") },
  { path: "/faq", module: "src/pages/FaqPage.tsx", load: () => import("./pages/FaqPage") },
  { path: "/contact", module: "src/pages/legal/Contact.tsx", load: () => import("./pages/legal/Contact") },
  { path: "/privacy", module: "src/pages/legal/PrivacyPolicy.tsx", load: () => import("./pages/legal/PrivacyPolicy") },
  { path: "/delete-account", module: "src/pages/legal/DeleteAccount.tsx", load: () => import("./pages/legal/DeleteAccount") },
  { path: "/terms", module: "src/pages/legal/TermsOfService.tsx", load: () => import("./pages/legal/TermsOfService") },
  { path: "/refund-policy", module: "src/pages/legal/RefundPolicy.tsx", load: () => import("./pages/legal/RefundPolicy") },
  { path: "/cookies", module: "src/pages/legal/CookiePolicy.tsx", load: () => import("./pages/legal/CookiePolicy") },
  { path: "/impressum", module: "src/pages/legal/Impressum.tsx", load: () => import("./pages/legal/Impressum") },
  { path: "/cookie-settings", module: "src/pages/legal/CookieSettings.tsx", load: () => import("./pages/legal/CookieSettings") },
  { path: "/do-not-sell", module: "src/pages/legal/DoNotSell.tsx", load: () => import("./pages/legal/DoNotSell") },
  { path: "/invoice-software", module: "src/pages/InvoiceSoftwareLanding.tsx", load: () => import("./pages/InvoiceSoftwareLanding") },
  { path: "/estimate-quotation-software", module: "src/pages/EstimateQuotationSoftwareLanding.tsx", load: () => import("./pages/EstimateQuotationSoftwareLanding") },
  { path: "/payment-tracking-software", module: "src/pages/PaymentTrackingSoftwareLanding.tsx", load: () => import("./pages/PaymentTrackingSoftwareLanding") },
  { path: "/ai-receipt-scanner", module: "src/pages/AiReceiptScannerLanding.tsx", load: () => import("./pages/AiReceiptScannerLanding") },
  { path: "/business-travel-expense-tracker", module: "src/pages/BusinessTravelExpenseTrackerLanding.tsx", load: () => import("./pages/BusinessTravelExpenseTrackerLanding") },
  { path: "/freelancer-tax-receipt-tracker", module: "src/pages/FreelancerTaxReceiptTrackerLanding.tsx", load: () => import("./pages/FreelancerTaxReceiptTrackerLanding") },
  { path: "/business-budgeting-software", module: "src/pages/BusinessBudgetingSoftwareLanding.tsx", load: () => import("./pages/BusinessBudgetingSoftwareLanding") },
  { path: "/client-management-software", module: "src/pages/ClientManagementSoftwareLanding.tsx", load: () => import("./pages/ClientManagementSoftwareLanding") },
  { path: "/expense-reporting-software", module: "src/pages/ExpenseReportingSoftwareLanding.tsx", load: () => import("./pages/ExpenseReportingSoftwareLanding") },
  { path: "/ai-financial-assistant", module: "src/pages/AiFinancialAssistantLanding.tsx", load: () => import("./pages/AiFinancialAssistantLanding") },
];

const pages = publicPageDefinitions.map(definition => ({ ...definition, Component: lazy(definition.load) }));
const NotFoundSeo = lazy(() => import("./components/NotFoundSeo"));

function LegacyRedirect({ to }: { to: string }) {
  const { search, hash } = useLocation();
  return <Navigate to={`${to}${search}${hash}`} replace />;
}

function NotFound() {
  return <><NotFoundSeo /><main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-6 px-6 text-center text-slate-900"><h1 className="font-display text-4xl font-bold">Page not found</h1><p>This page may have moved. Explore Receipt Cycle from the home page.</p><Link className="font-semibold text-teal-700 underline" to="/">Go to the home page</Link></main></>;
}

export default function PublicApp() {
  return <TooltipProvider><Toaster /><Sonner /><Suspense fallback={<AppRouteFallback />}><Routes>
    {Object.entries(LEGACY_BLOG_ROUTES).map(([from, to]) => <Route key={from} path={from} element={<LegacyRedirect to={to} />} />)}
    {pages.map(({ path, Component }) => <Route key={path} path={path} element={<Component />} />)}
    <Route path="*" element={<NotFound />} />
  </Routes></Suspense></TooltipProvider>;
}
