import { useState } from "react";

const PERSONAL_DOMAINS = new Set(["gmail.com", "googlemail.com", "yahoo.com", "ymail.com", "outlook.com", "hotmail.com", "live.com", "msn.com", "icloud.com", "me.com", "aol.com", "proton.me", "protonmail.com", "gmx.com", "mail.com", "zoho.com", "yandex.com", "rocketmail.com"]);

/** The company domain behind a customer's website or email, or null for personal mailboxes (same rule as the phone app). */
export function businessDomain(email?: string, website?: string): string | null {
  const fromSite = website?.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[/?#]/)[0];
  if (fromSite && /^[a-z0-9.-]+\.[a-z]{2,}$/.test(fromSite)) return fromSite;
  const host = email?.trim().toLowerCase().split("@")[1];
  return host && !PERSONAL_DOMAINS.has(host) && /^[a-z0-9.-]+\.[a-z]{2,}$/.test(host) ? host : null;
}

/** Picture sources in the order tried: the company's logo, then a friendly illustration picked from the name. */
export function customerAvatarSources(name: string, email?: string, website?: string): { url: string; logo: boolean }[] {
  const domain = businessDomain(email, website);
  const seed = (name || email || "customer").trim().toLowerCase(); // by name, so every screen shows the same face
  return [
    ...(domain ? [{ url: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`, logo: true }] : []),
    { url: `https://api.dicebear.com/9.x/notionists/png?seed=${encodeURIComponent(seed)}&size=128&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf,d9f2e6`, logo: false },
  ];
}

/**
 * A customer's picture: their company logo when their email or website points at a company, otherwise a friendly
 * illustrated profile (the same face for the same name as on the phone). Initials are the last resort.
 * `className` sets the size and shape exactly like the initials badge it replaces.
 */
export function CustomerAvatar({ name, email, website, className = "h-10 w-10 text-sm" }: { name: string; email?: string; website?: string; className?: string }) {
  const sources = customerAvatarSources(name, email, website);
  const [failed, setFailed] = useState(0);
  if (failed < sources.length) {
    const source = sources[failed];
    return (
      <span className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full ${source.logo ? "border border-slate-200 bg-white" : "bg-slate-100"} ${className}`}>
        <img
          src={source.url}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed((n) => n + 1)}
          className={source.logo ? "h-3/5 w-3/5 object-contain" : "h-full w-full object-cover"}
        />
      </span>
    );
  }
  return <span className={`flex shrink-0 items-center justify-center rounded-full bg-teal-100 font-extrabold text-teal-800 ${className}`}>{(name || "?").trim().slice(0, 2).toUpperCase()}</span>;
}
