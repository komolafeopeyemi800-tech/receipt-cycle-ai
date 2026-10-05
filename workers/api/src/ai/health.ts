/** Cheap key checks for the admin dashboard (no vision calls). Ported from apps/mobile/convex/ocrHealth.ts. */
import type { Env } from "../types";
import { openRouterApiKey } from "./scan";

type ProviderPing = { configured: boolean; ok?: boolean; status?: number; detail?: string };

async function ping(url: string, init?: RequestInit): Promise<ProviderPing> {
  const res = await fetch(url, init);
  const text = await res.text();
  return { configured: true, status: res.status, ok: res.ok, detail: res.ok ? "API key accepted (models list)" : text.slice(0, 280) };
}

export async function checkProviders(env: Env) {
  const openaiKey = env.OPENAI_API_KEY?.trim();
  const orKey = openRouterApiKey(env);
  const geminiKey = env.GEMINI_API_KEY?.trim();
  const landingKey = env.LANDING_AI_API_KEY?.trim();

  const openai: ProviderPing = openaiKey
    ? await ping("https://api.openai.com/v1/models?limit=1", { headers: { Authorization: `Bearer ${openaiKey}` } })
    : { configured: false, detail: "OPENAI_API_KEY not set" };
  const openrouter: ProviderPing = orKey
    ? await ping("https://openrouter.ai/api/v1/models", { headers: { Authorization: `Bearer ${orKey}` } })
    : { configured: false, detail: "OPENROUTER_API_KEY not set" };
  const gemini_google: ProviderPing = geminiKey
    ? await ping(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(geminiKey)}`)
    : { configured: false, detail: "GEMINI_API_KEY not set" };
  const landing_ai: ProviderPing = landingKey
    ? { configured: true, ok: true, detail: "LANDING_AI_API_KEY set (full flow tested only via receipt scan)" }
    : { configured: false, detail: "LANDING_AI_API_KEY not set" };

  const allOk = (!openaiKey || openai.ok) && (!orKey || openrouter.ok) && (!geminiKey || gemini_google.ok);
  return {
    summary: allOk
      ? "All configured providers responded OK (HTTP)."
      : "One or more configured providers failed — see detail fields.",
    providers: { openai, openrouter, gemini_google, landing_ai },
  };
}
