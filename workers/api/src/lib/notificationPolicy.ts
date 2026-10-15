const blocked = ["buy", "purchase", "subscribe", "upgrade", "checkout", "pay", "plan", "pricing", "discount"];

export function androidPolicyErrors(input: { title: string; body: string; category: string; webAccessMentions?: boolean; androidOfferCampaignsEnabled?: boolean }) {
  const text = `${input.title} ${input.body}`.toLowerCase();
  const errors: string[] = [];
  if (/https?:\/\/|www\.|\.[a-z]{2,}(?:\/|\s|$)/i.test(text)) errors.push("Android notifications cannot contain links or domains.");
  if (/[$€£₦]\s?\d|\d\s?(?:usd|eur|gbp|ngn)/i.test(text)) errors.push("Android notifications cannot contain prices.");
  if (!input.webAccessMentions) {
    const terms = blocked.filter((term) => new RegExp(`\\b${term}\\b`, "i").test(text));
    if (terms.length) errors.push(`Restricted Android wording: ${terms.join(", ")}.`);
  }
  if (input.category === "campaign" && !input.androidOfferCampaignsEnabled) errors.push("Android offer campaigns are disabled.");
  return errors;
}
