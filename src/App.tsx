import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexProvider } from "convex/react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { convex } from "@/lib/convex";
import { AppRouteFallback } from "@/components/AppRouteFallback";
import ConvexHome from "./pages/ConvexHome";
import WebSignIn from "./pages/WebSignIn";
import WebSignUp from "./pages/WebSignUp";
import { WorkspaceProvider } from "./contexts/WorkspaceContext";
import { WebAuthProvider } from "./contexts/WebAuthContext";
import { WebPreferencesProvider } from "./contexts/WebPreferencesContext";

/**
 * App routes (dashboard, records, etc.) — each wrapped in its own Suspense so the
 * `/` landing bundle never pulls in ConvexDashboard or AppChrome until navigation.
 * Pricing is also lazy so ResponsiveLayout/DesktopNav stay off the home chunk.
 */
const Pricing = lazy(() => import("./pages/Pricing"));
const ConvexDashboard = lazy(() => import("./pages/ConvexDashboard"));
const ConvexTransactions = lazy(() => import("./pages/ConvexTransactions"));
const ConvexUploadStatement = lazy(() => import("./pages/ConvexUploadStatement"));
const ConvexSettings = lazy(() => import("./pages/ConvexSettings"));
const ConvexBudgets = lazy(() => import("./pages/ConvexBudgets"));
const ConvexInsights = lazy(() => import("./pages/ConvexInsights"));
const ConvexAccounts = lazy(() => import("./pages/ConvexAccounts"));
const ConvexCategories = lazy(() => import("./pages/ConvexCategories"));
const Admin = lazy(() => import("./pages/Admin"));

const queryClient = new QueryClient();

const App = () => (
  <ConvexProvider client={convex}>
    <WebAuthProvider>
      <WebPreferencesProvider>
      <WorkspaceProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<ConvexHome />} />
                <Route
                  path="/pricing"
                  element={
                    <Suspense fallback={<AppRouteFallback />}>
                      <Pricing />
                    </Suspense>
                  }
                />
                <Route path="/signin" element={<WebSignIn />} />
                <Route path="/signup" element={<WebSignUp />} />

                <Route
                  path="/dashboard"
                  element={
                    <Suspense fallback={<AppRouteFallback />}>
                      <ConvexDashboard />
                    </Suspense>
                  }
                />
                <Route
                  path="/insights"
                  element={
                    <Suspense fallback={<AppRouteFallback />}>
                      <ConvexInsights />
                    </Suspense>
                  }
                />
                <Route
                  path="/budgets"
                  element={
                    <Suspense fallback={<AppRouteFallback />}>
                      <ConvexBudgets />
                    </Suspense>
                  }
                />
                <Route
                  path="/accounts"
                  element={
                    <Suspense fallback={<AppRouteFallback />}>
                      <ConvexAccounts />
                    </Suspense>
                  }
                />
                <Route
                  path="/categories"
                  element={
                    <Suspense fallback={<AppRouteFallback />}>
                      <ConvexCategories />
                    </Suspense>
                  }
                />
                <Route
                  path="/transactions"
                  element={
                    <Suspense fallback={<AppRouteFallback />}>
                      <ConvexTransactions />
                    </Suspense>
                  }
                />
                <Route
                  path="/upload-statement"
                  element={
                    <Suspense fallback={<AppRouteFallback />}>
                      <ConvexUploadStatement />
                    </Suspense>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <Suspense fallback={<AppRouteFallback />}>
                      <ConvexSettings />
                    </Suspense>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <Suspense fallback={<AppRouteFallback />}>
                      <Admin />
                    </Suspense>
                  }
                />

                <Route path="*" element={<ConvexHome />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </WorkspaceProvider>
      </WebPreferencesProvider>
    </WebAuthProvider>
  </ConvexProvider>
);

export default App;
