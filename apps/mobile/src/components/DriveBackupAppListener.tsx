import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { runScheduledDriveBackupIfDue } from "../lib/performDriveBackup";
import { getDriveWeeklyEnabled, getStoredRefreshToken } from "../lib/driveBackupStorage";
import { useAuth } from "../contexts/AuthContext";

/**
 * When the app becomes active, run a weekly Drive backup if enabled and due.
 */
export function DriveBackupAppListener() {
  const { user } = useAuth();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (!user) return;

    async function tick() {
      const on = await getDriveWeeklyEnabled();
      const linked = await getStoredRefreshToken();
      if (!on || !linked) return;
      await runScheduledDriveBackupIfDue();
    }

    void tick();

    const sub = AppState.addEventListener("change", (next: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && next === "active") {
        void tick();
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, [user?.id]);

  return null;
}
