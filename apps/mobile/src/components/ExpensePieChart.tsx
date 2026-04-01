import { useMemo } from "react";
import { Pressable, useWindowDimensions, View, Text, StyleSheet } from "react-native";
import Svg, { G, Path } from "react-native-svg";
import { colors, type as typeScale } from "../theme/tokens";

type Slice = { label: string; value: number; color: string };

const PALETTE = ["#0f766e", "#2563eb", "#7c3aed", "#ea580c", "#db2777", "#0ea5e9", "#64748b"];

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polar(cx, cy, r, endAngle);
  const end = polar(cx, cy, r, startAngle);
  const large = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${cx} ${cy} L ${end.x} ${end.y} A ${r} ${r} 0 ${large} 1 ${start.x} ${start.y} Z`;
}

type Props = {
  data: { label: string; value: number }[];
  total: number;
  onSlicePress?: (label: string, value: number, percent: number) => void;
  formatMoney?: (n: number) => string;
};

export function ExpensePieChart({ data, total, onSlicePress, formatMoney }: Props) {
  const { width } = useWindowDimensions();
  const size = Math.min(216, Math.max(160, width - 64));
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;

  const slices: Slice[] = useMemo(() => {
    return data.map((d, i) => ({
      label: d.label,
      value: d.value,
      color: PALETTE[i % PALETTE.length],
    }));
  }, [data]);

  const paths = useMemo(() => {
    if (total <= 0 || slices.length === 0) return [];
    let angle = 0;
    return slices.map((s) => {
      const sweep = (s.value / total) * 360;
      const start = angle;
      const end = angle + sweep;
      angle = end;
      const d = arcPath(cx, cy, r, start, end);
      const pct = total > 0 ? (s.value / total) * 100 : 0;
      return { d, color: s.color, label: s.label, value: s.value, pct };
    });
  }, [slices, total, cx, cy, r]);

  if (total <= 0 || paths.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTxt}>No expense data for chart</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.hint}>Tap a slice or category below</Text>
      <View style={styles.chartBox}>
        <Svg width={size} height={size}>
          <G>
            {paths.map((p, i) => (
              <Path
                key={i}
                d={p.d}
                fill={p.color}
                stroke="#fff"
                strokeWidth={1.5}
                onPress={
                  onSlicePress
                    ? () => {
                        onSlicePress(p.label, p.value, p.pct);
                      }
                    : undefined
                }
              />
            ))}
          </G>
        </Svg>
      </View>
      <View style={styles.legend}>
        {paths.map((p, i) => (
          <Pressable
            key={i}
            style={styles.legRow}
            onPress={() => onSlicePress?.(p.label, p.value, p.pct)}
            disabled={!onSlicePress}
          >
            <View style={[styles.dot, { backgroundColor: p.color }]} />
            <Text style={styles.legLbl} numberOfLines={2}>
              {p.label}
            </Text>
            <View style={styles.legValCol}>
              <Text style={styles.legPct}>{p.pct.toFixed(0)}%</Text>
              {formatMoney ? (
                <Text style={styles.legMoney} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.55}>
                  {formatMoney(p.value)}
                </Text>
              ) : null}
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%", alignItems: "stretch", marginVertical: 8 },
  chartBox: { alignItems: "center", width: "100%" },
  hint: { fontSize: typeScale.sm, color: colors.gray500, marginBottom: 8, textAlign: "center", paddingHorizontal: 8 },
  empty: { padding: 16, alignItems: "center" },
  emptyTxt: { fontSize: typeScale.md, color: colors.gray500 },
  legend: { width: "100%", marginTop: 10, alignSelf: "stretch", paddingHorizontal: 4 },
  legRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
    paddingVertical: 2,
    minHeight: 34,
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 2, flexShrink: 0 },
  legLbl: {
    flex: 1,
    minWidth: 0,
    fontSize: typeScale.sm,
    color: colors.gray800,
    fontWeight: "600",
    lineHeight: 15,
  },
  legValCol: { width: 100, alignItems: "flex-end", flexShrink: 0 },
  legPct: { fontSize: typeScale.xs, color: colors.gray500, fontWeight: "600" },
  legMoney: { fontSize: typeScale.sm, color: colors.gray800, fontWeight: "700", marginTop: 2 },
});
