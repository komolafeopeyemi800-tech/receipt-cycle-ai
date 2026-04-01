import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, gradients, type as typeScale } from "../theme/tokens";
import type { MainTabParamList, RootStackParamList } from "../navigation/types";

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, "Records">,
  NativeStackNavigationProp<RootStackParamList>
>;

/** Primary actions — compact row (circle + short label), same destinations as before. */
const actions = [
  {
    id: "scan",
    icon: "camera-outline" as const,
    label: "Scan",
    scheme: "scan" as const,
    variant: "hero" as const,
  },
  {
    id: "upload",
    icon: "cloud-upload-outline" as const,
    label: "Upload",
    scheme: "statement" as const,
    variant: "blue" as const,
  },
  {
    id: "manual",
    icon: "add-circle-outline" as const,
    label: "Add",
    scheme: "manual" as const,
    variant: "purple" as const,
  },
  {
    id: "budget",
    icon: "pie-chart-outline" as const,
    label: "Budget",
    scheme: "budget" as const,
    variant: "amber" as const,
  },
];

export function QuickActionsRow() {
  const navigation = useNavigation<Nav>();

  const onPress = (scheme: (typeof actions)[number]["scheme"]) => {
    if (scheme === "scan") {
      navigation.getParent()?.navigate("ScanReceipt" as never);
      return;
    }
    if (scheme === "statement") {
      navigation.getParent()?.navigate("UploadStatement" as never);
      return;
    }
    if (scheme === "manual") {
      navigation.getParent()?.navigate("AddTransaction", {});
      return;
    }
    if (scheme === "budget") {
      navigation.navigate("Budgets");
    }
  };

  return (
    <View style={styles.row}>
      {actions.map((a) => (
        <Pressable
          key={a.id}
          onPress={() => onPress(a.scheme)}
          style={({ pressed }) => [styles.item, pressed && { opacity: 0.9 }]}
        >
          {a.variant === "hero" ? (
            <LinearGradient colors={[...gradients.heroIcon]} style={styles.circle}>
              <Ionicons name={a.icon} size={18} color="#fff" />
            </LinearGradient>
          ) : (
            <View
              style={[
                styles.circle,
                a.variant === "blue" && { backgroundColor: "#dbeafe", borderColor: "#bfdbfe" },
                a.variant === "purple" && { backgroundColor: "#f3e8ff", borderColor: "#e9d5ff" },
                a.variant === "amber" && { backgroundColor: "#fffbeb", borderColor: "#fde68a" },
              ]}
            >
              <Ionicons
                name={a.icon}
                size={18}
                color={
                  a.variant === "blue"
                    ? colors.blue600
                    : a.variant === "purple"
                      ? colors.purple600
                      : colors.amber600
                }
              />
            </View>
          )}
          <Text style={styles.lbl} numberOfLines={1}>
            {a.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  item: {
    flex: 1,
    alignItems: "center",
    maxWidth: "25%",
    paddingVertical: 2,
  },
  circle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gray100,
    borderWidth: 1,
    borderColor: colors.gray200,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  lbl: {
    fontSize: typeScale.xs,
    fontWeight: "600",
    color: colors.gray600,
    textAlign: "center",
  },
});
