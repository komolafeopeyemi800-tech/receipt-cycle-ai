/** Shared OCR provider env helpers (scan + health check). Underscore: not a Convex API module. */

export function openRouterApiKey(): string | undefined {
  return (
    process.env.OPENROUTER_API_KEY?.trim() ||
    process.env.OPENROUTER_AI_API_KEY?.trim() ||
    process.env.openrouter_ai_API_KEY?.trim()
  );
}

export function anyOcrProviderConfigured(): boolean {
  return !!(
    process.env.OPENAI_API_KEY?.trim() ||
    openRouterApiKey() ||
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.LANDING_AI_API_KEY?.trim()
  );
}
