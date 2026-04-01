import { useMemo, useState } from "react";
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
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";
import { colors, gradients, type as typeScale } from "../theme/tokens";
import type { RootStackParamList } from "../navigation/types";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { useAuth } from "../contexts/AuthContext";
import { usePreferences } from "../contexts/PreferencesContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { DocTx } from "../types/transaction";

/** Category totals for transactions linked to this account */
function categoryTotals(txs: DocTx[]) {
  const m = new Map<string, number>();
  for (const t of txs) {
    if (t.type !== "expense") continue;
    m.set(t.category, (m.get(t.category) ?? 0) + t.amount);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

export function AccountDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "AccountDetail">>();
  const { workspace, ready } = useWorkspace();
  const { user } = useAuth();
  const { formatMoney } = usePreferences();
  const accountId = route.params.accountId as Id<"accounts">;

  const acc = useQuery(api.accounts.get, ready ? { id: accountId, workspace } : "skip");
  const txs = useQuery(
    api.transactions.list,
    ready ? { workspace, userId: user?.id, accountId: String(accountId) } : "skip",
  );
  const updateAcc = useMutation(api.accounts.update);

  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBalance, setEditBalance] = useState("");

  const byCat = useMemo(() => categoryTotals((txs ?? []) as DocTx[]), [txs]);

  function openEdit() {
    if (!acc) return;
    setEditName(acc.name);
    setEditBalance(String(acc.balance));
    setEditOpen(true);
  }

  async function saveEdit() {
    if (!acc) return;
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
    await updateAcc({ id: accountId, name: n, balance: bal });
    setEditOpen(false);
  }

  const loading = !ready || acc === undefined;

  return (
    <LinearGradient colors={[...gradients.page]} style={styles.flex}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.gray900} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Account
        </Text>
        <Pressable onPress={openEdit} hitSlop={12}>
          <Text style={styles.headerLink}>Edit</Text>
        </Pressable>
      </View>

      {loading || !acc ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.pad} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <View style={styles.iconWrap}>
              <Ionicons name="wallet-outline" size={32} color={colors.primary} />
            </View>
            <Text style={styles.accName}>{acc.name}</Text>
            <Text style={[styles.balance, acc.balance < 0 ? styles.neg : styles.pos]} numberOfLines={1} adjustsFontSizeToFit>
              {formatMoney(acc.balance)}
            </Text>
            <Text style={styles.caption}>Current balance (after linked transactions)</Text>
          </View>

          <Text style={styles.sectionHdr}>Spending by category (this account)</Text>
          {byCat.length === 0 ? (
            <Text style={styles.muted}>No expense transactions linked yet.</Text>
          ) : (
            <View style={styles.card}>
              {byCat.map(([cat, amt]) => (
                <Pressable
                  key={cat}
                  style={styles.catRow}
                  onPress={() => navigation.navigate("CategoryBreakdown", { category: cat })}
                >
                  <Text style={styles.catName}>{cat}</Text>
                  <Text style={styles.catAmt} numberOfLines={1}>
                    {formatMoney(amt)}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.gray400} />
                </Pressable>
              ))}
            </View>
          )}

          <Text style={styles.sectionHdr}>Transactions</Text>
          {(txs ?? []).length === 0 ? (
            <Text style={styles.muted}>No transactions use this account.</Text>
          ) : (
            (txs as DocTx[]).map((tx) => (
              <Pressable
                key={tx.id}
                style={styles.txRow}
                onPress={() => navigation.navigate("TransactionDetail", { transactionId: tx.id })}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.txMer}>{tx.merchant || tx.category}</Text>
                  <Text style={styles.txMeta}>
                    {tx.date} · {tx.category}
                  </Text>
                </View>
                <Text style={[styles.txAmt, tx.type === "expense" ? styles.neg : styles.pos]} numberOfLines={1}>
                  {tx.type === "expense" ? "-" : "+"}
                  {formatMoney(tx.amount)}
                </Text>
              </Pressable>
            ))
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

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
              <Text style={styles.modalPrimaryTxt}>Save</Text>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray200,
    backgroundColor: "rgba(255,255,255,0.95)",
  },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "700", color: colors.gray900 },
  headerLink: { fontSize: 16, fontWeight: "700", color: colors.primary },
  pad: { padding: 16 },
  hero: { alignItems: "center", marginBottom: 24 },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: colors.emerald50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  accName: { fontSize: typeScale.headline, fontWeight: "800", color: colors.gray900 },
  balance: { fontSize: 32, fontWeight: "800", marginTop: 6 },
  pos: { color: colors.green600 },
  neg: { color: colors.rose600 },
  caption: { fontSize: typeScale.sm, color: colors.gray500, marginTop: 6, textAlign: "center" },
  sectionHdr: {
    fontSize: typeScale.xs,
    fontWeight: "800",
    color: colors.gray500,
    marginBottom: 10,
    marginTop: 8,
    letterSpacing: 0.6,
  },
  muted: { fontSize: typeScale.body, color: colors.gray500, marginBottom: 12 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.gray200,
    overflow: "hidden",
    marginBottom: 16,
  },
  catRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray100,
    gap: 8,
  },
  catName: { flex: 1, fontSize: typeScale.body, fontWeight: "600", color: colors.gray900 },
  catAmt: { fontSize: typeScale.body, fontWeight: "700", color: colors.rose600 },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  txMer: { fontSize: typeScale.bodyStrong, fontWeight: "600", color: colors.gray900 },
  txMeta: { fontSize: typeScale.sm, color: colors.gray500, marginTop: 2 },
  txAmt: { fontSize: typeScale.bodyStrong, fontWeight: "700" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16 },
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
