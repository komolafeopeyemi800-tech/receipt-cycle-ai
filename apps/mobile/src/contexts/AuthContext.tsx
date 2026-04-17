import { useAction, useMutation, useQuery } from "convex/react";
import * as Linking from "expo-linking";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "../../convex/_generated/api";
import { formatAuthError } from "../lib/authErrors";
import { clearSessionTokenAsync, getSessionTokenAsync, setSessionTokenAsync } from "../lib/sessionStorage";
import { setRememberedEmailAsync } from "../lib/rememberedEmail";

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
};

type AuthCtx = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: (idToken: string) => Promise<{ error: Error | null }>;
  signInWithWhop: (code: string, redirectUri: string, codeVerifier: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ error: Error | null }>;
  requestPasswordReset: (email: string) => Promise<
    | { ok: true; emailSent: boolean; devToken?: string; error: null }
    | { ok: false; error: Error }
  >;
  resetPasswordWithToken: (token: string, newPassword: string) => Promise<{ error: Error | null }>;
  resetMyData: () => Promise<{ error: Error | null }>;
  deleteMyAccount: () => Promise<{ error: Error | null }>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const signInAction = useAction(api.authNode.signIn);
  const signUpAction = useAction(api.authNode.signUp);
  const signInWithGoogleAction = useAction(api.authNode.signInWithGoogle);
  const signInWithWhopAction = useAction(api.authNode.signInWithWhop);
  const changePasswordAction = useAction(api.authNode.changePassword);
  const requestPasswordResetAction = useAction(api.authNode.requestPasswordReset);
  const resetPasswordWithTokenAction = useAction(api.authNode.resetPasswordWithToken);
  const signOutMutation = useMutation(api.auth.signOut);
  const resetMyDataMutation = useMutation(api.auth.resetMyData);
  const deleteMyAccountMutation = useMutation(api.auth.deleteMyAccount);
  const bootstrapSubscription = useMutation(api.subscription.bootstrapSubscription);

  useEffect(() => {
    void (async () => {
      try {
        const t = await getSessionTokenAsync();
        setToken(t);
      } catch {
        setToken(null);
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  const me = useQuery(api.auth.me, token ? { token } : "skip");

  useEffect(() => {
    if (!hydrated || !token) return;
    if (me === null) {
      void (async () => {
        try {
          await clearSessionTokenAsync();
        } catch {
          /* ignore */
        }
        setToken(null);
      })();
    }
  }, [hydrated, token, me]);

  useEffect(() => {
    if (!token) return;
    void bootstrapSubscription({ token }).catch(() => {
      /* non-fatal */
    });
  }, [token, bootstrapSubscription]);

  function checkoutReturnSignalsUrl(url: string | null): boolean {
    if (!url) return false;
    return (
      url.includes("post-checkout") ||
      url.includes("status=success") ||
      url.includes("checkout=success")
    );
  }

  useEffect(() => {
    if (!token) return;
    void (async () => {
      try {
        const initial = await Linking.getInitialURL();
        if (checkoutReturnSignalsUrl(initial)) {
          await bootstrapSubscription({ token });
        }
      } catch {
        /* ignore */
      }
    })();
  }, [token, bootstrapSubscription]);

  useEffect(() => {
    if (!token) return;
    const sub = Linking.addEventListener("url", (e) => {
      if (checkoutReturnSignalsUrl(e.url)) {
        void bootstrapSubscription({ token }).catch(() => {});
      }
    });
    return () => sub.remove();
  }, [token, bootstrapSubscription]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        const res = await signInAction({ email: email.trim(), password });
        await setSessionTokenAsync(res.token);
        setToken(res.token);
        await setRememberedEmailAsync(res.user.email);
        return { error: null };
      } catch (e) {
        return { error: new Error(formatAuthError(e)) };
      }
    },
    [signInAction],
  );

  const signUp = useCallback(
    async (email: string, password: string, name?: string) => {
      try {
        const res = await signUpAction({
          email: email.trim(),
          password,
          name: name?.trim() || undefined,
        });
        await setSessionTokenAsync(res.token);
        setToken(res.token);
        await setRememberedEmailAsync(res.user.email);
        return { error: null };
      } catch (e) {
        return { error: new Error(formatAuthError(e)) };
      }
    },
    [signUpAction],
  );

  const signInWithGoogle = useCallback(
    async (idToken: string) => {
      try {
        const res = await signInWithGoogleAction({ idToken });
        await setSessionTokenAsync(res.token);
        setToken(res.token);
        await setRememberedEmailAsync(res.user.email);
        return { error: null };
      } catch (e) {
        return { error: new Error(formatAuthError(e)) };
      }
    },
    [signInWithGoogleAction],
  );

  const signInWithWhop = useCallback(
    async (code: string, redirectUri: string, codeVerifier: string) => {
      try {
        const res = await signInWithWhopAction({ code, redirectUri, codeVerifier });
        await setSessionTokenAsync(res.token);
        setToken(res.token);
        await setRememberedEmailAsync(res.user.email);
        return { error: null };
      } catch (e) {
        return { error: new Error(formatAuthError(e)) };
      }
    },
    [signInWithWhopAction],
  );

  const signOut = useCallback(async () => {
    const t = token ?? (await getSessionTokenAsync());
    if (t) {
      try {
        await signOutMutation({ token: t });
      } catch {
        /* ignore */
      }
    }
    await clearSessionTokenAsync();
    setToken(null);
  }, [signOutMutation, token]);

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      const t = token ?? (await getSessionTokenAsync());
      if (!t) return { error: new Error("Not signed in.") };
      try {
        await changePasswordAction({ token: t, currentPassword, newPassword });
        return { error: null };
      } catch (e) {
        return { error: new Error(formatAuthError(e)) };
      }
    },
    [changePasswordAction, token],
  );

  const requestPasswordReset = useCallback(
    async (email: string) => {
      try {
        const res = await requestPasswordResetAction({ email: email.trim() });
        return { ok: true as const, emailSent: res.emailSent, devToken: res.devToken, error: null };
      } catch (e) {
        return { ok: false as const, error: new Error(formatAuthError(e)) };
      }
    },
    [requestPasswordResetAction],
  );

  const resetPasswordWithToken = useCallback(
    async (resetToken: string, newPassword: string) => {
      try {
        await resetPasswordWithTokenAction({ token: resetToken.trim(), newPassword });
        return { error: null };
      } catch (e) {
        return { error: new Error(formatAuthError(e)) };
      }
    },
    [resetPasswordWithTokenAction],
  );

  const resetMyData = useCallback(async () => {
    const t = token ?? (await getSessionTokenAsync());
    if (!t) return { error: new Error("Not signed in.") };
    try {
      await resetMyDataMutation({ token: t });
      return { error: null };
    } catch (e) {
      return { error: new Error(formatAuthError(e)) };
    }
  }, [resetMyDataMutation, token]);

  const deleteMyAccount = useCallback(async () => {
    const t = token ?? (await getSessionTokenAsync());
    if (!t) return { error: new Error("Not signed in.") };
    try {
      await deleteMyAccountMutation({ token: t });
      await clearSessionTokenAsync();
      setToken(null);
      return { error: null };
    } catch (e) {
      return { error: new Error(formatAuthError(e)) };
    }
  }, [deleteMyAccountMutation, token]);

  const loading = !hydrated || (Boolean(token) && me === undefined);

  const value = useMemo(
    () => ({
      user: me ?? null,
      token,
      loading,
      signIn,
      signUp,
      signInWithGoogle,
      signInWithWhop,
      signOut,
      changePassword,
      requestPasswordReset,
      resetPasswordWithToken,
      resetMyData,
      deleteMyAccount,
    }),
    [
      me,
      token,
      loading,
      signIn,
      signUp,
      signInWithGoogle,
      signInWithWhop,
      signOut,
      changePassword,
      requestPasswordReset,
      resetPasswordWithToken,
      resetMyData,
      deleteMyAccount,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
