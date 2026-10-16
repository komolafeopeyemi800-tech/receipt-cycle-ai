import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Ellipse, Path } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { SubscriptionState } from "../lib/api";
import { spacing, uiType } from "../theme/tokens";

const MINT = "#68e0ca";
const DAY = 86_400_000;

/** One side of the laurel wreath: leaves along an arc. `flip` mirrors it for the right side. */
function Branch({ flip }: { flip?: boolean }) {
  const leaves = Array.from({ length: 9 }, (_, i) => {
    const angle = ((112 + i * 17.5) * Math.PI) / 180;
    const x = 66 + 52 * Math.cos(angle);
    const y = 80 + 62 * Math.sin(angle);
    const rotate = (angle * 180) / Math.PI + 90 + (i % 2 ? 36 : -36);
    return { x, y, rotate, key: i };
  });
  return (
    <Svg width={62} height={150} viewBox="0 0 62 150" style={flip ? { transform: [{ scaleX: -1 }] } : undefined}>
      <Path d="M58 14 C 20 34, 8 112, 56 140" stroke={MINT} strokeWidth={2} fill="none" strokeLinecap="round" opacity={0.9} />
      {leaves.map((l) => (
        <Ellipse key={l.key} cx={l.x - 8} cy={l.y - 4} rx={4.6} ry={10} fill={MINT} opacity={0.92} transform={`rotate(${l.rotate} ${l.x - 8} ${l.y - 4})`} />
      ))}
    </Svg>
  );
}

