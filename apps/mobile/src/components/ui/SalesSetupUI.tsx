import { Pressable, StyleSheet, Text, View } from "react-native";
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

export function InitialsAvatar({ name, size = 46 }: { name: string; size?: number }) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const initials = (words.length > 1 ? `${words[0][0]}${words[1][0]}` : words[0]?.slice(0, 2) || "RC").toUpperCase();
  const [backgroundColor, color] = avatarPalette[colorIndex(name)];
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
  previewBanner: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: colors.mintSoft, borderRadius: 999, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  previewText: { color: colors.primary, fontSize: uiType.caption, fontWeight: "700" },
});
