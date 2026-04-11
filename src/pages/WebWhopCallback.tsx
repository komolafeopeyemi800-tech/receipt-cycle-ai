import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useWebAuth } from "@/contexts/WebAuthContext";
import { consumeWhopPkceState, getWhopWebRedirectUri } from "@/lib/whopOAuthPkce";
import { getWebSessionUser } from "@/lib/webSession";
import { needsWebOnboarding, setPendingWebOnboarding } from "@/lib/webOnboarding";

export default function WebWhopCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { signInWithWhop } = useWebAuth();
  const [msg, setMsg] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const oauthErr = params.get("error");
    if (oauthErr) {
      setMsg(params.get("error_description") ?? oauthErr);
      return;
    }

    const code = params.get("code");
    const state = params.get("state");
    if (!code || !state) {
      setMsg("Missing OAuth response. Start sign-in again from the sign-in page.");
      return;
    }

    const pkce = consumeWhopPkceState(state);
    if (!pkce) {
      setMsg("Sign-in session expired or invalid. Please try “Continue with Whop” again.");
      return;
    }

    void (async () => {
      const { error, isNewRegistration } = await signInWithWhop(code, getWhopWebRedirectUri(), pkce.codeVerifier);
      if (error) {
        setMsg(error.message);
        return;
      }
      const sessionUser = getWebSessionUser();
      if (isNewRegistration && sessionUser) {
        setPendingWebOnboarding(sessionUser.id);
      }
      if (sessionUser && needsWebOnboarding(sessionUser.id)) {
        navigate("/onboarding", { replace: true });
        return;
      }
      navigate("/dashboard", { replace: true });
    })();
  }, [navigate, params, signInWithWhop]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md text-center">
        {msg ? (
          <>
            <p className="text-sm text-red-600" role="alert">
              {msg}
            </p>
            <Link to="/signin" className="mt-6 inline-block text-sm font-semibold text-primary hover:underline">
              Back to sign in
            </Link>
          </>
        ) : (
          <p className="text-sm text-slate-600">Completing Whop sign-in…</p>
        )}
      </div>
    </div>
  );
}