function Tile({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.tileValue}>{String(Math.max(0, value)).padStart(2, "0")}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

/**
 * Shown to free accounts on a later day, not on the day they sign up. Counts down to the exact moment the
 * 7-day trial ends. The laurel badge carries the real number of days left (no invented ratings or reviews).
 */
export function TrialAccessSheet({ visible, onDismiss, subscription }: { visible: boolean; onDismiss: () => void; subscription: SubscriptionState | null | undefined }) {
  const insets = useSafeAreaInsets();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!visible) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [visible]);

  const endsAt = subscription?.trialEndsAt ?? now;
  const left = Math.max(0, endsAt - now);
  const active = subscription?.phase === "trial" && left > 0;
  const days = Math.floor(left / DAY);
  const hours = Math.floor((left % DAY) / 3_600_000);
  const minutes = Math.floor((left % 3_600_000) / 60_000);
  const seconds = Math.floor((left % 60_000) / 1000);
  const daysShown = Math.ceil(left / DAY);
  const used = subscription?.trialAddsUsed ?? 0;
  const limit = subscription?.trialAddsLimit ?? 25;
  const exhausted = subscription?.phase === "trial_exhausted";

  const title = active ? `${daysShown} ${daysShown === 1 ? "day" : "days"} left in your free trial` : exhausted ? "You have used all 25 trial entries" : "Your free trial has ended";
  const copy = active
    ? "Scan receipts, speak your expenses and send invoices while your trial runs. Your records stay safe either way."
    : "Your records are still here and you can view them any time. Pro features are managed on the Receipt Cycle web version.";

  return (
    <Modal visible={visible} transparent={false} animationType="slide" onRequestClose={onDismiss} statusBarTranslucent navigationBarTranslucent>
      <LinearGradient colors={["#07131c", "#0b2528", "#07131c"]} style={styles.root}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.xl }]} showsVerticalScrollIndicator={false}>
          <View style={styles.badgeRow}>
            <Branch />
            <View style={styles.badgeCenter}>
              <Text style={styles.badgeNumber}>{active ? daysShown : 0}</Text>
              <Text style={styles.badgeCaption}>{active ? (daysShown === 1 ? "DAY LEFT" : "DAYS LEFT") : "TRIAL ENDED"}</Text>
            </View>
            <Branch flip />
          </View>
          <Text style={styles.eyebrow}>RECEIPT CYCLE</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.copy}>{copy}</Text>

          {active ? (
            <View style={styles.timer} accessibilityLabel={`${days} days ${hours} hours ${minutes} minutes left`}>
              <Tile value={days} label="DAYS" />
              <Text style={styles.colon}>:</Text>
              <Tile value={hours} label="HOURS" />
              <Text style={styles.colon}>:</Text>
              <Tile value={minutes} label="MIN" />
              <Text style={styles.colon}>:</Text>
              <Tile value={seconds} label="SEC" />
            </View>
          ) : null}

          <View style={styles.usage}>
            <View style={{ flex: 1 }}>
              <Text style={styles.usageLabel}>TRANSACTIONS USED</Text>
              <Text style={styles.usageValue}>{used} of {limit}</Text>
              <View style={styles.track}><View style={[styles.fill, { width: `${Math.min(100, Math.round((used / Math.max(1, limit)) * 100))}%` }]} /></View>
            </View>
            <View style={styles.usageIcon}><Ionicons name="receipt-outline" size={25} color={MINT} /></View>
          </View>

          <Text style={styles.included}>Included in your trial</Text>
          {[
            ["scan-outline", "Receipt capture", "Scan or upload receipts and review what was read"],
            ["mic-outline", "Voice and typed entry", "Say or type an expense and it becomes a record"],
            ["document-text-outline", "Invoices and estimates", "Create professional documents with your own logo"],
          ].map(([icon, name, text]) => (
            <View key={name} style={styles.benefit}>
              <View style={styles.benefitIcon}><Ionicons name={icon as "scan-outline"} size={23} color={MINT} /></View>
              <View style={{ flex: 1 }}><Text style={styles.benefitTitle}>{name}</Text><Text style={styles.benefitText}>{text}</Text></View>
            </View>
          ))}
          <Text style={styles.web}>Account plans and billing are managed on the Receipt Cycle web version.</Text>
        </ScrollView>
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <Pressable style={styles.cta} onPress={onDismiss} accessibilityRole="button">
            <Text style={styles.ctaText}>Continue to dashboard</Text>
            <Ionicons name="arrow-forward" size={19} color="#07131c" />
          </Pressable>
        </View>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: spacing.xl, paddingBottom: 132, alignItems: "center" },
  badgeRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: spacing.md },
  badgeCenter: { alignItems: "center", minWidth: 112 },
  badgeNumber: { color: "#fff", fontSize: 76, lineHeight: 84, fontWeight: "900" },
  badgeCaption: { color: MINT, fontSize: 12, fontWeight: "900", letterSpacing: 2, marginTop: -2 },
  eyebrow: { color: MINT, fontSize: 12, fontWeight: "900", letterSpacing: 1.8, marginTop: spacing.sm },
  title: { color: "#fff", fontSize: 30, lineHeight: 37, fontWeight: "900", textAlign: "center", marginTop: spacing.sm },
  copy: { color: "#a9bac2", fontSize: uiType.body, lineHeight: 23, textAlign: "center", marginTop: spacing.md, marginBottom: spacing.xl },
  timer: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: spacing.xl },
  tile: { width: 66, paddingVertical: 12, borderRadius: 16, backgroundColor: "#102a2e", borderWidth: 1, borderColor: "#1d4448", alignItems: "center" },
  tileValue: { color: "#fff", fontSize: 26, fontWeight: "900", fontVariant: ["tabular-nums"] },
  tileLabel: { color: "#8da4ad", fontSize: 10, fontWeight: "900", letterSpacing: 1.2, marginTop: 2 },
  colon: { color: MINT, fontSize: 22, fontWeight: "900", marginTop: -10 },
  usage: { alignSelf: "stretch", flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: "#102124", borderWidth: 1, borderColor: "#1d3a3d", borderRadius: 22, padding: spacing.lg },
  usageLabel: { color: "#8da4ad", fontSize: 11, fontWeight: "900", letterSpacing: 1.1 },
  usageValue: { color: "#fff", fontSize: 24, lineHeight: 30, fontWeight: "900", marginTop: 4 },
  track: { height: 6, borderRadius: 3, backgroundColor: "#1d3a3d", marginTop: 10, overflow: "hidden" },
  fill: { height: 6, borderRadius: 3, backgroundColor: MINT },
  usageIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: "#19393c", alignItems: "center", justifyContent: "center" },
  included: { alignSelf: "flex-start", color: "#fff", fontSize: 18, fontWeight: "800", marginTop: spacing.xl, marginBottom: spacing.md },
  benefit: { alignSelf: "stretch", flexDirection: "row", gap: spacing.md, alignItems: "center", backgroundColor: "#0e1c22", borderRadius: 20, padding: spacing.md, marginBottom: spacing.sm },
  benefitIcon: { width: 50, height: 50, borderRadius: 16, backgroundColor: "#173035", alignItems: "center", justifyContent: "center" },
  benefitTitle: { color: "#fff", fontSize: uiType.body, fontWeight: "800" },
  benefitText: { color: "#9db0b8", fontSize: uiType.caption, lineHeight: 18, marginTop: 2 },
  web: { color: "#7f939b", fontSize: uiType.caption, textAlign: "center", marginTop: spacing.lg },
  footer: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: spacing.lg, paddingTop: spacing.md, backgroundColor: "#07131c", borderTopWidth: 1, borderTopColor: "#173035" },
  cta: { minHeight: 56, borderRadius: 18, backgroundColor: MINT, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  ctaText: { color: "#07131c", fontSize: 17, fontWeight: "900" },
});
