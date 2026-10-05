import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/tokens";
import type { MainTabParamList, RootStackParamList } from "../navigation/types";

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

type Props = {
  title: string;
  subtitle?: string;
  back?: boolean;
  rightIcon?: React.ComponentProps<typeof Ionicons>["name"];
  rightLabel?: string;
  onRightPress?: () => void;
};

export function ScreenHeader({ title, subtitle, back, rightIcon, rightLabel, onRightPress }: Props) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();

  return (
    <View style={[styles.bar, { paddingTop: Math.max(insets.top, 12) }]}>
      {back ? <Pressable style={styles.backBtn} onPress={() => navigation.goBack()} accessibilityLabel="Go back" hitSlop={8}><Ionicons name="arrow-back" size={22} color={colors.textPrimary} /></Pressable> : null}
      <View style={styles.left}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <Pressable
        style={[styles.avatarBtn, rightLabel ? styles.labelBtn : null]}
        onPress={onRightPress ?? (() => (navigation.getParent()?.getParent() ?? navigation.getParent())?.navigate("Settings" as never))}
        accessibilityLabel={rightLabel ?? (rightIcon ? title + " action" : "Profile and settings")}
        hitSlop={8}
      >
        {rightLabel ? <Text style={styles.rightLabel}>{rightLabel}</Text> : <Ionicons name={rightIcon ?? "person-circle-outline"} size={rightIcon ? 23 : 28} color={rightIcon ? colors.primary : colors.gray800} />}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 9,
    backgroundColor: "rgba(255,255,255,0.97)",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray200,
  },
  left: { flex: 1, marginRight: 12, minWidth: 0 },
  title: { fontSize: 20, fontWeight: "800", color: colors.textPrimary },
  subtitle: { fontSize: 12, color: colors.gray500, marginTop: 6 },
  avatarBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  labelBtn: { width: "auto", minWidth: 72, paddingHorizontal: 10, height: 34, borderRadius: 9, borderWidth: 1, borderColor: colors.primary },
  rightLabel: { color: colors.primary, fontSize: 12, fontWeight: "800" },
  backBtn: { width: 36, height: 36, justifyContent: "center", marginRight: 4 },
});
