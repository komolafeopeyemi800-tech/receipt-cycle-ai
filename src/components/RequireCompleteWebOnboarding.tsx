import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useWebAuth } from "@/contexts/WebAuthContext";
import { needsWebOnboarding } from "@/lib/webOnboarding";

/**
 * Redirects to /onboarding when the signed-in user registered but has not finished web onboarding.
 */
export default function RequireCompleteWebOnboarding() {
  const { user, loading } = useWebAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !user) return;
    if (needsWebOnboarding(user.id)) {
      navigate("/onboarding", { replace: true });
    }
  }, [loading, user, navigate]);

  return <Outlet />;
}
