import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { useAuth } from "../contexts/AuthContext";
import { colors, gradients, type as typeScale } from "../theme/tokens";
import type { RootStackParamList } from "../navigation/types";

export function AccountSettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, changePassword, resetMyData, deleteMyAccount } = useAuth();
  const { showActionSheetWithOptions } = useActionSheet();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSave() {
    if (next.length < 6) {
      Alert.alert("Password", "New password must be at least 6 characters.");
      return;
    }
    if (next !== confirm) {
      Alert.alert("Password", "New password and confirmation do not match.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await changePassword(current, next);
      if (error) {
        Alert.alert("Could not update", error.message);
        return;
      }
      setCurrent("");
      setNext("");
      setConfirm("");
      Alert.alert("Updated", "Your password has been changed.");
    } finally {
      setBusy(false);
    }
  }

  function openDangerActions() {
    const options = ["Reset records", "Delete account", "Cancel"];
    const cancelButtonIndex = 2;
    const destructiveButtonIndex = [0, 1];

    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        destructiveButtonIndex,
        title: "Account actions",
        message: "These actions are permanent.",
      },
      (selectedIndex) => {
        if (selectedIndex === 0) {
          Alert.alert("Reset all records?", "This removes your transactions and synced preferences from your account.", [
            { text: "Cancel", style: "cancel" },
            {
              text: "Reset",
              style: "destructive",
              onPress: () => {
                void (async () => {
                  setBusy(true);
                  try {
                    const { error } = await resetMyData();
                    if (error) {
                      Alert.alert("Reset failed", error.message);
                      return;
                    }
                    Alert.alert("Reset complete", "Your account data was cleared.");
                    navigation.navigate("Main", { screen: "Records" });
                  } finally {
                    setBusy(false);
                  }
                })();
              },
            },
          ]);
        } else if (selectedIndex === 1) {
          Alert.alert(
            "Delete account?",
            "This permanently deletes your account, sessions, transactions, and synced preferences.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Delete",
                style: "destructive",
                onPress: () => {
                  void (async () => {
                    setBusy(true);
                    try {
                      const { error } = await deleteMyAccount();
                      if (error) {
                        Alert.alert("Delete failed", error.message);
                        return;
                      }
                      Alert.alert("Account deleted", "Your account has been removed.");
                    } finally {
                      setBusy(false);
                    }
                  })();
                },
              },
            ],
          );
        }
      },
    );
  }

  return (
    <LinearGradient colors={[...gradients.page]} style={styles.flex}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
        keyboardVerticalOffset={insets.top + 8}
      >
        <View style={[styles.top, { paddingTop: Math.max(insets.top, 12) }]}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <Ionicons name="chevron-back" size={22} color={colors.gray900} />
          </Pressable>
          <Text style={styles.screenTitle}>Account settings</Text>
          <View style={{ width: 28 }} />
        </View>
        <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
          {user && (
            <View style={styles.profile}>
              <View style={styles.avatar}>
                <Text style={styles.avatarTxt}>{(user.email ?? "?").slice(0, 1).toUpperCase()}</Text>
              </View>
              <View>
                <Text style={styles.emailLbl}>Signed in as</Text>
                <Text style={styles.email}>{user.email}</Text>
                {user.name ? <Text style={styles.name}>{user.name}</Text> : null}
              </View>
            </View>
          )}

          <Text style={styles.section}>CHANGE PASSWORD</Text>
          <Text style={styles.hint}>
            Sign-in uses your email and password (same account on mobile and web). Use your account email — not a separate
            username.
          </Text>

          <Text style={styles.fieldLbl}>Current password</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            value={current}
            onChangeText={setCurrent}
            placeholder="••••••••"
            placeholderTextColor={colors.gray400}
            autoCapitalize="none"
          />

          <Text style={styles.fieldLbl}>New password</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            value={next}
            onChangeText={setNext}
            placeholder="At least 6 characters"
            placeholderTextColor={colors.gray400}
            autoCapitalize="none"
          />

          <Text style={styles.fieldLbl}>Confirm new password</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Repeat new password"
            placeholderTextColor={colors.gray400}
            autoCapitalize="none"
          />

          <Pressable style={[styles.btn, busy && { opacity: 0.75 }]} onPress={() => void onSave()} disabled={busy}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTxt}>Update password</Text>}
          </Pressable>

          <Text style={styles.section}>DANGER ZONE</Text>
          <Text style={styles.hint}>Reset records or permanently delete your account.</Text>
          <Pressable style={[styles.dangerBtn, busy && { opacity: 0.75 }]} disabled={busy} onPress={openDangerActions}>
            <Ionicons name="warning-outline" size={18} color={colors.rose600} />
            <Text style={styles.dangerBtnTxt}>Account actions</Text>
          </Pressable>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  profile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 24,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    backgroundColor: colors.surface,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarTxt: { color: "#fff", fontWeight: "700", fontSize: typeScale.title },
  emailLbl: { fontSize: typeScale.xs, color: colors.gray500, fontWeight: "600" },
  email: { fontSize: typeScale.bodyStrong, fontWeight: "700", color: colors.gray900, marginTop: 2 },
  name: { fontSize: typeScale.sm, color: colors.gray600, marginTop: 4 },
  section: {
    fontSize: typeScale.xs,
    fontWeight: "700",
    color: colors.gray500,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  hint: { fontSize: typeScale.sm, color: colors.gray600, marginBottom: 16, lineHeight: 20 },
  fieldLbl: { fontSize: typeScale.sm, fontWeight: "600", color: colors.gray800, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: typeScale.body,
    marginBottom: 14,
    backgroundColor: "#fff",
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  btnTxt: { color: "#fff", fontWeight: "700", fontSize: typeScale.bodyStrong },
  dangerBtn: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fff1f2",
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    flexDirection: "row",
  },
  dangerBtnTxt: { color: colors.rose600, fontWeight: "700", fontSize: typeScale.body },
});
