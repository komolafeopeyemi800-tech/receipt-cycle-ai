import { useMemo, useRef, useState } from "react";
import { Modal, PanResponder, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { colors, radius, spacing, uiType } from "../../theme/tokens";
import type { SignatureInk } from "../../features/documents/layout";

type Pt = [number, number];

/** A full-width pad to sign with a finger. Saves normalised strokes so the signature stays crisp at any size. */
export function SignaturePad({ visible, onClose, onSave }: { visible: boolean; onClose: () => void; onSave: (ink: SignatureInk) => void }) {
  const [strokes, setStrokes] = useState<Pt[][]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const live = useRef<Pt[] | null>(null);
  const sizeRef = useRef(size);
  sizeRef.current = size;

  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: (e) => {
      live.current = [[e.nativeEvent.locationX, e.nativeEvent.locationY]];
      setStrokes((s) => [...s, live.current as Pt[]]);
    },
    onPanResponderMove: (e) => {
      if (!live.current) return;
      const { w, h } = sizeRef.current;
      const x = Math.min(Math.max(e.nativeEvent.locationX, 0), w), y = Math.min(Math.max(e.nativeEvent.locationY, 0), h);
      live.current = [...live.current, [x, y]];
      const current = live.current;
      setStrokes((s) => [...s.slice(0, -1), current]);
    },
    onPanResponderRelease: () => { live.current = null; },
    onPanResponderTerminate: () => { live.current = null; },
  }), []);

  const pathFor = (stroke: Pt[]) => stroke.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ") + (stroke.length === 1 ? ` L${(stroke[0][0] + 0.1).toFixed(1)} ${stroke[0][1].toFixed(1)}` : "");

  function save() {
    const { w, h } = size;
    if (!strokes.length || !w || !h) return;
    // Trim empty margins so the signature fills the space it is printed in.
    const xs = strokes.flat().map((p) => p[0]), ys = strokes.flat().map((p) => p[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const bw = Math.max(maxX - minX, 8), bh = Math.max(maxY - minY, 8);
    const norm = strokes.map((stroke) => stroke.map(([x, y]) => [Math.round(((x - minX) / bw) * 1000) / 1000, Math.round(((y - minY) / bh) * 1000) / 1000]));
    onSave({ strokes: norm, aspect: Math.min(Math.max(bw / bh, 0.8), 6) });
    setStrokes([]);
  }

  function close() { setStrokes([]); onClose(); }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Draw your signature</Text>
          <Text style={styles.sub}>Sign with your finger inside the box.</Text>
          <View style={styles.pad} onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })} {...responder.panHandlers}>
            <View style={styles.baseline} pointerEvents="none" />
            <Svg width="100%" height="100%" pointerEvents="none">
              {strokes.map((stroke, i) => <Path key={i} d={pathFor(stroke)} stroke="#111827" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />)}
            </Svg>
            {!strokes.length ? <Text style={styles.hint} pointerEvents="none">Sign here</Text> : null}
          </View>
          <View style={styles.row}>
            <Pressable style={[styles.btn, styles.ghost]} onPress={() => setStrokes([])} accessibilityRole="button"><Text style={styles.ghostText}>Clear</Text></Pressable>
            <Pressable style={[styles.btn, styles.ghost]} onPress={close} accessibilityRole="button"><Text style={styles.ghostText}>Cancel</Text></Pressable>
            <Pressable style={[styles.btn, styles.solid, !strokes.length && { opacity: 0.45 }]} disabled={!strokes.length} onPress={save} accessibilityRole="button"><Text style={styles.solidText}>Save</Text></Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(15,23,42,0.5)", justifyContent: "flex-end" },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { color: colors.textPrimary, fontSize: 20, fontWeight: "800" },
  sub: { color: colors.gray500, fontSize: uiType.body, marginTop: 4, marginBottom: spacing.md },
  pad: { height: 230, borderRadius: radius.medium, borderWidth: 1, borderColor: colors.border, backgroundColor: "#FFFFFF", overflow: "hidden", justifyContent: "center" },
  baseline: { position: "absolute", left: 16, right: 16, bottom: 56, height: 1, backgroundColor: "#D1D5DB" },
  hint: { position: "absolute", alignSelf: "center", color: "#9CA3AF", fontSize: 18 },
  row: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },
  btn: { flex: 1, minHeight: 50, borderRadius: radius.medium, alignItems: "center", justifyContent: "center" },
  ghost: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  ghostText: { color: colors.textPrimary, fontWeight: "700", fontSize: uiType.body },
  solid: { backgroundColor: colors.primary },
  solidText: { color: "#fff", fontWeight: "800", fontSize: uiType.body },
});
