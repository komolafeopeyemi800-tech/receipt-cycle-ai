import { useEstimateFlow } from "../contexts/EstimateFlowContext";
import { useInvoiceFlow } from "../contexts/InvoiceFlowContext";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, type as typeScale } from "../theme/tokens";
import type { MainTabParamList, RootStackParamList } from "../navigation/types";
import { PremiumIcon } from "./ui/PremiumIcon";

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
    tone: "mint" as const,
  },
  {
    id: "upload",
    icon: "cloud-upload-outline" as const,
    label: "Upload",
    scheme: "statement" as const,
    tone: "blue" as const,
  },
  {
    id: "manual",
    icon: "add-circle-outline" as const,
    label: "Add",
    scheme: "manual" as const,
    tone: "purple" as const,
  },
  {
    id: "budget",
    icon: "pie-chart-outline" as const,
    label: "Budget",
    scheme: "budget" as const,
    tone: "amber" as const,
  },
  {
    id: "invoice",
    icon: "document-text-outline" as const,
    label: "Invoice",
    scheme: "invoice" as const,
    tone: "blue" as const,
  },
  {
    id: "estimate",
    icon: "clipboard-outline" as const,
    label: "Estimate",
    scheme: "estimate" as const,
    tone: "mint" as const,
  },
];

export function QuickActionsRow() {
  const navigation = useNavigation<Nav>();
  const { startNewInvoice } = useInvoiceFlow();
  const { startNewEstimate } = useEstimateFlow();

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
      navigation
        .getParent()
        ?.navigate("Main", { screen: "More", params: { screen: "Budgets" } });
      return;
    }
    if (scheme === "invoice") { startNewInvoice(); navigation.getParent()?.navigate("InvoiceCreate" as never); }
    if (scheme === "estimate") { startNewEstimate(); navigation.getParent()?.navigate("EstimateCreate" as never); }
  };

  return (
    <View style={styles.row}>
      {actions.map((a) => (
        <Pressable
          key={a.id}
          onPress={() => onPress(a.scheme)}
          style={({ pressed }) => [styles.item, pressed && { opacity: 0.9 }]}
        >
          <PremiumIcon icon={a.icon} tone={a.tone} size={44} />
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
    flexWrap: "wrap",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  item: {
    width: "33.333%",
    alignItems: "center",
    paddingVertical: 8,
  },
  lbl: {
    fontSize: typeScale.xs,
    fontWeight: "600",
    color: colors.gray600,
    textAlign: "center",
  },
});
