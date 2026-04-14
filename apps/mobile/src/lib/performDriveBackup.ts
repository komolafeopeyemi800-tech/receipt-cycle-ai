import { ConvexHttpClient } from "convex/browser";
import { exchangeCodeAsync, refreshAsync, type DiscoveryDocument } from "expo-auth-session";
import { api } from "../../convex/_generated/api";
import { getSessionTokenAsync } from "./sessionStorage";
import { getConvexUrl, getGoogleOAuthClientId } from "./googleDriveEnv";
import { uploadJsonToDrive } from "./googleDriveUpload";
import {
  getDriveWeeklyEnabled,
  getLastDriveBackupAt,
  getStoredConvexUserId,
  getStoredRefreshToken,
  setLastDriveBackupAt,
} from "./driveBackupStorage";

const GOOGLE_DISCOVERY: DiscoveryDocument = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
  revocationEndpoint: "https://oauth2.googleapis.com/revoke",
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

async function getAccessTokenFromRefresh(refreshToken: string): Promise<string> {
  const clientId = getGoogleOAuthClientId();
  if (!clientId) throw new Error("Google OAuth is not configured.");
  const token = await refreshAsync({ clientId, refreshToken }, GOOGLE_DISCOVERY);
  if (!token.accessToken) throw new Error("Could not refresh Google access token.");
  return token.accessToken;
}

export async function exchangeGoogleAuthCode(code: string, codeVerifier: string, redirectUri: string) {
  const clientId = getGoogleOAuthClientId();
  if (!clientId) throw new Error("Google OAuth is not configured.");
  return exchangeCodeAsync(
    {
      clientId,
      code,
      redirectUri,
      extraParams: { code_verifier: codeVerifier },
    },
    GOOGLE_DISCOVERY,
  );
}

/** Runs backup if weekly schedule is due (≥7 days since last success). */
export async function runScheduledDriveBackupIfDue(): Promise<{ ran: boolean; error?: string }> {
  try {
    const weekly = await getDriveWeeklyEnabled();
    if (!weekly) return { ran: false };

    const refresh = await getStoredRefreshToken();
    const userId = await getStoredConvexUserId();
    const session = await getSessionTokenAsync();
    if (!refresh || !userId || !session) return { ran: false };

    const last = await getLastDriveBackupAt();
    if (last != null && Date.now() - last < WEEK_MS) return { ran: false };

    await runDriveBackupWithStoredCredentials();
    return { ran: true };
  } catch (e) {
    return { ran: false, error: e instanceof Error ? e.message : "Backup failed" };
  }
}

/** Immediate backup using stored Google refresh + Convex session (foreground or background). */
export async function runDriveBackupWithStoredCredentials(): Promise<void> {
  const refresh = await getStoredRefreshToken();
  const userId = await getStoredConvexUserId();
  const session = await getSessionTokenAsync();
  if (!refresh || !userId) throw new Error("Google Drive is not linked.");
  if (!session) throw new Error("Sign in to Receipt Cycle to back up.");

  const access = await getAccessTokenFromRefresh(refresh);
  const url = getConvexUrl();
  const client = new ConvexHttpClient(url);
  const me = await client.query(api.auth.me, { token: session });
  if (!me || me.id !== userId) throw new Error("Session mismatch. Sign in again.");

  const rows = await client.query(api.transactions.exportForBackup, { userId, token: session });
  const payload = JSON.stringify(
    { exportedAt: new Date().toISOString(), app: "Receipt Cycle", transactions: rows },
    null,
    2,
  );
  const stamp = new Date().toISOString().slice(0, 10);
  await uploadJsonToDrive(access, `receipt-cycle-backup-${stamp}.json`, payload);
  await setLastDriveBackupAt(Date.now());
}

export { GOOGLE_DISCOVERY };
