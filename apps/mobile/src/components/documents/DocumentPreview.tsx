import { useMemo, useState } from "react";
import { Image, LayoutChangeEvent, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { buildDocument, type DocInput, type Prim } from "../../features/documents/layout";

/** Draws the exact page layout the PDF is built from, scaled to the width it is given. */
export function DocumentPreview({ input }: { input: DocInput }) {
  const [width, setWidth] = useState(0);
  const layout = useMemo(() => buildDocument(input), [input]);
  const scale = width ? width / layout.w : 0;
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  return (
    <View onLayout={onLayout} style={styles.wrap}>
      {scale > 0 ? layout.pages.map((page, i) => (
        <View key={i} style={[styles.page, { width, height: layout.h * scale }]}>
          {page.map((p, j) => <Item key={j} p={p} s={scale} />)}
        </View>
      )) : null}
    </View>
  );
}

function Item({ p, s }: { p: Prim; s: number }) {
  if (p.t === "rect") {
    return <View pointerEvents="none" style={{ position: "absolute", left: p.x * s, top: p.y * s, width: p.w * s, height: p.h * s, backgroundColor: p.fill, borderColor: p.stroke, borderWidth: p.stroke ? Math.max(0.5, (p.lw ?? 0.6) * s) : 0 }} />;
  }
  if (p.t === "line") {
    const horizontal = Math.abs(p.y1 - p.y2) < 0.01;
    return <View pointerEvents="none" style={{ position: "absolute", left: Math.min(p.x1, p.x2) * s, top: Math.min(p.y1, p.y2) * s, width: Math.max(Math.abs(p.x2 - p.x1) * s, horizontal ? 0 : Math.max(0.5, p.lw * s)), height: horizontal ? Math.max(0.5, p.lw * s) : Math.abs(p.y2 - p.y1) * s, backgroundColor: p.color }} />;
  }
  if (p.t === "text") {
    return <Text pointerEvents="none" numberOfLines={1} allowFontScaling={false} style={{ position: "absolute", left: p.x * s, top: p.y * s, width: p.w * s, fontSize: p.size * s, lineHeight: p.size * 1.2 * s, color: p.color, fontWeight: p.bold ? "700" : "400", textAlign: p.align ?? "left", includeFontPadding: false }}>{p.text}</Text>;
  }
  if (p.t === "img") {
    return <Image source={{ uri: p.uri }} resizeMode="contain" style={{ position: "absolute", left: p.x * s, top: p.y * s, width: p.w * s, height: p.h * s }} />;
  }
  const d = p.ink.strokes.map((stroke) => stroke.map(([x, y], i) => `${i === 0 ? "M" : "L"}${(x * p.w * s).toFixed(1)} ${(y * p.h * s).toFixed(1)}`).join(" ")).join(" ");
  return <View pointerEvents="none" style={{ position: "absolute", left: p.x * s, top: p.y * s, width: p.w * s, height: p.h * s }}><Svg width={p.w * s} height={p.h * s}><Path d={d} stroke={p.color} strokeWidth={1.3 * s} strokeLinecap="round" strokeLinejoin="round" fill="none" /></Svg></View>;
}

const styles = StyleSheet.create({
  wrap: { width: "100%", gap: 12 },
  page: { backgroundColor: "#FFFFFF", overflow: "hidden", borderWidth: StyleSheet.hairlineWidth, borderColor: "#D9DDE3" },
});
