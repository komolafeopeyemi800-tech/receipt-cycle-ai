import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";
import {
  ActivityIndicator,
  Animated,
  Alert,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, gradients } from "../theme/tokens";
import type { RootStackParamList } from "../navigation/types";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { useAuth } from "../contexts/AuthContext";
import { AnimatedPressable } from "../components/AnimatedPressable";

const CAT_COLORS = ["#0f766e", "#2563eb", "#7c3aed", "#ea580c", "#db2777", "#64748b"];

function formatYmd(d: Date) {
  return d.toISOString().split("T")[0]!;
}

export function AddTransactionScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "AddTransaction">>();
  const createTx = useMutation(api.transactions.create);
  const updateTx = useMutation(api.transactions.update);
  const ensureCats = useMutation(api.categories.ensureSeed);
  const ensureAcc = useMutation(api.accounts.ensureSeed);
  const createCat = useMutation(api.categories.create);
  const createAcc = useMutation(api.accounts.create);
  const { workspace, ready } = useWorkspace();
  const { user } = useAuth();

  const editId = route.params?.transactionId ? (route.params.transactionId as Id<"transactions">) : undefined;
  const existing = useQuery(
    api.transactions.get,
    editId && user?.id ? { id: editId, userId: user.id } : "skip",
  );
  const runtime = useQuery(api.admin.publicConfig, {});

  const [transactionType, setTransactionType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [category, setCategory] = useState("Food & Dining");
  const [date, setDate] = useState(() => formatYmd(new Date()));
  const [dateObj, setDateObj] = useState(() => new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [accountId, setAccountId] = useState<Id<"accounts"> | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const [catModal, setCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [accModal, setAccModal] = useState(false);
  const [newAccName, setNewAccName] = useState("");
  const keyboardLift = useMemo(() => new Animated.Value(0), []);

  const cats = useQuery(api.categories.list, ready ? { workspace } : "skip");
  const accounts = useQuery(api.accounts.list, ready ? { workspace } : "skip");

  useEffect(() => {
    if (!ready) return;
    void ensureCats({ workspace });
    void ensureAcc({ workspace });
  }, [ready, workspace, ensureCats, ensureAcc]);

  const filteredCats = useMemo(() => {
    const rows = cats ?? [];
    return rows.filter((c) => c.kind === (transactionType === "expense" ? "expense" : "income"));
  }, [cats, transactionType]);

  useEffect(() => {
    if (filteredCats.length === 0) return;
    const names = filteredCats.map((c) => c.name);
    if (!names.includes(category)) {
      setCategory(names[0]!);
    }
  }, [filteredCats, transactionType, category]);

  /** Sync selected account when workspace accounts load or change */
  useEffect(() => {
    const list = accounts ?? [];
    if (list.length === 0) return;
    if (editId && existing?.accountId) {
      const match = list.find((a) => a.id === existing.accountId);
      if (match) {
        setAccountId(match.id);
        setPaymentMethod(match.name);
      }
      return;
    }
    if (accountId && list.some((a) => a.id === accountId)) return;
    const byName = paymentMethod ? list.find((a) => a.name === paymentMethod) : undefined;
    if (byName) {
      setAccountId(byName.id);
      return;
    }
    const pick = list[0]!;
    setAccountId(pick.id);
    setPaymentMethod(pick.name);
  }, [accounts, editId, existing]);

  useEffect(() => {
    if (editId) return;
    const s = route.params?.scannedData;
    if (!s) return;
    if (s.total_amount != null && s.total_amount > 0) setAmount(String(s.total_amount));
    if (s.merchant_name) setMerchant(s.merchant_name);
    if (s.category) setCategory(s.category);
    if (s.date) {
      setDate(s.date);
      const p = new Date(s.date + "T12:00:00");
      if (!Number.isNaN(p.getTime())) setDateObj(p);
    }
    if (s.payment_method) setPaymentMethod(s.payment_method);
    const noteParts: string[] = [];
    if (s.time?.trim()) noteParts.push(`Time: ${s.time.trim()}`);
    const body = s.formatted_receipt_text?.trim();
    if (body) noteParts.push(body);
    else if (s.items?.length) {
      noteParts.push(s.items.map((i) => `${i.name}: $${i.price}`).join("\n"));
    }
    if (noteParts.length) setNotes(noteParts.join("\n\n"));
  }, [route.params, editId]);

  useEffect(() => {
    if (!existing || !editId) return;
    setTransactionType(existing.type === "income" ? "income" : "expense");
    setAmount(String(existing.amount));
    setMerchant(existing.merchant ?? "");
    setCategory(existing.category);
    setDate(existing.date);
    const p = new Date(existing.date + "T12:00:00");
    if (!Number.isNaN(p.getTime())) setDateObj(p);
    if (existing.payment_method) setPaymentMethod(existing.payment_method);
    setNotes(existing.description ?? "");
    if (existing.accountId) setAccountId(existing.accountId as Id<"accounts">);
  }, [existing, editId]);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const onShow = Keyboard.addListener(showEvent, (event) => {
      const h = event.endCoordinates?.height ?? 0;
      const lift = Math.min(h * 0.24, 54);
      Animated.timing(keyboardLift, {
        toValue: -lift,
        duration: 220,
        useNativeDriver: true,
      }).start();
    });
    const onHide = Keyboard.addListener(hideEvent, () => {
      Animated.timing(keyboardLift, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start();
    });
    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, [keyboardLift]);

  async function save() {
    if (!user?.id) {
      Alert.alert("Sign in required", "Sign in to save transactions to your account.");
      return;
    }
    const n = parseFloat(amount);
    if (!Number.isFinite(n) || n <= 0) return;
    setSaving(true);
    try {
      const scanned = route.params?.scannedData;
      const entrySource = route.params?.source ?? (scanned ? "upload" : "manual");
      if (runtime?.maintenanceMode) {
        Alert.alert("Unavailable", "System is in maintenance mode.");
        return;
      }
      if (runtime?.mobileAddPageEnabled === false) {
        Alert.alert("Unavailable", "This page is currently disabled by admin.");
        return;
      }
      if (entrySource === "manual" && runtime?.manualAddEnabled === false) {
        Alert.alert("Unavailable", "Manual add is currently disabled by admin.");
        return;
      }
      const scanTags = scanned?.tags?.filter((t) => t.length > 0 && t.length < 48) ?? [];
      const mergedTags = [...new Set([...scanTags, "scan"])].slice(0, 16);

      if (editId) {
        const rd = scanned
          ? { ...scanned, formatted_receipt_text: scanned.formatted_receipt_text?.slice(0, 12000) }
          : (existing?.receipt_data as Record<string, unknown> | undefined);
        await updateTx({
          id: editId,
          workspace,
          userId: user?.id,
          amount: n,
          type: transactionType,
          category,
          merchant: merchant || undefined,
          date,
          description: notes || undefined,
          payment_method: paymentMethod,
          accountId: accountId ?? undefined,
          tags: Array.isArray(existing?.tags) ? (existing.tags as string[]) : [],
          is_recurring: false,
          receipt_data: rd,
        });
      } else {
        await createTx({
          workspace,
          userId: user?.id,
          amount: n,
          type: transactionType,
          category,
          merchant: merchant || undefined,
          date,
          description: notes || undefined,
          payment_method: paymentMethod,
          accountId: accountId ?? undefined,
          tags: mergedTags,
          is_recurring: false,
          receipt_data: scanned
            ? {
                ...scanned,
                formatted_receipt_text: scanned.formatted_receipt_text?.slice(0, 12000),
              }
            : undefined,
          entrySource,
        });
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert("Could not save", e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  async function addCategory() {
    const n = newCatName.trim();
    if (n.length < 2) {
      Alert.alert("Category", "Enter at least 2 characters.");
      return;
    }
    const color = CAT_COLORS[Math.floor(Math.random() * CAT_COLORS.length)]!;
    await createCat({
      workspace,
      name: n,
      kind: transactionType === "expense" ? "expense" : "income",
      color,
    });
    setCategory(n);
    setNewCatName("");
    setCatModal(false);
  }

  async function addAccount() {
    const n = newAccName.trim();
    if (n.length < 2) {
      Alert.alert("Account", "Enter at least 2 characters.");
      return;
    }
    const id = await createAcc({ workspace, name: n, balance: 0, iconKey: "wallet" });
    setPaymentMethod(n);
    setAccountId(id);
    setNewAccName("");
    setAccModal(false);
  }

  const onDateChange = (_: unknown, selected?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (selected) {
      setDateObj(selected);
      setDate(formatYmd(selected));
    }
  };

  if (editId && existing === undefined) {
    return (
      <LinearGradient colors={[...gradients.page]} style={styles.flex}>
        <View style={[styles.header, { justifyContent: "center" }]}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </LinearGradient>
    );
  }

  if (editId && existing === null) {
    return (
      <LinearGradient colors={[...gradients.page]} style={styles.flex}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color={colors.gray900} />
          </Pressable>
          <Text style={styles.headerTitle}>Not found</Text>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[...gradients.page]} style={styles.flex}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.gray900} />
        </Pressable>
        <Text style={styles.headerTitle}>{editId ? "Edit transaction" : "Add transaction"}</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.pad}>
        <View style={styles.typeRow}>
          <Pressable
            style={[styles.typeChip, transactionType === "expense" && styles.typeChipOn]}
            onPress={() => setTransactionType("expense")}
          >
            <Text style={[styles.typeTxt, transactionType === "expense" && styles.typeTxtOn]}>Expense</Text>
          </Pressable>
          <Pressable
            style={[styles.typeChip, transactionType === "income" && styles.typeChipOn]}
            onPress={() => setTransactionType("income")}
          >
            <Text style={[styles.typeTxt, transactionType === "income" && styles.typeTxtOn]}>Income</Text>
          </Pressable>
        </View>

        <Text style={styles.label}>Amount</Text>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor={colors.gray400}
          value={amount}
          onChangeText={setAmount}
        />

        <Text style={styles.label}>Merchant</Text>
        <TextInput
          style={styles.input}
          placeholder="Store name"
          placeholderTextColor={colors.gray400}
          value={merchant}
          onChangeText={setMerchant}
        />

        <Text style={styles.label}>Category</Text>
        <Pressable style={styles.selectRow} onPress={() => setCatModal(true)}>
          <Text style={styles.selectTxt}>{category}</Text>
          <Ionicons name="chevron-down" size={20} color={colors.gray500} />
        </Pressable>

        <Text style={styles.label}>Date</Text>
        <Pressable style={styles.selectRow} onPress={() => setShowDatePicker(true)}>
          <Ionicons name="calendar-outline" size={20} color={colors.primary} />
          <Text style={styles.selectTxt}>{date}</Text>
        </Pressable>
        {showDatePicker && (
          <DateTimePicker value={dateObj} mode="date" display={Platform.OS === "ios" ? "spinner" : "default"} onChange={onDateChange} />
        )}
        {Platform.OS === "ios" && showDatePicker && (
          <Pressable style={styles.doneBtn} onPress={() => setShowDatePicker(false)}>
            <Text style={styles.doneBtnTxt}>Done</Text>
          </Pressable>
        )}

        <Text style={styles.label}>Paid from / account</Text>
        <Pressable style={styles.selectRow} onPress={() => setAccModal(true)}>
          <Text style={styles.selectTxt}>{paymentMethod}</Text>
          <Ionicons name="chevron-down" size={20} color={colors.gray500} />
        </Pressable>

        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[styles.input, { minHeight: 80 }]}
          multiline
          value={notes}
          onChangeText={setNotes}
          placeholder="Optional"
          placeholderTextColor={colors.gray400}
        />

        <Animated.View style={{ transform: [{ translateY: keyboardLift }] }}>
          <AnimatedPressable
            style={[styles.saveBtn, saving && { opacity: 0.7 }]}
            onPress={save}
            disabled={saving}
            pressedScale={0.985}
          >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveTxt}>{editId ? "Save changes" : "Save transaction"}</Text>
          )}
          </AnimatedPressable>
        </Animated.View>
      </ScrollView>

      <Modal visible={catModal} transparent animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setCatModal(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Categories</Text>
            <ScrollView style={{ maxHeight: 220 }}>
              {filteredCats.map((c) => (
                <Pressable
                  key={String(c.id)}
                  style={styles.modalRow}
                  onPress={() => {
                    setCategory(c.name);
                    setCatModal(false);
                  }}
                >
                  <View style={[styles.colorDot, { backgroundColor: c.color }]} />
                  <Text style={styles.modalRowTxt}>{c.name}</Text>
                  {category === c.name && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                </Pressable>
              ))}
            </ScrollView>
            <Text style={styles.modalLbl}>New category</Text>
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={newCatName}
              onChangeText={setNewCatName}
              placeholderTextColor={colors.gray400}
            />
            <Pressable style={styles.modalPrimary} onPress={() => void addCategory()}>
              <Text style={styles.modalPrimaryTxt}>Add category</Text>
            </Pressable>
            <Pressable style={styles.modalGhost} onPress={() => setCatModal(false)}>
              <Text style={styles.modalGhostTxt}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={accModal} transparent animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setAccModal(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Accounts</Text>
            <ScrollView style={{ maxHeight: 220 }}>
              {(accounts ?? []).map((a) => (
                <Pressable
                  key={String(a.id)}
                  style={styles.modalRow}
                  onPress={() => {
                    setPaymentMethod(a.name);
                    setAccountId(a.id);
                    setAccModal(false);
                  }}
                >
                  <Ionicons name="wallet-outline" size={20} color={colors.gray600} />
                  <Text style={styles.modalRowTxt}>{a.name}</Text>
                  {accountId === a.id && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                </Pressable>
              ))}
            </ScrollView>
            <Text style={styles.modalLbl}>New account</Text>
            <TextInput
              style={styles.input}
              placeholder="Account name"
              value={newAccName}
              onChangeText={setNewAccName}
              placeholderTextColor={colors.gray400}
            />
            <Pressable style={styles.modalPrimary} onPress={() => void addAccount()}>
              <Text style={styles.modalPrimaryTxt}>Add account</Text>
            </Pressable>
            <Pressable style={styles.modalGhost} onPress={() => setAccModal(false)}>
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
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: colors.gray900 },
  pad: { padding: 16, paddingBottom: 48 },
  typeRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  typeChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  typeChipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  typeTxt: { fontWeight: "700", color: colors.gray700 },
  typeTxtOn: { color: "#fff" },
  label: { fontSize: 13, fontWeight: "600", color: colors.gray600, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: colors.gray900,
    backgroundColor: "#fff",
    marginBottom: 14,
  },
  selectRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#fff",
    marginBottom: 6,
    gap: 8,
  },
  selectTxt: { flex: 1, fontSize: 16, color: colors.gray900, fontWeight: "600" },
  doneBtn: { alignSelf: "flex-end", marginBottom: 12 },
  doneBtnTxt: { color: colors.primary, fontWeight: "700" },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
  },
  saveTxt: { color: "#fff", fontWeight: "700", fontSize: 16 },
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
    maxHeight: "80%",
  },
  modalTitle: { fontSize: 17, fontWeight: "700", color: colors.gray900, marginBottom: 10 },
  modalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray200,
  },
  colorDot: { width: 12, height: 12, borderRadius: 6 },
  modalRowTxt: { flex: 1, fontSize: 16, color: colors.gray900 },
  modalLbl: { fontSize: 12, fontWeight: "700", color: colors.gray600, marginTop: 8, marginBottom: 6 },
  modalPrimary: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  modalPrimaryTxt: { color: "#fff", fontWeight: "700" },
  modalGhost: { paddingVertical: 12, alignItems: "center" },
  modalGhostTxt: { color: colors.gray600, fontWeight: "600" },
});
