import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { ApiProvider } from "@mobile-lib/api";
import { apiClient } from "@/lib/api";
import { AppRouteFallback } from "@/components/AppRouteFallback";
import { WebAuthProvider } from "@/contexts/WebAuthContext";
import { WebPreferencesProvider } from "@/contexts/WebPreferencesContext";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import RequireCompleteWebOnboarding from "@/components/RequireCompleteWebOnboarding";
import MarketingLanding from "./pages/MarketingLanding";
import { DesktopBusinessProvider } from "@/contexts/DesktopBusinessContext";

const PrivacyPolicy = lazy(() => import("./pages/legal/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/legal/TermsOfService"));
const Impressum = lazy(() => import("./pages/legal/Impressum"));
const CookiePolicy = lazy(() => import("./pages/legal/CookiePolicy"));
const CookieSettings = lazy(() => import("./pages/legal/CookieSettings"));
const DoNotSell = lazy(() => import("./pages/legal/DoNotSell"));
const Contact = lazy(() => import("./pages/legal/Contact"));
const RefundPolicy = lazy(() => import("./pages/legal/RefundPolicy"));
const FaqPage = lazy(() => import("./pages/FaqPage"));
const WebSignIn = lazy(() => import("./pages/WebSignIn"));
const WebSignUp = lazy(() => import("./pages/WebSignUp"));
const WebForgotPassword = lazy(() => import("./pages/WebForgotPassword"));
const WebResetPassword = lazy(() => import("./pages/WebResetPassword"));
const ConvexDashboard = lazy(() => import("./pages/ConvexDashboard"));
const TransactionWorkspace = lazy(() => import("./pages/TransactionWorkspace"));
const ConvexInsights = lazy(() => import("./pages/ConvexInsights"));
const ConvexBudgets = lazy(() => import("./pages/ConvexBudgets"));
const ConvexAccounts = lazy(() => import("./pages/ConvexAccounts"));
const ConvexCategories = lazy(() => import("./pages/ConvexCategories"));
const ConvexUploadStatement = lazy(() => import("./pages/ConvexUploadStatement"));
const ConvexSettings = lazy(() => import("./pages/ConvexSettings"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const CheckoutReturn = lazy(() => import("./pages/CheckoutReturn"));
const About = lazy(() => import("./pages/About"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const InvoiceSoftwareLanding = lazy(() => import("./pages/InvoiceSoftwareLanding"));
const EstimateQuotationSoftwareLanding = lazy(() => import("./pages/EstimateQuotationSoftwareLanding"));
const PaymentTrackingSoftwareLanding = lazy(() => import("./pages/PaymentTrackingSoftwareLanding"));
const AiReceiptScannerLanding = lazy(() => import("./pages/AiReceiptScannerLanding"));
const BusinessTravelExpenseTrackerLanding = lazy(() => import("./pages/BusinessTravelExpenseTrackerLanding"));
const FreelancerTaxReceiptTrackerLanding = lazy(() => import("./pages/FreelancerTaxReceiptTrackerLanding"));
const BusinessBudgetingSoftwareLanding = lazy(() => import("./pages/BusinessBudgetingSoftwareLanding"));
const ClientManagementSoftwareLanding = lazy(() => import("./pages/ClientManagementSoftwareLanding"));
const ExpenseReportingSoftwareLanding = lazy(() => import("./pages/ExpenseReportingSoftwareLanding"));
const AiFinancialAssistantLanding = lazy(() => import("./pages/AiFinancialAssistantLanding"));
const SalesAnalytics = lazy(() => import("./pages/PremiumSalesWorkspaces").then((module) => ({ default: module.SalesAnalyticsPage })));
const Customers = lazy(() => import("./pages/PremiumSalesWorkspaces").then((module) => ({ default: module.CustomersPage })));
const ItemsServices = lazy(() => import("./pages/PremiumSalesWorkspaces").then((module) => ({ default: module.ItemsServicesPage })));
const BusinessProfile = lazy(() => import("./pages/PremiumSalesWorkspaces").then((module) => ({ default: module.BusinessProfilePage })));
const InvoiceSettings = lazy(() => import("./pages/PremiumSalesWorkspaces").then((module) => ({ default: module.InvoiceSettingsPage })));
const Invoices = lazy(() => import("./pages/PremiumDocumentWorkspaces").then((module) => ({ default: module.InvoicesPage })));
const Estimates = lazy(() => import("./pages/PremiumDocumentWorkspaces").then((module) => ({ default: module.EstimatesPage })));
const Payments = lazy(() => import("./pages/PremiumDocumentWorkspaces").then((module) => ({ default: module.PaymentsPage })));
const ReportsHome = lazy(() => import("./pages/PremiumOperationsWorkspaces").then((module) => ({ default: module.ReportsHomePage })));
const CashFlowReport = lazy(() => import("./pages/PremiumOperationsWorkspaces").then((module) => ({ default: module.CashFlowReportPage })));
const OverdueInvoices = lazy(() => import("./pages/PremiumOperationsWorkspaces").then((module) => ({ default: module.OverdueInvoicesPage })));
const AiAssistant = lazy(() => import("./pages/PremiumOperationsWorkspaces").then((module) => ({ default: module.AiAssistantPage })));
const Notifications = lazy(() => import("./pages/PremiumOperationsWorkspaces").then((module) => ({ default: module.NotificationsPage })));
const Subscription = lazy(() => import("./pages/PremiumOperationsWorkspaces").then((module) => ({ default: module.SubscriptionPage })));
const ProfileSecurity = lazy(() => import("./pages/PremiumOperationsWorkspaces").then((module) => ({ default: module.ProfileSecurityPage })));
const MoreSettings = lazy(() => import("./pages/PremiumOperationsWorkspaces").then((module) => ({ default: module.MoreSettingsPage })));

/** Admin console only. */
const Admin = lazy(() => import("./pages/Admin"));

const queryClient = new QueryClient();

/** Static marketing shell — no backend calls; landing and redirects only. */
function PublicShell() {
  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Outlet />
    </TooltipProvider>
  );
}

/** Web auth + signed-in app — API session, preferences (same backend as mobile). */
function WebAuthShell() {
  return (
    <QueryClientProvider client={queryClient}>
      <ApiProvider client={apiClient}>
        <WebAuthProvider>
          <WebPreferencesProvider>
            <WorkspaceProvider>
              <DesktopBusinessProvider>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <Suspense fallback={<AppRouteFallback />}>
                    <Outlet />
                  </Suspense>
                </TooltipProvider>
              </DesktopBusinessProvider>
            </WorkspaceProvider>
          </WebPreferencesProvider>
        </WebAuthProvider>
      </ApiProvider>
    </QueryClientProvider>
  );
}

const App = () => (
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <Routes>
      <Route
        path="/admin"
        element={
          <QueryClientProvider client={queryClient}>
            <ApiProvider client={apiClient}>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <Suspense fallback={<AppRouteFallback />}>
                  <Admin />
                </Suspense>
              </TooltipProvider>
            </ApiProvider>
          </QueryClientProvider>
        }
      />
      <Route element={<WebAuthShell />}>
        <Route path="/signin" element={<WebSignIn />} />
        <Route path="/signup" element={<WebSignUp />} />
        <Route path="/forgot-password" element={<WebForgotPassword />} />
        <Route path="/reset-password" element={<WebResetPassword />} />
        <Route path="/checkout-return" element={<CheckoutReturn />} />
        <Route
          path="/onboarding"
          element={
            <Suspense fallback={<AppRouteFallback />}>
              <Onboarding />
            </Suspense>
          }
        />
        <Route element={<RequireCompleteWebOnboarding />}>
          <Route path="/dashboard" element={<ConvexDashboard />} />
          <Route path="/transactions" element={<TransactionWorkspace />} />
          <Route path="/insights" element={<ConvexInsights />} />
          <Route path="/budgets" element={<ConvexBudgets />} />
          <Route path="/accounts" element={<ConvexAccounts />} />
          <Route path="/categories" element={<ConvexCategories />} />
          <Route path="/sales" element={<SalesAnalytics />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/items-services" element={<ItemsServices />} />
          <Route path="/business-profile" element={<BusinessProfile />} />
          <Route path="/invoice-settings" element={<InvoiceSettings />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/estimates" element={<Estimates />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/reports" element={<ReportsHome />} />
          <Route path="/reports/cash-flow" element={<CashFlowReport />} />
          <Route path="/reports/overdue" element={<OverdueInvoices />} />
          <Route path="/ai-assistant" element={<AiAssistant />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/profile" element={<ProfileSecurity />} />
          <Route path="/more" element={<MoreSettings />} />
          <Route path="/upload-statement" element={<ConvexUploadStatement />} />
          <Route path="/settings" element={<ConvexSettings />} />
          <Route path="/pricing" element={<Pricing />} />
        </Route>
      </Route>
      <Route element={<PublicShell />}>
        <Route path="/" element={<MarketingLanding />} />
        <Route
          element={
            <Suspense fallback={<AppRouteFallback />}>
              <Outlet />
            </Suspense>
          }
        >
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/impressum" element={<Impressum />} />
          <Route path="/cookies" element={<CookiePolicy />} />
          <Route path="/cookie-settings" element={<CookieSettings />} />
          <Route path="/do-not-sell" element={<DoNotSell />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/invoice-software" element={<InvoiceSoftwareLanding />} />
          <Route path="/estimate-quotation-software" element={<EstimateQuotationSoftwareLanding />} />
          <Route path="/payment-tracking-software" element={<PaymentTrackingSoftwareLanding />} />
          <Route path="/ai-receipt-scanner" element={<AiReceiptScannerLanding />} />
          <Route path="/business-travel-expense-tracker" element={<BusinessTravelExpenseTrackerLanding />} />
          <Route path="/freelancer-tax-receipt-tracker" element={<FreelancerTaxReceiptTrackerLanding />} />
          <Route path="/business-budgeting-software" element={<BusinessBudgetingSoftwareLanding />} />
          <Route path="/client-management-software" element={<ClientManagementSoftwareLanding />} />
          <Route path="/expense-reporting-software" element={<ExpenseReportingSoftwareLanding />} />
          <Route path="/ai-financial-assistant" element={<AiFinancialAssistantLanding />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  </BrowserRouter>
);

export default App;
