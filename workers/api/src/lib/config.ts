import { eq } from "drizzle-orm";
import { appConfig } from "../db/schema";
import type { Db } from "../types";

function limit(value: number | null | undefined, fallback: number): number {
  return Number.isFinite(value ?? Number.NaN) ? Math.max(0, Math.floor(value as number)) : fallback;
}

/** Runtime switches and free-tier limits (port of getRuntimeConfig in transactions.ts). */
export async function getRuntimeConfig(db: Db) {
  const row = await db.select().from(appConfig).where(eq(appConfig.key, "global")).get();
  return {
    maintenanceMode: row?.maintenanceMode ?? false,
    scannerEnabled: row?.scannerEnabled ?? true,
    uploadEnabled: row?.uploadEnabled ?? true,
    manualAddEnabled: row?.manualAddEnabled ?? true,
    freeCameraLimit: limit(row?.freeCameraLimit, 20),
    freeUploadLimit: limit(row?.freeUploadLimit, 20),
    freeManualLimit: limit(row?.freeManualLimit, 60),
    dailyScanLimit: limit(row?.dailyScanLimit, 25),
    dailyVoiceLimit: limit(row?.dailyVoiceLimit, 25),
    dailyUploadLimit: limit(row?.dailyUploadLimit, 25),
    dailyAssistantLimit: limit(row?.dailyAssistantLimit, 50),
    aiDailyBudgetCents: limit(row?.aiDailyBudgetCents, 60),
    aiMonthlyBudgetCents: limit(row?.aiMonthlyBudgetCents, 400),
    aiBurstCalls: limit(row?.aiBurstCalls, 20),
    aiGuardEnabled: row?.aiGuardEnabled ?? true,
  };
}
