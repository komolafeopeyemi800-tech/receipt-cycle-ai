import { StyleSheet, View } from "react-native";
import { AppButton } from "./FinanceUI";
import { colors, spacing } from "../../theme/tokens";

export const estimateProgressLabels = ["Basic Info", "Items", "Totals", "Extras"] as const;

export function EstimateFlowFooter({ onBack, onNext, nextLabel, nextIcon = "arrow-forward", disabled = false }: {
  onBack?: () => void;
  onNext: () => void;
  nextLabel: string;
  nextIcon?: "arrow-forward" | "paper-plane-outline" | "checkmark";
  disabled?: boolean;
}) {
  return <View style={styles.footer}>
    {onBack ? <AppButton label="Back" icon="arrow-back" variant="secondary" onPress={onBack} style={styles.back} /> : null}
    <AppButton label={nextLabel} icon={nextIcon} onPress={onNext} disabled={disabled} style={styles.next} />
  </View>;
}

const styles = StyleSheet.create({
  footer: { flexDirection: "row", gap: spacing.sm, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.divider, padding: spacing.lg },
  back: { flex: 0.75 },
  next: { flex: 1.7 },
});
