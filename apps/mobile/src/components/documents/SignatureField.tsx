import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { useSalesSetup } from "../../contexts/SalesSetupContext";
import { SignaturePad } from "./SignaturePad";
import { colors, radius, spacing, uiType } from "../../theme/tokens";

/** Shows the saved drawn signature (if any) and lets the person draw or redraw it without leaving the document. */
export function SignatureField() {
  const { businessProfile, saveBusinessProfile } = useSalesSetup();
  const [open, setOpen] = useState(false);
  const ink = businessProfile.signature;
  const w = 150, h = ink ? Math.min(60, w / ink.aspect) : 0;
  const d = ink ? ink.strokes.map((s) => s.map(([x, y], i) => `${i === 0 ? "M" : "L"}${(x * w).toFixed(1)} ${(y * h).toFixed(1)}`).join(" ")).join(" ") : "";
  return (
    <View style={styles.box}>
      {ink ? <View style={styles.preview}><Svg width={w} height={h}><Path d={d} stroke="#111827" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none" /></Svg></View> : <Text style={styles.empty}>No signature saved yet.</Text>}
      <Pressable style={styles.btn} onPress={() => setOpen(true)} accessibilityRole="button"><Ionicons name="pencil" size={16} color="#fff" /><Text style={styles.btnText}>{ink ? "Redraw signature" : "Draw signature"}</Text></Pressable>
      <SignaturePad visible={open} onClose={() => setOpen(false)} onSave={(next) => { saveBusinessProfile({ ...businessProfile, signature: next }); setOpen(false); }} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: spacing.sm, marginBottom: spacing.md },
  preview: { alignSelf: "flex-start", padding: spacing.sm, borderRadius: radius.medium, borderWidth: 1, borderColor: colors.border, backgroundColor: "#fff" },
  empty: { color: colors.gray500, fontSize: uiType.caption },
  btn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, minHeight: 44, borderRadius: radius.medium, backgroundColor: colors.primary },
  btnText: { color: "#fff", fontWeight: "800", fontSize: uiType.body },
});
