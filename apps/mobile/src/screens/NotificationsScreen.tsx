import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { colors, gradients } from "../theme/tokens";

export function NotificationsScreen() {
  const navigation = useNavigation();
  return (
    <LinearGradient colors={[...gradients.page]} style={styles.flex}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.gray900} />
        </Pressable>
        <Text style={styles.title}>Notifications</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.card}>
        <Ionicons name="notifications-off-outline" size={40} color={colors.gray400} />
        <Text style={styles.body}>No new notifications yet.</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { fontSize: 18, fontWeight: "700", color: colors.gray900 },
  card: { padding: 32, alignItems: "center", gap: 12 },
  body: { fontSize: 15, color: colors.gray600 },
});
