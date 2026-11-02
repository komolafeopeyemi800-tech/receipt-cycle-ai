import { lazy, Suspense } from "react";
import { BrowserRouter, useLocation } from "react-router-dom";
import { AppRouteFallback } from "@/components/AppRouteFallback";
import { isPrivatePath } from "@/content/routePaths";
import PublicApp from "./PublicApp";

const PrivateApp = lazy(() => import("./PrivateApp"));

export function AppRoutes() {
  const { pathname } = useLocation();
  return isPrivatePath(pathname)
    ? <Suspense fallback={<AppRouteFallback />}><PrivateApp /></Suspense>
    : <PublicApp />;
}

export default function App() {
  return <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><AppRoutes /></BrowserRouter>;
}
