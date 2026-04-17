import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexProvider } from "convex/react";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { convex } from "@/lib/convex";
import { AppRouteFallback } from "@/components/AppRouteFallback";
import { WebAuthProvider } from "@/contexts/WebAuthContext";
import { WebPreferencesProvider } from "@/contexts/WebPreferencesContext";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import RequireCompleteWebOnboarding from "@/components/RequireCompleteWebOnboarding";
import MarketingLanding from "./pages/MarketingLanding";

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
const WebWhopCallback = lazy(() => import("./pages/WebWhopCallback"));
const WebForgotPassword = lazy(() => import("./pages/WebForgotPassword"));
const WebResetPassword = lazy(() => import("./pages/WebResetPassword"));
const ConvexDashboard = lazy(() => import("./pages/ConvexDashboard"));
const ConvexTransactions = lazy(() => import("./pages/ConvexTransactions"));
const ConvexInsights = lazy(() => import("./pages/ConvexInsights"));
const ConvexBudgets = lazy(() => import("./pages/ConvexBudgets"));
const ConvexAccounts = lazy(() => import("./pages/ConvexAccounts"));
const ConvexCategories = lazy(() => import("./pages/ConvexCategories"));
const ConvexUploadStatement = lazy(() => import("./pages/ConvexUploadStatement"));
const ConvexSettings = lazy(() => import("./pages/ConvexSettings"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const CheckoutReturn = lazy(() => import("./pages/CheckoutReturn"));

/** Admin console only — requires Convex. */
const Admin = lazy(() => import("./pages/Admin"));

const queryClient = new QueryClient();

/** Static marketing shell — no Convex; landing and redirects only. */
function PublicShell() {
  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Outlet />
    </TooltipProvider>
  );
}

/** Web auth + signed-in app — Convex, session, preferences (same backend as mobile). */
function WebAuthShell() {
  return (
    <ConvexProvider client={convex}>
      <QueryClientProvider client={queryClient}>
        <WebAuthProvider>
          <WebPreferencesProvider>
            <WorkspaceProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <Suspense fallback={<AppRouteFallback />}>
                  <Outlet />
                </Suspense>
              </TooltipProvider>
            </WorkspaceProvider>
          </WebPreferencesProvider>
        </WebAuthProvider>
      </QueryClientProvider>
    </ConvexProvider>
  );
}

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route
        path="/admin"
        element={
          <ConvexProvider client={convex}>
            <QueryClientProvider client={queryClient}>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <Suspense fallback={<AppRouteFallback />}>
                  <Admin />
                </Suspense>
              </TooltipProvider>
            </QueryClientProvider>
          </ConvexProvider>
        }
      />
      <Route element={<WebAuthShell />}>
        <Route path="/signin" element={<WebSignIn />} />
        <Route path="/signup" element={<WebSignUp />} />
        <Route path="/oauth/whop" element={<WebWhopCallback />} />
        <Route path="/api/auth/callback/whop" element={<WebWhopCallback />} />
        <Route path="/api/auth/callback" element={<WebWhopCallback />} />
        <Route path="/auth/callback" element={<WebWhopCallback />} />
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
          <Route path="/transactions" element={<ConvexTransactions />} />
          <Route path="/insights" element={<ConvexInsights />} />
          <Route path="/budgets" element={<ConvexBudgets />} />
          <Route path="/accounts" element={<ConvexAccounts />} />
          <Route path="/categories" element={<ConvexCategories />} />
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
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  </BrowserRouter>
);

export default App;
