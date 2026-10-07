import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, TextInput, View, type KeyboardTypeOptions, type StyleProp, type TextInputProps, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { colors, controlHeight, radius, shadows, spacing, uiType } from "../../theme/tokens";
import type { SalesStatus } from "../../types/sales";

type IconName = ComponentProps<typeof Ionicons>["name"];

export function ScreenContainer({ children }: { children: ReactNode }) {
  return <View style={styles.screen}>{children}</View>;
}

export function AppCard({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function AppButton({
  label,
  onPress,
  icon,
  variant = "primary",
  disabled = false,
  style,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  variant?: "primary" | "secondary";
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [styles.button, variant === "secondary" && styles.buttonSecondary, disabled && styles.disabled, pressed && !disabled && styles.pressed, style]}
    >
      {icon ? <Ionicons name={icon} size={18} color={variant === "primary" ? "#fff" : colors.primary} /> : null}
      <Text style={[styles.buttonText, variant === "secondary" && styles.buttonTextSecondary]}>{label}</Text>
    </Pressable>
  );
}

export function IconTile({ icon, tone = "mint", size = 38 }: { icon: IconName; tone?: "mint" | "blue" | "rose" | "amber" | "purple"; size?: number }) {
  const toneColors = {
    mint: [colors.mintSoft, colors.primary],
    blue: [colors.blueSoft, colors.blue600],
    rose: [colors.roseSoft, colors.rose600],
    amber: [colors.amberSoft, colors.amber600],
    purple: [colors.purpleSoft, colors.purple600],
  } as const;
  const [bg, fg] = toneColors[tone];
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: "center", justifyContent: "center" }}>
      <Ionicons name={icon} size={Math.round(size * 0.46)} color={fg} />
    </View>
  );
}

type UiStatus = SalesStatus | "active" | "prospect" | "inactive";

export function StatusBadge({ status }: { status: UiStatus }) {
  const palette: Record<UiStatus, [string, string, string]> = {
    draft: ["Draft", "#eef2f7", colors.gray600],
    sent: ["Sent", colors.blueSoft, colors.blue600],
    paid: ["Paid", "#dff8eb", "#087b54"],
    partially_paid: ["Partially Paid", colors.blueSoft, colors.blue600],
    overdue: ["Overdue", colors.roseSoft, colors.rose600],
    accepted: ["Accepted", "#dff8eb", "#087b54"],
    expired: ["Expired", colors.roseSoft, colors.rose600],
    received: ["Received", "#dff8eb", "#087b54"],
    partial: ["Partial", colors.blueSoft, colors.blue600],
    refunded: ["Refunded", colors.roseSoft, colors.rose600],
    active: ["Active", "#dff8eb", "#087b54"],
    prospect: ["Prospect", colors.amberSoft, colors.amber600],
    inactive: ["Inactive", colors.gray100, colors.gray600],
  };
  const [label, backgroundColor, color] = palette[status];
  return <View style={[styles.badge, { backgroundColor }]}><Text style={[styles.badgeText, { color }]}>{label}</Text></View>;
}

export function SectionHeader({ title, actionLabel, onAction }: { title: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionLabel && onAction ? <Pressable onPress={onAction} accessibilityRole="button" hitSlop={8}><Text style={styles.sectionAction}>{actionLabel}</Text></Pressable> : null}
    </View>
  );
}

