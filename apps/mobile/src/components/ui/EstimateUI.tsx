import { StyleSheet } from "react-native";
import { AppButton } from "./FinanceUI";
import { spacing } from "../../theme/tokens";
import { SafeActionFooter } from "./SafeActionFooter";

export const estimateProgressLabels = ["Basic Info", "Items", "Totals", "Extras"] as const;

export function EstimateFlowFooter({ onBack, onNext, nextLabel, nextIcon = "arrow-forward", disabled = false }: {
  onBack?: () => void;
  onNext: () => void;
  nextLabel: string;
  nextIcon?: "arrow-forward" | "paper-plane-outline" | "checkmark";
  disabled?: boolean;
}) {
  return <SafeActionFooter horizontal>
    {onBack ? <AppButton label="Back" icon="arrow-back" variant="secondary" onPress={onBack} style={styles.back} /> : null}
    <AppButton label={nextLabel} icon={nextIcon} onPress={onNext} disabled={disabled} style={styles.next} />
  </SafeActionFooter>;
}

const styles = StyleSheet.create({
  back: { flex: 0.75 },
  next: { flex: 1.7 },
});
