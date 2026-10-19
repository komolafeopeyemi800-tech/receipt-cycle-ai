export function articleSummaryPrompt(canonicalUrl: string): string {
  return `Summarize this article and answer any follow-up questions I have about it: url=${canonicalUrl}`;
}

export function aiSummaryLinks(canonicalUrl: string) {
  const prompt = encodeURIComponent(articleSummaryPrompt(canonicalUrl));
  return [
    { label: "ChatGPT", shortLabel: "C", logo: "/brand-logos/ai/chatgpt.svg", href: `https://chatgpt.com/?q=${prompt}` },
    { label: "Perplexity", shortLabel: "P", logo: "/brand-logos/ai/perplexity.svg", href: `https://www.perplexity.ai/search/new?q=${prompt}` },
    { label: "Claude", shortLabel: "Cl", logo: "/brand-logos/ai/claude.svg", href: `https://claude.ai/new?q=${prompt}` },
    { label: "Gemini", shortLabel: "G", logo: "/brand-logos/ai/gemini.svg", href: `https://gemini.google.com/app?prompt=${prompt}` },
    { label: "Grok", shortLabel: "X", logo: "/brand-logos/ai/grok.svg", href: `https://x.com/i/grok?text=${prompt}` },
  ] as const;
}
