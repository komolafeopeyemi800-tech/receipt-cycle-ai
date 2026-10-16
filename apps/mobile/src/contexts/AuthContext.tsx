import { useAction, useApiClient, useMutation, useQuery } from "../lib/api";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "../lib/api";
import { formatAuthError } from "../lib/authErrors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { clearSessionTokenAsync, getSessionTokenAsync, setSessionTokenAsync } from "../lib/sessionStorage";
import { setRememberedEmailAsync } from "../lib/rememberedEmail";
import { resetSalesEngineMeta } from "../lib/salesSyncCore";
import { PREF_KEYS, SETTINGS_STORAGE_KEYS } from "../lib/preferences";

const PREFS_OWNER_KEY = "receiptcycle_prefs_owner_v1";

/** Removes this person's saved copies (invoices, customers, sync position, profile) from the phone. */
async function clearLocalUserData(userId: string, everything: boolean) {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const mine = keys.filter((k) => k.includes(userId) && (k.startsWith("receipt_cycle_") || k.startsWith("receiptcycle_personal_profile_") || (everything && k.startsWith("receiptcycle_onboarding_user_"))));
    if (everything) {
      mine.push(PREFS_OWNER_KEY, ...Object.values(PREF_KEYS), ...Object.values(SETTINGS_STORAGE_KEYS));
    }
    if (mine.length) await AsyncStorage.multiRemove(mine);
  } catch { /* ignore */ }
  resetSalesEngineMeta(userId);
}

/** Remembers that this account was just created, so the full onboarding runs even on a phone that has onboarded before. */
export const NEW_REGISTRATION_KEY = "receiptcycle_new_registration_user";
async function markNewRegistration(userId: string) {
  try { await AsyncStorage.setItem(NEW_REGISTRATION_KEY, userId); } catch { /* ignore */ }
}

const CACHED_USER_KEY = "receiptcycle_cached_user_v1";

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  image?: string | null;
};

type AuthCtx = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: (idToken: string) => Promise<{ error: Error | null }>;
  sendEmailCode: (email: string) => Promise<{ error: Error | null }>;
  signInWithEmailCode: (email: string, otp: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ error: Error | null }>;
  requestPasswordReset: (email: string) => Promise<
    | { ok: true; emailSent: boolean; devToken?: string; error: null }
    | { ok: false; error: Error }
  >;
  resetPasswordWithToken: (token: string, newPassword: string) => Promise<{ error: Error | null }>;
  /** Changes after the account's data is reset; screens that keep a saved copy reload when it changes. */
  dataEpoch: number;
  resetMyData: () => Promise<{ error: Error | null }>;
  deleteMyAccount: () => Promise<{ error: Error | null }>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  // Last profile seen while online: lets the app open (offline / slow network) instead of spinning forever.
  const [cachedUser, setCachedUser] = useState<AuthUser | null>(null);
  const [waitedTooLong, setWaitedTooLong] = useState(false);
  const [dataEpoch, setDataEpoch] = useState(0);

  const apiClient = useApiClient();
  const signInAction = useAction(api.authNode.signIn);
  const signUpAction = useAction(api.authNode.signUp);
  const signInWithGoogleAction = useAction(api.authNode.signInWithGoogle);
  const sendEmailCodeAction = useAction(api.authNode.sendEmailCode);
  const signInWithEmailCodeAction = useAction(api.authNode.signInWithEmailCode);
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
        if (t) {
          try {
            const raw = await AsyncStorage.getItem(CACHED_USER_KEY);
            if (raw) setCachedUser(JSON.parse(raw) as AuthUser);
          } catch { /* ignore */ }
        }
        setToken(t);
      } catch {
        setToken(null);
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  // The API client sends this token on every request.
  useEffect(() => {
    apiClient.setToken(token);
  }, [apiClient, token]);

  const me = useQuery(api.auth.me, token ? { token } : "skip");

  useEffect(() => {
    if (me) {
      setCachedUser(me);
      void AsyncStorage.setItem(CACHED_USER_KEY, JSON.stringify(me)).catch(() => undefined);
    }
  }, [me]);

  // If the profile cannot be fetched (offline, server hiccup) stop waiting after a few seconds.
  useEffect(() => {
    setWaitedTooLong(false);
    if (!token) return;
    const timer = setTimeout(() => setWaitedTooLong(true), 6000);
    return () => clearTimeout(timer);
  }, [token]);

  useEffect(() => {
    if (!hydrated || !token) return;
    if (me === null) {
      void (async () => {
        try {
          await clearSessionTokenAsync();
        } catch {
          /* ignore */
        }
        try { await AsyncStorage.removeItem(CACHED_USER_KEY); } catch { /* ignore */ }
        setCachedUser(null);
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
        await markNewRegistration(res.user.id);
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
        if (res.isNewRegistration) await markNewRegistration(res.user.id);
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

  const sendEmailCode = useCallback(
    async (email: string) => {
      try {
        await sendEmailCodeAction({ email });
        return { error: null };
      } catch (e) {
        return { error: new Error(formatAuthError(e)) };
      }
    },
    [sendEmailCodeAction],
  );

  const signInWithEmailCode = useCallback(
    async (email: string, otp: string) => {
      try {
        const res = await signInWithEmailCodeAction({ email, otp });
        if (res.isNewRegistration) await markNewRegistration(res.user.id);
        await setSessionTokenAsync(res.token);
        setToken(res.token);
        await setRememberedEmailAsync(res.user.email);
        return { error: null };
      } catch (e) {
        return { error: new Error(formatAuthError(e)) };
      }
    },
    [signInWithEmailCodeAction],
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
    try { await AsyncStorage.removeItem(CACHED_USER_KEY); } catch { /* ignore */ }
    setCachedUser(null);
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
      const uid = me?.id ?? cachedUser?.id;
      if (uid) {
        await clearLocalUserData(uid, false);
        setDataEpoch((n) => n + 1);
      }
      return { error: null };
    } catch (e) {
      return { error: new Error(formatAuthError(e)) };
    }
  }, [resetMyDataMutation, token, me?.id, cachedUser?.id]);

  const deleteMyAccount = useCallback(async () => {
    const t = token ?? (await getSessionTokenAsync());
    if (!t) return { error: new Error("Not signed in.") };
    try {
      await deleteMyAccountMutation({ token: t });
      const uid = me?.id ?? cachedUser?.id;
      if (uid) await clearLocalUserData(uid, true);
      await clearSessionTokenAsync();
      try { await AsyncStorage.removeItem(CACHED_USER_KEY); } catch { /* ignore */ }
      setCachedUser(null);
      setToken(null);
      return { error: null };
    } catch (e) {
      return { error: new Error(formatAuthError(e)) };
    }
  }, [deleteMyAccountMutation, token, me?.id, cachedUser?.id]);

  const resolvedUser = token ? (me ?? cachedUser) : null;
  const loading = !hydrated || (Boolean(token) && me === undefined && !cachedUser && !waitedTooLong);

  const value = useMemo(
    () => ({
      user: resolvedUser,
      token,
      loading,
      signIn,
      signUp,
      signInWithGoogle,
      sendEmailCode,
      signInWithEmailCode,
      signOut,
      changePassword,
      requestPasswordReset,
      resetPasswordWithToken,
      dataEpoch,
      resetMyData,
      deleteMyAccount,
    }),
    [
      resolvedUser,
      token,
      loading,
      signIn,
      signUp,
      signInWithGoogle,
      sendEmailCode,
      signInWithEmailCode,
      signOut,
      changePassword,
      requestPasswordReset,
      resetPasswordWithToken,
      dataEpoch,
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
