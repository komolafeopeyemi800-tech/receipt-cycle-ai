import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { SavedLocation } from "../lib/preferences";
import { usePreferences } from "../contexts/PreferencesContext";
import { colors, gradients, type as typeScale } from "../theme/tokens";
import type { RootStackParamList } from "../navigation/types";

function id() {
  return `loc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function SavedLocationsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { locations, setLocations } = usePreferences();
  const [label, setLabel] = useState("");
  const [address, setAddress] = useState("");

  function add() {
    const l = label.trim();
    const a = address.trim();
    if (l.length < 2) {
      Alert.alert("Location", "Enter a label (e.g. Home, Office).");
      return;
    }
    const row: SavedLocation = { id: id(), label: l, address: a };
    void setLocations([...locations, row]);
    setLabel("");
    setAddress("");
  }

  function remove(loc: SavedLocation) {
    Alert.alert("Remove location", `Remove "${loc.label}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => void setLocations(locations.filter((x) => x.id !== loc.id)),
      },
    ]);
  }

  return (
    <LinearGradient colors={[...gradients.page]} style={styles.flex}>
      <View style={[styles.top, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={colors.gray900} />
        </Pressable>
        <Text style={styles.screenTitle}>Saved locations</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
        <Text style={styles.hint}>
          Store addresses for notes or future features. When you&apos;re signed in, locations sync to your account (Convex).
        </Text>
        <Text style={styles.lbl}>Label</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Home"
          placeholderTextColor={colors.gray400}
          value={label}
          onChangeText={setLabel}
        />
        <Text style={styles.lbl}>Address</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="Street, city, region"
          placeholderTextColor={colors.gray400}
          value={address}
          onChangeText={setAddress}
          multiline
        />
        <Pressable style={styles.primary} onPress={() => add()}>
          <Text style={styles.primaryTxt}>Add location</Text>
        </Pressable>

        <Text style={[styles.section, { marginTop: 20 }]}>SAVED</Text>
        <View style={styles.card}>
          {locations.length === 0 ? (
            <Text style={styles.empty}>No locations yet.</Text>
          ) : (
            locations.map((loc) => (
              <View key={loc.id} style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.locLabel}>{loc.label}</Text>
                  {loc.address ? <Text style={styles.locAddr}>{loc.address}</Text> : null}
                </View>
                <Pressable onPress={() => remove(loc)} hitSlop={12}>
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
  lbl: { fontSize: typeScale.xs, fontWeight: "600", color: colors.gray600, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: typeScale.body,
    backgroundColor: colors.surface,
    marginBottom: 10,
  },
  multiline: { minHeight: 72, textAlignVertical: "top" },
  primary: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 4,
  },
  primaryTxt: { color: "#fff", fontWeight: "700", fontSize: typeScale.body },
  section: { fontSize: typeScale.xs, fontWeight: "700", color: colors.gray500, letterSpacing: 0.6, marginBottom: 8 },
  card: {
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 12,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray200,
  },
  locLabel: { fontSize: typeScale.bodyStrong, fontWeight: "600", color: colors.gray900 },
  locAddr: { fontSize: typeScale.sm, color: colors.gray600, marginTop: 4, lineHeight: 18 },
  empty: { padding: 16, fontSize: typeScale.sm, color: colors.gray500, textAlign: "center" },
});
