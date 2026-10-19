import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { colors, spacing, uiType } from "../../theme/tokens";

type IconName = ComponentProps<typeof Ionicons>["name"];

const avatarPalette = [
  ["#dbeafe", "#2563eb"],
  ["#dcfce7", "#059669"],
  ["#f3e8ff", "#9333ea"],
  ["#ffedd5", "#d97706"],
] as const;

function colorIndex(name: string) {
  return [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % avatarPalette.length;
}

const PERSONAL_DOMAINS = new Set(["gmail.com", "googlemail.com", "yahoo.com", "ymail.com", "outlook.com", "hotmail.com", "live.com", "msn.com", "icloud.com", "me.com", "aol.com", "proton.me", "protonmail.com", "gmx.com", "mail.com", "zoho.com", "yandex.com", "rocketmail.com"]);

function businessDomain(email?: string, website?: string): string | null {
  const fromSite = website?.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[/?#]/)[0];
  if (fromSite && /^[a-z0-9.-]+\.[a-z]{2,}$/.test(fromSite)) return fromSite;
  const host = email?.trim().toLowerCase().split("@")[1];
  return host && !PERSONAL_DOMAINS.has(host) && /^[a-z0-9.-]+\.[a-z]{2,}$/.test(host) ? host : null;
}

/**
 * A customer's picture: their company logo when their email or website points at a company, otherwise a friendly
 * illustrated profile picked from their name (so the same person always gets the same face). Initials are the last resort.
 */
export function InitialsAvatar({ name, size = 46, email, website }: { name: string; size?: number; email?: string; website?: string }) {
  const domain = businessDomain(email, website);
  const seed = (name || email || "customer").trim().toLowerCase(); // by name, so every screen shows the same face
  const sources = [
    ...(domain ? [`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`] : []),
    `https://api.dicebear.com/9.x/notionists/png?seed=${encodeURIComponent(seed)}&size=128&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf,d9f2e6`,
  ];
  const [failed, setFailed] = useState(0);
  const words = name.trim().split(/\s+/).filter(Boolean);
  const initials = (words.length > 1 ? `${words[0][0]}${words[1][0]}` : words[0]?.slice(0, 2) || "RC").toUpperCase();
  const [backgroundColor, color] = avatarPalette[colorIndex(name)];
  if (failed < sources.length) {
    const logo = failed === 0 && Boolean(domain);
    return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: logo ? "#fff" : "#eef2f7", alignItems: "center", justifyContent: "center", overflow: "hidden", borderWidth: logo ? 1 : 0, borderColor: "#e5e7eb" }}>
      <Image source={{ uri: sources[failed] }} onError={() => setFailed((n) => n + 1)} style={logo ? { width: size * 0.6, height: size * 0.6 } : { width: size, height: size }} resizeMode={logo ? "contain" : "cover"} />
    </View>;
  }
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor, alignItems: "center", justifyContent: "center" }}><Text style={{ color, fontWeight: "800", fontSize: Math.max(12, Math.round(size * 0.34)) }}>{initials}</Text></View>;
}

export function ContactAction({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.contact, pressed && { opacity: 0.7 }]} accessibilityRole="button" accessibilityLabel={label}><View style={styles.contactIcon}><Ionicons name={icon} size={19} color={colors.blue600} /></View><Text style={styles.contactLabel}>{label}</Text></Pressable>;
}

export function ContactInfoRow({ icon, value }: { icon: IconName; value: string }) {
  return <View style={styles.infoRow}><Ionicons name={icon} size={18} color={colors.gray500} /><Text style={styles.infoValue}>{value}</Text></View>;
}

export function SalesSetupPreviewBanner() {
  return <View style={styles.previewBanner}><Ionicons name="eye-outline" size={14} color={colors.primary} /><Text style={styles.previewText}>Sales setup preview</Text></View>;
}

const styles = StyleSheet.create({
  contact: { flex: 1, alignItems: "center", gap: spacing.xs },
  contactIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.blueSoft, alignItems: "center", justifyContent: "center" },
  contactLabel: { color: colors.gray600, fontSize: uiType.caption, fontWeight: "600" },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md, paddingVertical: 5 },
  infoValue: { flex: 1, color: colors.textSecondary, fontSize: uiType.secondary, lineHeight: 18 },
  previewBanner: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: colors.mintSoft, borderRadius: 6, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  previewText: { color: colors.primary, fontSize: uiType.caption, fontWeight: "700" },
});