export function SegmentedTabs<T extends string>({ options, value, onChange }: { options: readonly T[]; value: T; onChange: (value: T) => void }) {
  return (
    <View style={styles.segmented}>
      {options.map((option) => (
        <Pressable key={option} onPress={() => onChange(option)} style={[styles.segment, value === option && styles.segmentActive]} accessibilityRole="tab" accessibilityState={{ selected: value === option }}>
          <Text style={[styles.segmentText, value === option && styles.segmentTextActive]} numberOfLines={1}>{option.charAt(0).toUpperCase() + option.slice(1).replace(/_/g, " ")}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function KpiCard({ title, value, detail, tone = "neutral" }: { title: string; value: string; detail?: string; tone?: "neutral" | "positive" | "negative" | "info" }) {
  const color = tone === "positive" ? colors.success : tone === "negative" ? colors.danger : tone === "info" ? colors.blue600 : colors.textPrimary;
  const bg = tone === "positive" ? "#f2fffa" : tone === "negative" ? "#fff7f9" : tone === "info" ? "#f6faff" : colors.surface;
  return (
    <AppCard style={[styles.kpi, { backgroundColor: bg }]}>
      <Text style={styles.kpiLabel}>{title}</Text>
      <Text style={[styles.kpiValue, { color }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.48}>{value}</Text>
      {detail ? <Text style={styles.kpiDetail}>{detail}</Text> : null}
    </AppCard>
  );
}

export function SearchInput({ value, onChangeText, placeholder }: { value: string; onChangeText: (text: string) => void; placeholder: string }) {
  return (
    <View style={styles.search}>
      <Ionicons name="search-outline" size={18} color={colors.gray500} />
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.gray400} style={styles.searchInput} autoCapitalize="none" returnKeyType="search" accessibilityLabel={placeholder} />
      {value ? <Pressable onPress={() => onChangeText("")} accessibilityLabel="Clear search" hitSlop={8}><Ionicons name="close-circle" size={18} color={colors.gray400} /></Pressable> : null}
    </View>
  );
}

export function FormField({ label, icon, value, onChangeText, placeholder, keyboardType, multiline = false, required = false, prefix, suffix, autoCapitalize }: {
  label: string; icon: IconName; value: string; onChangeText: (text: string) => void; placeholder?: string;
  keyboardType?: KeyboardTypeOptions; multiline?: boolean; required?: boolean; prefix?: string; suffix?: string; autoCapitalize?: TextInputProps["autoCapitalize"];
}) {
  return <View style={styles.fieldBlock}>
    <Text style={styles.fieldLabel}>{label}{required ? <Text style={{ color: colors.rose600 }}> *</Text> : null}</Text>
    <View style={[styles.fieldControl, multiline && { alignItems: "flex-start", minHeight: 74 }]}>
      <View style={styles.fieldIcon}>{prefix ? <Text style={styles.fieldPrefix}>{prefix}</Text> : <Ionicons name={icon} size={18} color={colors.primary} />}</View>
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.gray400} keyboardType={keyboardType} autoCapitalize={autoCapitalize} multiline={multiline} style={[styles.fieldInput, multiline && { minHeight: 70, textAlignVertical: "top", paddingTop: 10 }]} accessibilityLabel={label} />
      {suffix ? <Text style={styles.fieldSuffix}>{suffix}</Text> : null}
    </View>
  </View>;
}

export function SelectField({ label, icon, value, onPress, required = false }: { label: string; icon: IconName; value: string; onPress: () => void; required?: boolean }) {
  return <View style={styles.fieldBlock}>
    <Text style={styles.fieldLabel}>{label}{required ? <Text style={{ color: colors.rose600 }}> *</Text> : null}</Text>
    <Pressable style={styles.fieldControl} onPress={onPress} accessibilityRole="button" accessibilityLabel={`${label}: ${value}`}>
      <View style={styles.fieldIcon}><Ionicons name={icon} size={18} color={colors.primary} /></View>
      <Text style={styles.fieldValue} numberOfLines={1}>{value}</Text>
      <Ionicons name="chevron-forward" size={17} color={colors.gray500} style={{ marginRight: spacing.md }} />
    </Pressable>
  </View>;
}

export function EmptyState({ icon = "document-outline", title, description }: { icon?: IconName; title: string; description: string }) {
  return <View style={styles.empty}><IconTile icon={icon} tone="blue" size={52} /><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.emptyDescription}>{description}</Text></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  card: { backgroundColor: colors.surface, borderRadius: radius.large, borderWidth: 1, borderColor: colors.border, padding: spacing.md, ...shadows.card },
  button: { minHeight: controlHeight.button, borderRadius: radius.medium, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: spacing.sm, paddingHorizontal: spacing.lg },
  buttonSecondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primary },
  buttonText: { color: "#fff", fontSize: uiType.body, fontWeight: "700" },
  buttonTextSecondary: { color: colors.primary },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.45 },
  badge: { alignSelf: "flex-start", borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  badgeText: { fontSize: uiType.caption, fontWeight: "700" },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  sectionTitle: { color: colors.textPrimary, fontSize: uiType.sectionTitle, fontWeight: "800" },
  sectionAction: { color: colors.blue600, fontSize: uiType.secondary, fontWeight: "700" },
  segmented: { flexDirection: "row", gap: 4, marginBottom: spacing.md },
  segment: { backgroundColor: "#f0f4fa", borderRadius: radius.small, minHeight: 32, flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  segmentActive: { backgroundColor: colors.primary },
  segmentText: { fontSize: uiType.caption, color: colors.gray600, fontWeight: "600" },
  segmentTextActive: { color: "#fff" },
  kpi: { flex: 1, minWidth: 0, minHeight: 86, justifyContent: "center", padding: spacing.sm },
  kpiLabel: { color: colors.gray600, fontSize: uiType.caption, fontWeight: "600" },
  kpiValue: { width: "100%", fontSize: uiType.amount, fontWeight: "800", marginTop: 3, includeFontPadding: false },
  kpiDetail: { color: colors.gray500, fontSize: uiType.caption, marginTop: 3 },
  search: { height: controlHeight.input, borderRadius: radius.medium, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.sm },
  searchInput: { flex: 1, minWidth: 0, color: colors.textPrimary, fontSize: uiType.body, paddingVertical: 0 },
  fieldBlock: { marginBottom: spacing.md },
  fieldLabel: { fontSize: uiType.secondary, color: colors.gray700, fontWeight: "600", marginBottom: 5 },
  fieldControl: { minHeight: controlHeight.input, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.medium, flexDirection: "row", alignItems: "center", overflow: "hidden" },
  fieldIcon: { width: 40, minHeight: controlHeight.input - 2, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceSoft },
  fieldPrefix: { color: colors.primary, fontSize: uiType.body, fontWeight: "800" },
  fieldSuffix: { color: colors.gray500, fontSize: uiType.body, fontWeight: "700", paddingHorizontal: spacing.md },
  fieldInput: { flex: 1, minWidth: 0, color: colors.textPrimary, fontSize: uiType.body, paddingHorizontal: spacing.md, paddingVertical: 0 },
  fieldValue: { flex: 1, minWidth: 0, color: colors.textPrimary, fontSize: uiType.body, paddingHorizontal: spacing.md },
  empty: { alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.xxl, paddingVertical: spacing.xxxl },
  emptyTitle: { color: colors.textPrimary, fontSize: uiType.sectionTitle, fontWeight: "700", marginTop: spacing.md },
  emptyDescription: { color: colors.textSecondary, fontSize: uiType.secondary, textAlign: "center", marginTop: spacing.xs, lineHeight: 18 },
});
