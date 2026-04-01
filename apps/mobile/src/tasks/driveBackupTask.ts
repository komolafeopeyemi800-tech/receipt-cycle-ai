import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import { runScheduledDriveBackupIfDue } from "../lib/performDriveBackup";

export const DRIVE_BACKUP_TASK = "receipt-cycle-drive-weekly";

TaskManager.defineTask(DRIVE_BACKUP_TASK, async () => {
  try {
    const { ran, error } = await runScheduledDriveBackupIfDue();
    if (error) {
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
    return ran ? BackgroundFetch.BackgroundFetchResult.NewData : BackgroundFetch.BackgroundFetchResult.NoData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/** Registers OS background fetch (best-effort). Backup still runs when you open the app if a week has passed. */
export async function registerDriveWeeklyBackgroundTask(): Promise<void> {
  const status = await BackgroundFetch.getStatusAsync();
  if (status === BackgroundFetch.BackgroundFetchStatus.Denied) return;
  const registered = await TaskManager.isTaskRegisteredAsync(DRIVE_BACKUP_TASK);
  if (!registered) {
    await BackgroundFetch.registerTaskAsync(DRIVE_BACKUP_TASK, {
      minimumInterval: 24 * 60 * 60,
    });
  }
}

export async function unregisterDriveWeeklyBackgroundTask(): Promise<void> {
  await BackgroundFetch.unregisterTaskAsync(DRIVE_BACKUP_TASK).catch(() => {});
}
