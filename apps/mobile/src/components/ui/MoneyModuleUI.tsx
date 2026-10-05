import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, uiType } from "../../theme/tokens";
import { defaultCategoryIcon, type MoneyIcon } from "../../features/money/model";

export function ModuleDetailHeader({ title, onBack, actionIcon, onAction }: { title: string; onBack: () => void; actionIcon?: MoneyIcon; onAction?: () => void }) {
  const insets = useSafeAreaInsets();
  return <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
    <Pressable onPress={onBack} style={styles.headerButton} hitSlop={8} accessibilityLabel="Go back"><Ionicons name="arrow-back" size={21} color={colors.textPrimary} /></Pressable>
    <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
    {actionIcon && onAction ? <Pressable onPress={onAction} style={styles.headerButton} hitSlop={8} accessibilityLabel={`${title} options`}><Ionicons name={actionIcon} size={21} color={colors.textPrimary} /></Pressable> : <View style={styles.headerButton} />}
  </View>;
}

export function CategoryGlyph({ name, color, icon, size = 38 }: { name: string; color?: string; icon?: MoneyIcon; size?: number }) {
  const foreground = color ?? colors.primary;
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: `${foreground}1d`, alignItems: "center", justifyContent: "center" }}><Ionicons name={icon ?? defaultCategoryIcon(name)} size={Math.round(size * 0.49)} color={foreground} /></View>;
}

export function BudgetProgress({ value, max, color = colors.primary, height = 6 }: { value: number; max: number; color?: string; height?: number }) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return <View style={[styles.track, { height, borderRadius: height / 2 }]}><View style={{ width: `${percent}%`, height, borderRadius: height / 2, backgroundColor: color }} /></View>;
}

export function BudgetDonut({ value, max, size = 116, children }: { value: number; max: number; size?: number; children?: ReactNode }) {
  const r = size * 0.39; const c = 2 * Math.PI * r; const percent = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  return <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
    <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke="#c9eee8" strokeWidth={size * 0.095} fill="none" />
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.primary} strokeWidth={size * 0.095} fill="none" strokeLinecap="round" strokeDasharray={`${c * percent} ${c}`} rotation={-90} origin={`${size / 2}, ${size / 2}`} />
    </Svg>
    {children}
  </View>;
}

export function MoneySection({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{action && onAction ? <Pressable onPress={onAction} hitSlop={8}><Text style={styles.sectionAction}>{action}</Text></Pressable> : null}</View>;
}

const styles = StyleSheet.create({
  header: { backgroundColor: colors.surface, minHeight: 55, flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.divider },
  headerButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: uiType.sectionTitle, fontWeight: "800", color: colors.textPrimary },
  track: { width: "100%", backgroundColor: "#d6eeeb", overflow: "hidden" },
  section: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm },
  sectionTitle: { fontSize: uiType.sectionTitle, fontWeight: "800", color: colors.textPrimary },
  sectionAction: { fontSize: uiType.secondary, fontWeight: "700", color: colors.blue600 },
});
