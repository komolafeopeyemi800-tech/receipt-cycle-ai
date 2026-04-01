import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { colors, type as typeScale } from "../theme/tokens";

/**
 * Set budget sheet — layout inspired by the reference (title, category, limit, month, actions)
 * but styled for Receipt Cycle (teal primary, light surfaces, compact type scale).
 */
type Props = {
  visible: boolean;
  onClose: () => void;
  categoryName: string;
  categoryColor: string;
  monthYm: string;
  initialLimit: string;
  onConfirm: (limitAmount: number) => void | Promise<void>;
};

function monthLabel(ym: string) {
  const [y, m] = ym.split("-").map((x) => parseInt(x, 10));
  if (!Number.isFinite(y) || !Number.isFinite(m)) return ym;
  const d = new Date(y, m - 1, 1);
  return d.toLocaleString("en-US", { month: "long", year: "numeric" });
}

export function SetBudgetModal({
  visible,
  onClose,
  categoryName,
  categoryColor,
  monthYm,
  initialLimit,
  onConfirm,
}: Props) {
  const [limit, setLimit] = useState(initialLimit);

  useEffect(() => {
    if (visible) setLimit(initialLimit);
  }, [visible, initialLimit]);

  async function submit() {
    const n = parseFloat(limit.replace(/,/g, ""));
    if (!Number.isFinite(n) || n <= 0) return;
    await onConfirm(n);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.flex}>
        <Pressable style={styles.dim} onPress={onClose} accessibilityLabel="Close" />
        <KeyboardAvoidingView
          style={styles.center}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          pointerEvents="box-none"
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheet}>
              <Text style={styles.title}>Set budget</Text>

              <View style={styles.catRow}>
                <View style={[styles.catIconWrap, { borderColor: categoryColor }]}>
                  <View style={[styles.catDot, { backgroundColor: categoryColor }]} />
                </View>
                <Text style={styles.catName} numberOfLines={2}>
                  {categoryName}
                </Text>
              </View>

              <Text style={styles.limitLbl}>Limit</Text>
              <TextInput
                style={styles.input}
                value={limit}
                onChangeText={setLimit}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={colors.gray400}
              />

              <Text style={styles.monthHint}>
                Month: {monthLabel(monthYm)}
              </Text>

              <View style={styles.actions}>
                <Pressable style={styles.btnSecondary} onPress={onClose}>
                  <Text style={styles.btnSecondaryTxt}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.btnPrimary} onPress={() => void submit()}>
                  <Text style={styles.btnPrimaryTxt}>Set</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,23,42,0.4)",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 22,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.gray200,
    paddingHorizontal: 16,
    paddingVertical: 18,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: typeScale.title,
    fontWeight: "700",
    color: colors.gray900,
    textAlign: "center",
    marginBottom: 14,
  },
  catRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    backgroundColor: colors.gray100,
    marginBottom: 14,
  },
  catIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  catDot: { width: 14, height: 14, borderRadius: 7 },
  catName: {
    flex: 1,
    fontSize: typeScale.bodyStrong,
    fontWeight: "600",
    color: colors.gray900,
  },
  limitLbl: {
    fontSize: typeScale.sm,
    fontWeight: "600",
    color: colors.gray600,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 12,
    fontSize: typeScale.bodyStrong,
    color: colors.gray900,
    backgroundColor: colors.surface,
    marginBottom: 8,
  },
  monthHint: {
    fontSize: typeScale.sm,
    color: colors.gray500,
    marginBottom: 16,
  },
  actions: { flexDirection: "row", gap: 10, justifyContent: "space-between" },
  btnSecondary: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.gray200,
    backgroundColor: colors.gray100,
    alignItems: "center",
    justifyContent: "center",
  },
  btnSecondaryTxt: {
    fontSize: typeScale.body,
    fontWeight: "700",
    color: colors.gray700,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  btnPrimary: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimaryTxt: {
    fontSize: typeScale.body,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
});
