import { Image, View } from "react-native";

type Props = { size?: number };

/** Official Receipt Cycle receipt mark, shared with the website and store artwork. */
export function ReceiptCycleLogo({ size = 56 }: Props) {
  return (
    <View style={{ width: size, height: size }}>
      <Image
        source={require("../../assets/icon.png")}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        resizeMode="contain"
        accessibilityLabel="Receipt Cycle"
      />
    </View>
  );
}
