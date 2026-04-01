import { View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";

type Props = { size?: number };

/**
 * In-app mark: receipt + circular flow — professional finance identity for Receipt Cycle.
 * (Store icons: regenerate PNGs from this design in your design tool if needed.)
 */
export function ReceiptCycleLogo({ size = 56 }: Props) {
  const s = size;
  return (
    <View style={{ width: s, height: s }}>
      <Svg width={s} height={s} viewBox="0 0 64 64">
        <Rect x="4" y="4" width="56" height="56" rx="16" fill="#0f766e" />
        <Circle cx="32" cy="32" r="22" fill="none" stroke="#ecfdf5" strokeWidth="2.2" opacity={0.35} />
        <Path
          d="M20 28c0-4 3.5-7 8-7h12c3.3 0 6 2.2 6 5 0 2.8-2.2 4.5-5 5l-14 3.5c-2.8.7-5 2.4-5 5.2 0 2.8 2.7 5 6 5h10c4.5 0 8-3 8-7"
          fill="none"
          stroke="#ecfdf5"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <Path d="M44 22l4-3v8h-8" fill="none" stroke="#a7f3d0" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <Rect x="22" y="36" width="20" height="14" rx="2" fill="#ecfdf5" opacity={0.95} />
        <Path d="M26 40h12M26 44h8" stroke="#0f766e" strokeWidth="1.4" strokeLinecap="round" />
      </Svg>
    </View>
  );
}
