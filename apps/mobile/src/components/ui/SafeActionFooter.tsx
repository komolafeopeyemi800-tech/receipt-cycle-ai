import type { ReactNode } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing } from "../../theme/tokens";

export function SafeActionFooter({ children, horizontal = false }: { children: ReactNode; horizontal?: boolean }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.footer,
        horizontal && styles.horizontal,
        {
          // Some Android vendors report a zero/undersized bottom inset while the
          // three-button system navigation bar is visible. Keep primary actions
          // comfortably above it even on those devices.
          paddingBottom: Math.max(insets.bottom + spacing.sm, Platform.OS === "android" ? 36 : spacing.lg),
        },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  horizontal: { flexDirection: "row", gap: spacing.sm },
});
