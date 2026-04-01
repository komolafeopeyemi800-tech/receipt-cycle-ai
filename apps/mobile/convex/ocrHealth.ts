"use node";

/**
 * Dev/ops: lightweight HTTP checks that API keys are accepted (no vision calls, minimal cost).
 * Run: `npx convex run ocrHealth:checkProviders --push` from apps/mobile
 * (uses env vars on your linked Convex deployment).
 */
import { internalAction } from "./_generated/server";
import { openRouterApiKey } from "./_ocrEnv";

type ProviderPing = {
  configured: boolean;
  ok?: boolean;
  status?: number;
  detail?: string;
};

async function pingOpenAI(key: string): Promise<ProviderPing> {
  const res = await fetch("https://api.openai.com/v1/models?limit=1", {
    headers: { Authorization: `Bearer ${key}` },
  });
  const text = await res.text();
  return {
    configured: true,
    status: res.status,
    ok: res.ok,
    detail: res.ok ? "API key accepted (models list)" : text.slice(0, 280),
  };
}

async function pingOpenRouter(key: string): Promise<ProviderPing> {
  const res = await fetch("https://openrouter.ai/api/v1/models", {
    headers: { Authorization: `Bearer ${key}` },
  });
  const text = await res.text();
  return {
    configured: true,
    status: res.status,
    ok: res.ok,
    detail: res.ok ? "API key accepted (models list)" : text.slice(0, 280),
  };
}

async function pingGeminiGoogle(key: string): Promise<ProviderPing> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`;
  const res = await fetch(url);
  const text = await res.text();
  return {
    configured: true,
    status: res.status,
    ok: res.ok,
    detail: res.ok ? "API key accepted (models list)" : text.slice(0, 280),
  };
}

export const checkProviders = internalAction({
  args: {},
  handler: async () => {
    const openaiKey = process.env.OPENAI_API_KEY?.trim();
    const orKey = openRouterApiKey();
    const geminiKey = process.env.GEMINI_API_KEY?.trim();
    const landingKey = process.env.LANDING_AI_API_KEY?.trim();

    const openai: ProviderPing = openaiKey
      ? await pingOpenAI(openaiKey)
      : { configured: false, detail: "OPENAI_API_KEY not set" };
    const openrouter: ProviderPing = orKey
      ? await pingOpenRouter(orKey)
      : { configured: false, detail: "OPENROUTER_API_KEY / OPENROUTER_AI_API_KEY not set" };
    const gemini_google: ProviderPing = geminiKey
      ? await pingGeminiGoogle(geminiKey)
      : { configured: false, detail: "GEMINI_API_KEY not set" };
    const landing_ai: ProviderPing = landingKey
      ? {
          configured: true,
          ok: true,
          detail: "LANDING_AI_API_KEY set (full flow tested only via receipt scan)",
        }
      : { configured: false, detail: "LANDING_AI_API_KEY not set" };

    const allOk =
      (!openaiKey || openai.ok) &&
      (!orKey || openrouter.ok) &&
      (!geminiKey || gemini_google.ok);

    return {
      summary: allOk
        ? "All configured providers responded OK (HTTP)."
        : "One or more configured providers failed — see detail fields.",
      providers: { openai, openrouter, gemini_google, landing_ai },
    };
  },
});
