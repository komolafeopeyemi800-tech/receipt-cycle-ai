import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { colors } from "../theme/tokens";

const TAB_ORDER = ["Records", "Analysis", "Budgets", "Accounts", "Categories"] as const;
const LEFT_TABS = ["Records", "Analysis"] as const;
const RIGHT_TABS = ["Budgets", "Accounts", "Categories"] as const;

type TabName = (typeof TAB_ORDER)[number];

const ICONS: Record<TabName, ComponentProps<typeof Ionicons>["name"]> = {
  Records: "file-tray-full-outline",
  Analysis: "stats-chart-outline",
  Budgets: "pie-chart-outline",
  Accounts: "wallet-outline",
  Categories: "grid-outline",
};

export function ReceiptCycleTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, Platform.OS === "ios" ? 8 : 6);
  const routeByName = Object.fromEntries(state.routes.map((r) => [r.name, r]));

  const openFab = () => {
    const parent = navigation.getParent();
    if (Platform.OS === "web") {
      parent?.navigate("UploadStatement" as never);
      return;
    }
    parent?.navigate("ScanReceipt" as never);
  };

  const renderTab = (name: TabName) => {
    const route = routeByName[name];
    if (!route) return null;
    const { options } = descriptors[route.key];
    const label =
      options.tabBarLabel !== undefined
        ? String(options.tabBarLabel)
        : options.title !== undefined
          ? String(options.title)
          : name;
    const index = state.routes.findIndex((r) => r.key === route.key);
    const isFocused = state.index === index;
    const icon = ICONS[name];

    return (
      <Pressable
        key={route.key}
        style={styles.tabBtn}
        onPress={() => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(name);
          }
        }}
      >
        <Ionicons name={icon} size={22} color={isFocused ? colors.primary : colors.gray400} />
        <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]} numberOfLines={1}>
          {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.wrap, { paddingBottom: bottomPad }]}>
      <View style={styles.barRow}>
        <View style={styles.tabsCluster}>
          <View style={styles.tabHalf}>{LEFT_TABS.map((n) => renderTab(n))}</View>
          <View style={styles.fabGap}>
            <Pressable
              style={styles.fab}
              onPress={openFab}
              accessibilityLabel={Platform.OS === "web" ? "Upload statement" : "Scan receipt"}
            >
              <Ionicons name="add" size={28} color="#fff" />
            </Pressable>
          </View>
          <View style={styles.tabHalf}>{RIGHT_TABS.map((n) => renderTab(n))}</View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: "rgba(255,255,255,0.98)",
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    paddingTop: 6,
    position: "relative",
  },
  barRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingLeft: 6,
    paddingRight: 6,
    minHeight: 52,
  },
  tabsCluster: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  tabHalf: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  fabGap: {
    width: 58,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 2,
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    gap: 3,
    paddingVertical: 2,
    minWidth: 0,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: "600",
    color: colors.gray400,
    maxWidth: "100%",
  },
  tabLabelActive: {
    color: colors.primary,
  },
  fab: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 10,
  },
});
