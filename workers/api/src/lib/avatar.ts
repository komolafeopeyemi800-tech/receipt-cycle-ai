/**
 * A friendly default profile picture for people with no photo (no Google photo, nothing uploaded).
 * It is drawn from the account id, so it is always the same picture on the web, the phone and the server, and it
 * never uses the person's name or email. Illustration style: DiceBear "notionists" (CC0, free for commercial use).
 */
const SOFT_BACKGROUNDS = "b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf,d9f2e6";

export function defaultAvatarUrl(accountId: string): string {
  return `https://api.dicebear.com/9.x/notionists/png?seed=${encodeURIComponent(accountId)}&size=256&backgroundColor=${SOFT_BACKGROUNDS}`;
}

/** True for the generated picture (so screens can hide "Remove picture" for it). */
export function isGeneratedAvatar(url: string | null | undefined): boolean {
  return Boolean(url && url.startsWith("https://api.dicebear.com/"));
}
