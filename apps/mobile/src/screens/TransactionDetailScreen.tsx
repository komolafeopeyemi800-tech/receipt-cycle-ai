import type { ComponentProps } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery } from "../lib/api";
import type { Id } from "../lib/api";
import { api } from "../lib/api";
import { colors, gradients, type as typeScale } from "../theme/tokens";
import type { RootStackParamList } from "../navigation/types";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { useAuth } from "../contexts/AuthContext";
import { usePreferences } from "../contexts/PreferencesContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppButton } from "../components/ui/FinanceUI";
import type { DocTx } from "../types/transaction";

export function TransactionDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "TransactionDetail">>();
  const { workspace, ready } = useWorkspace();
  const { user, token } = useAuth();
  const { formatMoney, formatDate } = usePreferences();
  const removeTx = useMutation(api.transactions.remove);

  const id = route.params.transactionId as Id<"transactions">;
  const tx = useQuery(api.transactions.get, ready && user?.id ? { id, userId: user.id } : "skip") as DocTx | null | undefined;
  const accounts = useQuery(api.accounts.list, ready ? { workspace } : "skip") as Array<{ id: string; name: string }> | undefined;

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
          if (!user?.id || !token) {
            Alert.alert("Sign in required", "Sign in to delete this transaction.");
            return;
          }
          await removeTx({ id, userId: user.id, token });
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
  const receiptData = tx.receipt_data && typeof tx.receipt_data === "object" ? tx.receipt_data as { formatted_receipt_text?: string } : null;
  const receiptPreview = receiptData?.formatted_receipt_text?.trim();

  return (
    <LinearGradient colors={[...gradients.page]} style={styles.flex}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.gray900} />
        </Pressable>
        <Text style={styles.headerTitle}>Transaction Detail</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.pad} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.merchantAvatar}><Text style={styles.avatarText}>{(tx.merchant || tx.category).slice(0, 2).toUpperCase()}</Text></View>
          <View style={{ flex: 1 }}><Text style={styles.merchant}>{tx.merchant || tx.category}</Text><Text style={styles.heroCategory}>{tx.category}</Text><Text style={[styles.amount, tx.type === "expense" ? styles.amtExp : styles.amtInc]}>{tx.type === "expense" ? "-" : "+"}{formatMoney(tx.amount)}</Text><Text style={styles.heroDate}>{formatDate(tx.date)} · {created.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</Text></View>
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

        {receiptPreview || tx.receipt_url ? <View style={styles.receiptCard}><Text style={styles.receiptHeader}>Receipt</Text>{tx.receipt_url ? <Image source={{ uri: tx.receipt_url }} style={styles.receiptImage} resizeMode="contain" /> : <View style={styles.receiptTextBox}><Text style={styles.receiptText}>{receiptPreview}</Text></View>}</View> : null}
        <View style={styles.actions}><AppButton label="Edit" icon="create-outline" onPress={onEdit} style={{ flex: 1 }} /><Pressable style={styles.danger} onPress={onDelete}><Ionicons name="trash-outline" size={18} color={colors.rose600} /><Text style={styles.dangerTxt}>Delete</Text></Pressable></View>
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
  hero: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 12, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.divider },
  merchantAvatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 18, fontWeight: "800" },
  heroCategory: { fontSize: 12, color: colors.gray600, marginTop: 2 },
  heroDate: { fontSize: 11, color: colors.gray500, marginTop: 2 },
  typePill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 10,
  },
  pillIn: { backgroundColor: "#d1fae5" },
  pillOut: { backgroundColor: "#ffe4e6" },
  typePillTxt: { fontSize: typeScale.xs, fontWeight: "800", color: colors.gray800 },
  amount: { fontSize: 29, fontWeight: "800", marginTop: 5 },
  amtExp: { color: colors.rose600 },
  amtInc: { color: colors.primary },
  merchant: { fontSize: 16, color: colors.textPrimary, fontWeight: "800" },
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
  receiptCard: { backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 12, marginBottom: 16 },
  receiptHeader: { color: colors.textPrimary, fontSize: 14, fontWeight: "700", marginBottom: 9 },
  receiptImage: { width: "100%", height: 225, backgroundColor: colors.gray100, borderRadius: 10 },
  receiptTextBox: { backgroundColor: colors.gray100, padding: 14, borderRadius: 10, maxHeight: 240 },
  receiptText: { fontSize: 11, color: colors.textPrimary, fontFamily: "monospace", lineHeight: 16 },
  actions: { flexDirection: "row", gap: 10 },
  danger: {
    flex: 1,
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
