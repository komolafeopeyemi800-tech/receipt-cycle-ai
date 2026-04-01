import type { ComponentProps } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
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

export function TransactionDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "TransactionDetail">>();
  const { workspace, ready } = useWorkspace();
  const { user } = useAuth();
  const { formatMoney, formatDate } = usePreferences();
  const removeTx = useMutation(api.transactions.remove);

  const id = route.params.transactionId as Id<"transactions">;
  const tx = useQuery(api.transactions.get, ready && user?.id ? { id, userId: user.id } : "skip");
  const accounts = useQuery(api.accounts.list, ready ? { workspace } : "skip");

  const accountName =
    tx?.accountId && accounts ? accounts.find((a) => String(a.id) === String(tx.accountId))?.name : null;

  function onEdit() {
    navigation.navigate("AddTransaction", { transactionId: String(id) });
  }

  async function onDelete() {
    Alert.alert("Delete transaction?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          if (!user?.id) {
            Alert.alert("Sign in required", "Sign in to delete this transaction.");
            return;
          }
          await removeTx({ id, userId: user.id });
          navigation.goBack();
        },
      },
    ]);
  }

  if (!ready || tx === undefined) {
    return (
      <LinearGradient colors={[...gradients.page]} style={styles.flex}>
        <Text style={styles.loading}>Loading…</Text>
      </LinearGradient>
    );
  }

  if (tx === null) {
    return (
      <LinearGradient colors={[...gradients.page]} style={styles.flex}>
        <Pressable style={[styles.back, { top: insets.top + 8 }]} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.gray900} />
        </Pressable>
        <Text style={styles.loading}>Transaction not found.</Text>
      </LinearGradient>
    );
  }

  const created = new Date(tx.created_at);
  const typeLabel = tx.type === "income" ? "Income" : "Expense";

  return (
    <LinearGradient colors={[...gradients.page]} style={styles.flex}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.gray900} />
        </Pressable>
        <Text style={styles.headerTitle}>Transaction</Text>
        <Pressable onPress={onEdit} hitSlop={12}>
          <Text style={styles.headerLink}>Edit</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.pad} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={[styles.typePill, tx.type === "income" ? styles.pillIn : styles.pillOut]}>
            <Text style={styles.typePillTxt}>{typeLabel}</Text>
          </View>
          <Text style={[styles.amount, tx.type === "expense" ? styles.amtExp : styles.amtInc]}>
            {tx.type === "expense" ? "-" : "+"}
            {formatMoney(tx.amount)}
          </Text>
          <Text style={styles.merchant}>{tx.merchant || tx.category}</Text>
        </View>

        <View style={styles.card}>
          <Row icon="calendar-outline" label="Transaction date" value={formatDate(tx.date)} />
          <Row icon="time-outline" label="Recorded at" value={created.toLocaleString()} />
          <Row icon="pricetags-outline" label="Category" value={tx.category} />
          <Row icon="wallet-outline" label="Account" value={accountName ?? tx.payment_method ?? "—"} />
          <Row icon="card-outline" label="Payment method" value={tx.payment_method ?? "—"} />
        </View>

        {tx.description ? (
          <View style={styles.notesCard}>
            <Text style={styles.notesHdr}>Notes</Text>
            <Text style={styles.notesBody}>{tx.description}</Text>
          </View>
        ) : null}

        {tx.tags && tx.tags.length > 0 ? (
          <View style={styles.tagRow}>
            {tx.tags.map((t) => (
              <View key={t} style={styles.tag}>
                <Text style={styles.tagTxt}>{t}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <Pressable style={styles.danger} onPress={onDelete}>
          <Ionicons name="trash-outline" size={18} color={colors.rose600} />
          <Text style={styles.dangerTxt}>Delete transaction</Text>
        </Pressable>
        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  );
}

function Row({ icon, label, value }: { icon: ComponentProps<typeof Ionicons>["name"]; label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={18} color={colors.gray500} style={{ width: 28 }} />
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLbl}>{label}</Text>
        <Text style={styles.rowVal}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { textAlign: "center", marginTop: 80, fontSize: typeScale.body, color: colors.gray600 },
  back: { position: "absolute", left: 16, zIndex: 2 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray200,
    backgroundColor: "rgba(255,255,255,0.95)",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: colors.gray900 },
  headerLink: { fontSize: 16, fontWeight: "700", color: colors.primary },
  pad: { padding: 16 },
  hero: { alignItems: "center", marginBottom: 20 },
  typePill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 10,
  },
  pillIn: { backgroundColor: "#d1fae5" },
  pillOut: { backgroundColor: "#ffe4e6" },
  typePillTxt: { fontSize: typeScale.xs, fontWeight: "800", color: colors.gray800 },
  amount: { fontSize: 36, fontWeight: "800" },
  amtExp: { color: colors.rose600 },
  amtInc: { color: colors.primary },
  merchant: { fontSize: typeScale.body, color: colors.gray600, marginTop: 6, textAlign: "center" },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.gray200,
    padding: 4,
    marginBottom: 14,
  },
  row: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 12, paddingHorizontal: 10, gap: 8 },
  rowLbl: { fontSize: typeScale.xs, fontWeight: "700", color: colors.gray500, textTransform: "uppercase" },
  rowVal: { fontSize: typeScale.body, fontWeight: "600", color: colors.gray900, marginTop: 2 },
  notesCard: {
    backgroundColor: "#fafafa",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.gray200,
    marginBottom: 14,
  },
  notesHdr: { fontSize: typeScale.xs, fontWeight: "800", color: colors.gray500, marginBottom: 8 },
  notesBody: { fontSize: typeScale.body, color: colors.gray800, lineHeight: 22 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  tag: {
    backgroundColor: colors.emerald50,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  tagTxt: { fontSize: typeScale.sm, fontWeight: "600", color: colors.gray800 },
  danger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fecdd3",
    backgroundColor: "#fff1f2",
  },
  dangerTxt: { fontSize: typeScale.body, fontWeight: "700", color: colors.rose600 },
});
