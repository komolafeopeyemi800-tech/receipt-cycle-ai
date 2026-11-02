import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, Route, Routes } from "react-router-dom";
import { PrivateRouteSeo } from "@/components/Seo";
import { ApiProvider } from "@mobile-lib/api";
import { apiClient } from "@/lib/api";
import { AppRouteFallback } from "@/components/AppRouteFallback";
import { WebAuthProvider } from "@/contexts/WebAuthContext";
import { WebPreferencesProvider } from "@/contexts/WebPreferencesContext";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import RequireCompleteWebOnboarding from "@/components/RequireCompleteWebOnboarding";

import { DesktopBusinessProvider } from "@/contexts/DesktopBusinessContext";

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
const BackupExport = lazy(() => import("./pages/BackupExport"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const CheckoutReturn = lazy(() => import("./pages/CheckoutReturn"));
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

/** Web auth + signed-in app â€” API session, preferences (same backend as mobile). */
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

const PrivateApp = () => (
  <>
    <PrivateRouteSeo />
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
          <Route path="/backup-export" element={<BackupExport />} />
        </Route>
      </Route>
    </Routes>
  </>
);

export default PrivateApp;
