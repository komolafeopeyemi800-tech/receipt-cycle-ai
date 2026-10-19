export function articleSummaryPrompt(canonicalUrl: string): string {
  return `Summarize this article and answer any follow-up questions I have about it: url=${canonicalUrl}`;
}

export function aiSummaryLinks(canonicalUrl: string) {
  const prompt = encodeURIComponent(articleSummaryPrompt(canonicalUrl));
  return [
    { label: "ChatGPT", shortLabel: "C", href: `https://chatgpt.com/?q=${prompt}` },
    { label: "Perplexity", shortLabel: "P", href: `https://www.perplexity.ai/search/new?q=${prompt}` },
    { label: "Gemini", shortLabel: "G", href: `https://gemini.google.com/app?prompt=${prompt}` },
    { label: "Grok", shortLabel: "X", href: `https://x.com/i/grok?text=${prompt}` },
  ] as const;
}
