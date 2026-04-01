import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePreferences } from "../contexts/PreferencesContext";
import { colors, gradients, type as typeScale } from "../theme/tokens";
import type { RootStackParamList } from "../navigation/types";

export function MerchantsVendorsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { merchants, setMerchants } = usePreferences();
  const [addName, setAddName] = useState("");

  function add() {
    const n = addName.trim();
    if (n.length < 2) {
      Alert.alert("Merchant", "Enter at least 2 characters.");
      return;
    }
    if (merchants.includes(n)) {
      Alert.alert("Merchant", "Already in the list.");
      return;
    }
    void setMerchants([...merchants, n]);
    setAddName("");
  }

  function remove(name: string) {
    Alert.alert("Remove merchant", `Remove "${name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => void setMerchants(merchants.filter((m) => m !== name)),
      },
    ]);
  }

  return (
    <LinearGradient colors={[...gradients.page]} style={styles.flex}>
      <View style={[styles.top, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={colors.gray900} />
        </Pressable>
        <Text style={styles.screenTitle}>Merchants & vendors</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
        <Text style={styles.hint}>
          Saved names for quick entry. When you&apos;re signed in, this list syncs to your account (Convex).
        </Text>
        <View style={styles.addRow}>
          <TextInput
            style={styles.input}
            placeholder="Add merchant name"
            placeholderTextColor={colors.gray400}
            value={addName}
            onChangeText={setAddName}
            onSubmitEditing={() => add()}
          />
          <Pressable style={styles.addBtn} onPress={() => add()}>
            <Ionicons name="add" size={22} color="#fff" />
          </Pressable>
        </View>
        <View style={styles.card}>
          {merchants.length === 0 ? (
            <Text style={styles.empty}>No saved merchants yet.</Text>
          ) : (
            merchants.map((m) => (
              <View key={m} style={styles.row}>
                <Text style={styles.name}>{m}</Text>
                <Pressable onPress={() => remove(m)} hitSlop={12}>
                  <Ionicons name="trash-outline" size={20} color={colors.rose600} />
                </Pressable>
              </View>
            ))
          )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  screenTitle: { fontSize: typeScale.headline, fontWeight: "700", color: colors.gray900 },
  pad: { paddingHorizontal: 16, paddingBottom: 24 },
  hint: { fontSize: typeScale.sm, color: colors.gray600, marginBottom: 12, lineHeight: 18 },
  addRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: typeScale.body,
    backgroundColor: colors.surface,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 12,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray200,
  },
  name: { fontSize: typeScale.body, color: colors.gray900, flex: 1 },
  empty: { padding: 16, fontSize: typeScale.sm, color: colors.gray500, textAlign: "center" },
});
