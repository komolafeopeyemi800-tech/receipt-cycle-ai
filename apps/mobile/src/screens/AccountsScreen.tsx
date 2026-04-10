import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import type { Id } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";
import { colors, gradients, type as typeScale } from "../theme/tokens";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { useAuth } from "../contexts/AuthContext";
import type { ComponentProps } from "react";
import { ScreenHeader } from "../components/ScreenHeader";
import { usePreferences } from "../contexts/PreferencesContext";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { userFacingErrorFromUnknown } from "../lib/userFacingErrors";

type AccRow = { id: Id<"accounts">; name: string; balance: number; iconKey: string };

function faIcon(key?: string): ComponentProps<typeof Ionicons>["name"] {
  switch (key) {
    case "credit-card":
      return "card-outline";
    case "money-bill-wave":
      return "cash-outline";
    case "piggy-bank":
      return "wallet-outline";
    default:
      return "wallet-outline";
  }
}

export function AccountsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { workspace, ready } = useWorkspace();
  const { user } = useAuth();
  const { formatMoney } = usePreferences();
  const ensure = useMutation(api.accounts.ensureSeed);
  const createAcc = useMutation(api.accounts.create);
  const updateAcc = useMutation(api.accounts.update);
  const list = useQuery(api.accounts.list, ready ? { workspace } : "skip");

  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<AccRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editBalance, setEditBalance] = useState("");

  useEffect(() => {
    if (!ready) return;
    void ensure({ workspace });
  }, [ready, workspace, ensure]);

  const loading = !ready || list === undefined;

  async function addAccount() {
    const n = newName.trim();
    if (n.length < 2) {
      Alert.alert("Account", "Enter at least 2 characters.");
      return;
    }
    try {
      await createAcc({ workspace, name: n, balance: 0, iconKey: "wallet" });
      setNewName("");
      setAddOpen(false);
    } catch (e) {
      Alert.alert("Account", userFacingErrorFromUnknown(e));
    }
  }

  function openEdit(a: AccRow) {
    setEditing(a);
    setEditName(a.name);
    setEditBalance(String(a.balance));
    setEditOpen(true);
  }

  async function saveEdit() {
    if (!editing) return;
    const n = editName.trim();
    if (n.length < 2) {
      Alert.alert("Account", "Enter at least 2 characters.");
      return;
    }
    const bal = parseFloat(editBalance);
    if (!Number.isFinite(bal)) {
      Alert.alert("Account", "Enter a valid balance.");
      return;
    }
    try {
      await updateAcc({ id: editing.id, name: n, balance: bal });
      setEditOpen(false);
      setEditing(null);
    } catch (e) {
      Alert.alert("Account", userFacingErrorFromUnknown(e));
    }
  }

  return (
    <LinearGradient colors={[...gradients.page]} style={styles.flex}>
      <ScreenHeader title="Accounts" />
      <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
        <Pressable style={styles.primaryBtn} onPress={() => setAddOpen(true)}>
          <Ionicons name="add-circle-outline" size={20} color="#fff" />
          <Text style={styles.primaryBtnTxt}>Add account</Text>
        </Pressable>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
        ) : (
          (list ?? []).map((a) => (
            <Pressable
              key={String(a.id)}
              style={styles.row}
              onPress={() => navigation.navigate("AccountDetail", { accountId: String(a.id) })}
            >
              <View style={styles.iconWrap}>
                <Ionicons name={faIcon(a.iconKey)} size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{a.name}</Text>
                <Text style={styles.rowMeta}>Balances & transactions</Text>
              </View>
              <Text style={[styles.balance, a.balance < 0 ? styles.neg : styles.pos]} numberOfLines={1}>
                {formatMoney(a.balance)}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.gray400} />
            </Pressable>
          ))
        )}
        <View style={{ height: 120 }} />
      </ScrollView>

      <Modal visible={addOpen} transparent animationType="fade" onRequestClose={() => setAddOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setAddOpen(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>New account</Text>
            <TextInput
              style={styles.input}
              placeholder="Account name"
              value={newName}
              onChangeText={setNewName}
              placeholderTextColor={colors.gray400}
            />
            <Pressable style={styles.modalPrimary} onPress={() => void addAccount()}>
              <Text style={styles.modalPrimaryTxt}>Save</Text>
            </Pressable>
            <Pressable style={styles.modalGhost} onPress={() => setAddOpen(false)}>
              <Text style={styles.modalGhostTxt}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={editOpen} transparent animationType="fade" onRequestClose={() => setEditOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setEditOpen(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Edit account</Text>
            <Text style={styles.modalLbl}>Name</Text>
            <TextInput style={styles.input} value={editName} onChangeText={setEditName} placeholderTextColor={colors.gray400} />
            <Text style={styles.modalLbl}>Balance</Text>
            <TextInput
              style={styles.input}
              value={editBalance}
              onChangeText={setEditBalance}
              keyboardType="decimal-pad"
              placeholderTextColor={colors.gray400}
            />
            <Pressable style={styles.modalPrimary} onPress={() => void saveEdit()}>
              <Text style={styles.modalPrimaryTxt}>Save changes</Text>
            </Pressable>
            <Pressable style={styles.modalGhost} onPress={() => setEditOpen(false)}>
              <Text style={styles.modalGhostTxt}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pad: { paddingHorizontal: 16, paddingTop: 8 },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  primaryBtnTxt: { color: "#fff", fontWeight: "700", fontSize: typeScale.body },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.gray200,
    backgroundColor: colors.surface,
    marginBottom: 8,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.emerald50,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: { fontSize: typeScale.bodyStrong, fontWeight: "600", color: colors.gray900 },
  rowMeta: { fontSize: typeScale.sm, color: colors.gray500, marginTop: 2 },
  balance: { fontSize: typeScale.bodyStrong, fontWeight: "700", marginRight: 4 },
  pos: { color: colors.green600 },
  neg: { color: colors.rose600 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
  },
  modalTitle: { fontSize: 17, fontWeight: "700", color: colors.gray900, marginBottom: 12 },
  modalLbl: { fontSize: 12, fontWeight: "600", color: colors.gray600, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  modalPrimary: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalPrimaryTxt: { color: "#fff", fontWeight: "700" },
  modalGhost: { paddingVertical: 12, alignItems: "center" },
  modalGhostTxt: { color: colors.gray600, fontWeight: "600" },
});
