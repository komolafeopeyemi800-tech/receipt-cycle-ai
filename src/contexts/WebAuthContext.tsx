import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { formatAuthError } from "@mobile-lib/authErrors";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  clearWebSessionToken,
  clearWebSessionUser,
  getWebSessionToken,
  getWebSessionUser,
  setWebLastEmail,
  setWebSessionToken,
  setWebSessionUser,
} from "@/lib/webSession";

export type WebAuthUser = {
  id: string;
  email: string;
  name: string | null;
};

type WebAuthCtx = {
  user: WebAuthUser | null;
  token: string | null;
  loading: boolean;
  /** Clears the stored session without calling Convex (use when stuck loading or backend is unreachable). */
  clearLocalSession: () => void;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: Error | null }>;
  signInWithWhop: (code: string, redirectUri: string, codeVerifier: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<WebAuthCtx | null>(null);

export function WebAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [cachedUser, setCachedUser] = useState<WebAuthUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const signInAction = useAction(api.authNode.signIn);
  const signUpAction = useAction(api.authNode.signUp);
  const signInWithWhopAction = useAction(api.authNode.signInWithWhop);
  const signOutMutation = useMutation(api.auth.signOut);
  const bootstrapSubscription = useMutation(api.subscription.bootstrapSubscription);

  useEffect(() => {
    setToken(getWebSessionToken());
    setCachedUser(getWebSessionUser());
    setHydrated(true);
  }, []);

  const me = useQuery(api.auth.me, token ? { token } : "skip");

  useEffect(() => {
    if (!hydrated || !token) return;
    if (me === null) {
      clearWebSessionToken();
      clearWebSessionUser();
      setToken(null);
      setCachedUser(null);
    }
  }, [hydrated, token, me]);

  /** Stale token or unreachable Convex leaves `me` stuck as `undefined` → AppChrome spins forever. */
  useEffect(() => {
    if (!hydrated || !token) return;
    if (me !== undefined) return;
    const id = window.setTimeout(() => {
      clearWebSessionToken();
      clearWebSessionUser();
      setToken(null);
      setCachedUser(null);
    }, 12_000);
    return () => window.clearTimeout(id);
  }, [hydrated, token, me]);

  useEffect(() => {
    if (!me || typeof me !== "object" || !("id" in me)) return;
    const nextUser: WebAuthUser = {
      id: me.id as string,
      email: me.email as string,
      name: (me as { name?: string | null }).name ?? null,
    };
    setCachedUser(nextUser);
    setWebSessionUser(nextUser);
  }, [me]);

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
        setWebSessionToken(res.token);
        setWebSessionUser({
          id: res.user.id,
          email: res.user.email,
          name: res.user.name ?? null,
        });
        setToken(res.token);
        setCachedUser({
          id: res.user.id,
          email: res.user.email,
          name: res.user.name ?? null,
        });
        setWebLastEmail(res.user.email);
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
        setWebSessionToken(res.token);
        setWebSessionUser({
          id: res.user.id,
          email: res.user.email,
          name: res.user.name ?? null,
        });
        setToken(res.token);
        setCachedUser({
          id: res.user.id,
          email: res.user.email,
          name: res.user.name ?? null,
        });
        setWebLastEmail(res.user.email);
        return { error: null };
      } catch (e) {
        return { error: new Error(formatAuthError(e)) };
      }
    },
    [signUpAction],
  );

  const signInWithWhop = useCallback(
    async (code: string, redirectUri: string, codeVerifier: string) => {
      try {
        const res = await signInWithWhopAction({ code, redirectUri, codeVerifier });
        setWebSessionToken(res.token);
        setWebSessionUser({
          id: res.user.id,
          email: res.user.email,
          name: res.user.name ?? null,
        });
        setToken(res.token);
        setCachedUser({
          id: res.user.id,
          email: res.user.email,
          name: res.user.name ?? null,
        });
        setWebLastEmail(res.user.email);
        return { error: null };
      } catch (e) {
        return { error: new Error(formatAuthError(e)) };
      }
    },
    [signInWithWhopAction],
  );

  const clearLocalSession = useCallback(() => {
    clearWebSessionToken();
    clearWebSessionUser();
    setToken(null);
    setCachedUser(null);
  }, []);

  const signOut = useCallback(async () => {
    const t = token ?? getWebSessionToken();
    if (t) {
      try {
        await signOutMutation({ token: t });
      } catch {
        /* ignore */
      }
    }
    clearWebSessionToken();
    clearWebSessionUser();
    setToken(null);
    setCachedUser(null);
  }, [signOutMutation, token]);

  /** After hydration: allow cached user fallback while fresh `me` resolves. */
  const loading = !hydrated || (Boolean(token) && me === undefined && !cachedUser);

  const user: WebAuthUser | null =
    me && typeof me === "object" && "id" in me
      ? { id: me.id as string, email: me.email as string, name: (me as { name?: string | null }).name ?? null }
      : cachedUser;

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      clearLocalSession,
      signIn,
      signUp,
      signInWithWhop,
      signOut,
    }),
    [user, token, loading, clearLocalSession, signIn, signUp, signInWithWhop, signOut],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWebAuth(): WebAuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWebAuth must be used within WebAuthProvider");
  return ctx;
}
