import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Onboarding from "./pages/Onboarding";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import AddTransaction from "./pages/AddTransaction";
import Transaction from "./pages/Transaction";
import Insight from "./pages/Insight";
import Pricing from "./pages/Pricing";
import Setting from "./pages/Setting";
import Notification from "./pages/Notification";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/add-transaction" element={<AddTransaction />} />
          <Route path="/transaction" element={<Transaction />} />
          <Route path="/insight" element={<Insight />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/setting" element={<Setting />} />
          <Route path="/notification" element={<Notification />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
