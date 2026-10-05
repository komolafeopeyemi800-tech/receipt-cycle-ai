import { useEffect, useMemo, useRef, useState } from "react";
import { useAction, useMutation, useQuery } from "../lib/api";
import { Audio } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import { readAsStringAsync } from "expo-file-system/legacy";
import type { Id } from "../lib/api";
import { api } from "../lib/api";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, gradients } from "../theme/tokens";
import type { RootStackParamList } from "../navigation/types";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { useAuth } from "../contexts/AuthContext";
import { usePreferences } from "../contexts/PreferencesContext";
import { useMoneyAppearance } from "../contexts/MoneyAppearanceContext";
import { useSubscriptionState } from "../hooks/useSubscriptionState";
import { AnimatedPressable } from "../components/AnimatedPressable";
import { todayYm } from "../utils/transactionMath";
import { userFacingError, userFacingErrorFromUnknown } from "../lib/userFacingErrors";
import { FormField, SelectField, SegmentedTabs } from "../components/ui/FinanceUI";
import type { ScannedExtracted } from "../types/transaction";

const CAT_COLORS = ["#0f766e", "#2563eb", "#7c3aed", "#ea580c", "#db2777", "#64748b"];
type CategoryRow = { id: Id<"categories">; name: string; kind: "expense" | "income"; color: string };
type AccountRow = { id: Id<"accounts">; name: string; balance: number; iconKey: string };

function formatYmd(d: Date) {
  return d.toISOString().split("T")[0]!;
}

export function AddTransactionScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteProp<RootStackParamList, "AddTransaction">>();
  const createTx = useMutation(api.transactions.create);
  const uploadReceipt = useAction(api.receipts.upload);
  const updateTx = useMutation(api.transactions.update);
  const ensureCats = useMutation(api.categories.ensureSeed);
  const ensureAcc = useMutation(api.accounts.ensureSeed);
  const createCat = useMutation(api.categories.create);
  const createAcc = useMutation(api.accounts.create);
  const budgetUpsert = useMutation(api.budgets.upsert);
  const voiceFromAudio = useAction(api.voiceFinance.voiceTransactionFromAudio);
  const parseFromText = useAction(api.voiceFinance.parseTransactionFromSpeech);
  const scanImage = useAction(api.scanReceipt.scanFromBase64);
  const { workspace, ready } = useWorkspace();
  const { user, token } = useAuth();
  const { voiceInputLanguage, currency } = usePreferences();
  const { appearance } = useMoneyAppearance();
  const sub = useSubscriptionState();

  const voiceAiOk = !sub || sub.canUseAiFeatures;
  const canSaveNew = !sub || sub.canCreateTransaction;
  const canSaveEdit = !sub || sub.canEditOrDeleteTransaction;

  const editId = route.params?.transactionId ? (route.params.transactionId as Id<"transactions">) : undefined;
  const existing = useQuery(
    api.transactions.get,
    editId && user?.id ? { id: editId, userId: user.id } : "skip",
  );
  const runtime = useQuery(api.admin.publicConfig, {});

  const [transactionType, setTransactionType] = useState<"expense" | "income">(route.params?.initialType ?? "expense");
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
  const [attachmentBusy, setAttachmentBusy] = useState(false);
  const [attachedScan, setAttachedScan] = useState<ScannedExtracted | null>(null);
  const [aiCapture, setAiCapture] = useState(route.params?.initialMode === "ai");
  const [aiMode, setAiMode] = useState<"Voice" | "Quick Text">("Voice");

  const [voiceBusy, setVoiceBusy] = useState(false);
  const [voiceRecording, setVoiceRecording] = useState(false);
  const [voicePhrase, setVoicePhrase] = useState("");
  const voiceRecRef = useRef<Audio.Recording | null>(null);

  const [catModal, setCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [accModal, setAccModal] = useState(false);
  const [newAccName, setNewAccName] = useState("");
  const keyboardLift = useMemo(() => new Animated.Value(0), []);

  const cats = useQuery(api.categories.list, ready ? { workspace } : "skip") as CategoryRow[] | undefined;
  const accounts = useQuery(api.accounts.list, ready ? { workspace } : "skip") as AccountRow[] | undefined;

  const voiceHints = useMemo(() => {
    const cRows = (cats ?? []).filter((row) => !appearance.archivedCategoryIds.includes(row.id));
    const aRows = accounts ?? [];
    return {
      expenseCategories: cRows.filter((row) => row.kind === "expense").map((row) => row.name),
      incomeCategories: cRows.filter((row) => row.kind === "income").map((row) => row.name),
      accountNames: aRows.map((row) => row.name),
    };
  }, [cats, accounts, appearance.archivedCategoryIds]);

  useEffect(() => {
    if (!ready) return;
    void ensureCats({ workspace });
    void ensureAcc({ workspace });
  }, [ready, workspace, ensureCats, ensureAcc]);

  const filteredCats = useMemo(() => {
    const rows = cats ?? [];
    return rows.filter((c) => c.kind === (transactionType === "expense" ? "expense" : "income") && (!appearance.archivedCategoryIds.includes(c.id) || Boolean(editId && c.name === category)));
  }, [cats, transactionType, appearance.archivedCategoryIds, editId, category]);

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

  useEffect(() => {
    return () => {
      void (async () => {
        try {
          if (voiceRecRef.current) {
            await voiceRecRef.current.stopAndUnloadAsync();
            voiceRecRef.current = null;
          }
        } catch {
          /* ignore */
        }
      })();
    };
  }, []);

  type VoiceDraft = {
    intent: "transaction" | "budget";
    amount: number | null;
    type: "expense" | "income";
    category: string;
    merchant: string | null;
    date: string | null;
    description: string | null;
    payment_method: string | null;
    confidence: string;
    budgetCategory: string | null;
    budgetLimit: number | null;
    budgetMonth: string | null;
  };

  async function applyVoiceDraft(draft: VoiceDraft) {
    if (draft.intent === "budget" && draft.budgetLimit != null && draft.budgetLimit > 0 && user?.id) {
      if (sub && !sub.canMutateBudgets) {
        Alert.alert("Upgrade needed", sub.blockReason ?? "Pro or active trial required to edit budgets.");
        return;
      }
      const month = draft.budgetMonth ?? todayYm();
      const catRaw = (draft.budgetCategory || draft.category || "Other").trim() || "Other";
      const list = cats ?? [];
      const has = list.some((c) => c.name === catRaw && c.kind === "expense");
      if (!has) {
        const color = CAT_COLORS[Math.floor(Math.random() * CAT_COLORS.length)]!;
        await createCat({ workspace, name: catRaw, kind: "expense", color });
      }
      await budgetUpsert({
        workspace,
        userId: user.id,
        category: catRaw,
        month,
        limitAmount: draft.budgetLimit,
      });
      Alert.alert("Budget updated", `“${catRaw}” limit ${draft.budgetLimit} for ${month}.`);
      setAiCapture(false);
      return;
    }

    setTransactionType(draft.type === "income" ? "income" : "expense");
    if (draft.amount != null && draft.amount > 0) {
      setAmount(String(draft.amount));
    }
    if (draft.merchant?.trim()) {
      setMerchant(draft.merchant.trim());
    }
    if (draft.date?.trim()) {
      setDate(draft.date.trim());
      const p = new Date(`${draft.date.trim()}T12:00:00`);
      if (!Number.isNaN(p.getTime())) setDateObj(p);
    }
    const desc = draft.description?.trim();
    if (desc) {
      setNotes((n) => (n.trim() ? `${n.trim()}\n\n${desc}` : desc));
    }
    const pm = draft.payment_method?.trim();
    if (pm) {
      setPaymentMethod(pm);
      const accList = accounts ?? [];
      const acc = accList.find((a) => a.name.toLowerCase() === pm.toLowerCase());
      if (acc) setAccountId(acc.id);
    }

    const catName = draft.category.trim();
    if (!catName) { setAiCapture(false); return; }
    const expKind = draft.type === "income" ? "income" : "expense";
    const list = cats ?? [];
    const has = list.some((c) => c.name === catName && c.kind === expKind);
    if (!has) {
      const color = CAT_COLORS[Math.floor(Math.random() * CAT_COLORS.length)]!;
      await createCat({ workspace, name: catName, kind: expKind, color });
    }
    setCategory(catName);
    setAiCapture(false);
  }

  async function runParseFromText() {
    const t = voicePhrase.trim();
    if (!t) {
      Alert.alert("Voice / text", 'Tap the mic and speak, or type something like "12 dollars coffee at Starbucks yesterday".');
      return;
    }
    if (!token) {
      Alert.alert("Sign in", "Sign in to use voice and optional smart fill.");
      return;
    }
    setVoiceBusy(true);
    try {
      const out = await parseFromText({ text: t, sessionToken: token, hints: voiceHints });
      if (!out.ok || !out.draft) {
        Alert.alert("Could not parse", userFacingError(out.error || undefined));
        return;
      }
      await applyVoiceDraft(out.draft as VoiceDraft);
      Alert.alert("Filled from text", "Review the fields and tap Save.");
    } catch (e) {
      Alert.alert("Error", userFacingErrorFromUnknown(e));
    } finally {
      setVoiceBusy(false);
    }
  }

  async function toggleVoiceRecording() {
    if (voiceBusy && !voiceRecording) return;
    if (voiceRecording && voiceRecRef.current) {
      try {
        setVoiceRecording(false);
        await voiceRecRef.current.stopAndUnloadAsync();
        const uri = voiceRecRef.current.getURI();
        voiceRecRef.current = null;
        if (!uri) return;
        setVoiceBusy(true);
        const b64 = await readAsStringAsync(uri, { encoding: "base64" });
        const lower = uri.toLowerCase();
        const mime = lower.endsWith(".webm")
          ? "audio/webm"
          : lower.endsWith(".wav")
            ? "audio/wav"
            : lower.endsWith(".caf")
              ? "audio/x-caf"
              : "audio/m4a";
        if (!token) {
          setVoiceBusy(false);
          Alert.alert("Sign in", "Sign in to use voice entry.");
          return;
        }
        const out = await voiceFromAudio({
          audioBase64: b64,
          mimeType: mime,
          language: voiceInputLanguage,
          sessionToken: token,
          hints: voiceHints,
        });
        setVoiceBusy(false);
        if (!out.ok || !out.draft) {
          Alert.alert(
            "Voice add",
            out.transcript
              ? `${userFacingError(out.error)}\n\nWe heard: “${out.transcript}”`
              : userFacingError(out.error ?? "Could not process audio."),
          );
          if (out.transcript) setVoicePhrase(out.transcript);
          return;
        }
        setVoicePhrase(out.transcript ?? "");
        await applyVoiceDraft(out.draft as VoiceDraft);
        Alert.alert("Filled from voice", "Review the fields and tap Save.");
      } catch (e) {
        setVoiceBusy(false);
        Alert.alert("Recording", userFacingErrorFromUnknown(e));
      }
      return;
    }

    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Microphone", "Allow microphone access to add transactions by voice.");
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      voiceRecRef.current = recording;
      setVoiceRecording(true);
    } catch (e) {
      Alert.alert("Recording", userFacingErrorFromUnknown(e));
    }
  }

  async function closeAiCapture() {
    if (voiceRecRef.current) {
      try { await voiceRecRef.current.stopAndUnloadAsync(); } catch { /* recording may already have stopped */ }
      voiceRecRef.current = null;
      setVoiceRecording(false);
    }
    setAiCapture(false);
  }

  async function attachReceiptFromGallery() {
    if (!token) { Alert.alert("Sign in", "Sign in to attach a receipt."); return; }
    if (!voiceAiOk) { Alert.alert("Upgrade needed", sub?.blockReason ?? "Receipt extraction requires Pro or an active trial slot."); return; }
    if (runtime?.maintenanceMode || runtime?.uploadEnabled === false) { Alert.alert("Unavailable", "Receipt upload is currently unavailable."); return; }
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (picked.canceled || !picked.assets[0]) return;
    setAttachmentBusy(true);
    try {
      const asset = picked.assets[0];
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const imageBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => { const data = String(reader.result ?? ""); resolve(data.includes(",") ? data.split(",")[1]! : data); };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });
      const output = await scanImage({ imageBase64, mimeType: asset.mimeType ?? "image/jpeg", sessionToken: token });
      const result = output as { extracted_data?: unknown; error?: string };
      let extracted = result.extracted_data as Record<string, unknown> | null | undefined;
      if (extracted && typeof extracted === "object" && "data" in extracted && (extracted as { data?: unknown }).data) extracted = (extracted as { data: Record<string, unknown> }).data;
      if (result.error || !extracted || Object.keys(extracted).length === 0) { Alert.alert("Receipt", userFacingError(result.error ?? "Could not read this image.")); return; }
      const receipt = extracted as ScannedExtracted;
      setAttachedScan(receipt);
      if (!amount.trim() && receipt.total_amount) setAmount(String(receipt.total_amount));
      if (!merchant.trim() && receipt.merchant_name) setMerchant(receipt.merchant_name);
      Alert.alert("Receipt attached", "Review the fields, then save the transaction.");
    } catch (error) {
      Alert.alert("Receipt", userFacingErrorFromUnknown(error));
    } finally { setAttachmentBusy(false); }
  }

  async function save() {
    if (!user?.id || !token) {
      Alert.alert("Sign in required", "Sign in to save transactions to your account.");
      return;
    }
    if (editId ? !canSaveEdit : !canSaveNew) {
      Alert.alert(
        "Upgrade needed",
        sub?.blockReason ?? "Upgrade to Pro to add or edit transactions.",
        [{ text: "OK" }, { text: "Pricing", onPress: () => navigation.navigate("Pricing") }],
      );
      return;
    }
    const n = Number(amount.replace(/,/g, "").trim());
    if (!Number.isFinite(n) || n <= 0) {
      Alert.alert("Amount required", "Enter an amount greater than zero.");
      return;
    }
    setSaving(true);
    try {
      const scanned = attachedScan ?? route.params?.scannedData;
      const entrySource = attachedScan ? "upload" : route.params?.source ?? (scanned ? "upload" : "manual");
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
      const mergedTags = [...new Set(scanned ? [...scanTags, "scan"] : scanTags)].slice(0, 16);

      if (editId) {
        const rd = scanned
          ? { ...scanned, formatted_receipt_text: scanned.formatted_receipt_text?.slice(0, 12000) }
          : (existing?.receipt_data as Record<string, unknown> | undefined);
        await updateTx({
          id: editId,
          workspace,
          userId: user?.id,
          token: token!,
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
        // Keep the original picture with the entry. A failed upload must never block saving the transaction.
        let receiptKey: string | undefined;
        const receiptUri = route.params?.receiptUri;
        if (receiptUri) {
          try {
            const lower = receiptUri.toLowerCase();
            const type = lower.endsWith(".png") ? "image/png" : lower.endsWith(".webp") ? "image/webp" : lower.endsWith(".heic") ? "image/heic" : "image/jpeg";
            const file =
              Platform.OS === "web"
                ? await (await fetch(receiptUri)).blob()
                : { uri: receiptUri, name: `receipt.${type.split("/")[1]}`, type };
            receiptKey = (await uploadReceipt({ file })).key;
          } catch {
            receiptKey = undefined;
          }
        }
        await createTx({
          workspace,
          userId: user?.id,
          token: token!,
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
          receipt_url: receiptKey,
        });
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert("Could not save", userFacingErrorFromUnknown(e));
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

  if (aiCapture && !editId) {
    return <LinearGradient colors={[...gradients.page]} style={styles.flex}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => void closeAiCapture()} hitSlop={12} accessibilityLabel="Back to transaction"><Ionicons name="arrow-back" size={22} color={colors.textPrimary} /></Pressable>
        <Text style={styles.headerTitle}>AI Capture</Text>
        <View style={{ width: 22 }} />
      </View>
      <ScrollView contentContainerStyle={styles.aiPad} keyboardShouldPersistTaps="handled">
        <SegmentedTabs options={["Voice", "Quick Text"] as const} value={aiMode} onChange={(mode) => { if (voiceRecording) { Alert.alert("Recording", "Stop the recording before switching modes."); return; } setAiMode(mode); }} />
        <View style={styles.aiHero}>
          {aiMode === "Voice" ? <Pressable style={[styles.aiMicHalo, voiceRecording && { backgroundColor: colors.roseSoft }]} onPress={() => void toggleVoiceRecording()} disabled={voiceBusy || !voiceAiOk || !token} accessibilityLabel={voiceRecording ? "Stop recording" : "Start recording"}>
            {voiceBusy && !voiceRecording ? <ActivityIndicator color={colors.primary} /> : <Ionicons name={voiceRecording ? "stop" : "mic"} size={40} color={voiceRecording ? colors.rose600 : colors.primary} />}
          </Pressable> : <View style={styles.aiMicHalo}><Ionicons name="chatbubble-ellipses-outline" size={40} color={colors.primary} /></View>}
          <Text style={styles.aiTitle}>{voiceRecording ? "Listening… tap to stop" : aiMode === "Voice" ? "Tap to start speaking" : "Describe a transaction"}</Text>
          <Text style={styles.aiQuote}>“I just bought lunch at Starbucks for $6.45 yesterday”</Text>
          {voiceRecording ? <View style={styles.waveform}>{[8, 16, 11, 25, 17, 30, 14, 22, 9, 18, 12, 27, 14].map((height, i) => <View key={i} style={[styles.waveBar, { height }]} />)}</View> : null}
          {voiceBusy ? <Text style={styles.aiStatus}>Processing your entry…</Text> : voiceRecording ? <Text style={styles.aiStatus}>Listening…</Text> : null}
        </View>
        <Text style={styles.aiFieldTitle}>Or type a description</Text>
        <View style={styles.aiTextBox}>
          <TextInput style={styles.aiInput} value={voicePhrase} onChangeText={setVoicePhrase} placeholder="Starbucks coffee $6.45 yesterday" placeholderTextColor={colors.gray400} multiline editable={!voiceBusy && voiceAiOk && Boolean(token)} accessibilityLabel="Transaction description" />
          <Pressable style={[styles.aiSend, (!voicePhrase.trim() || voiceBusy || !voiceAiOk || !token) && { opacity: 0.5 }]} onPress={() => void runParseFromText()} disabled={!voicePhrase.trim() || voiceBusy || !voiceAiOk || !token} accessibilityLabel="Parse description"><Ionicons name="arrow-forward" size={19} color="#fff" /></Pressable>
        </View>
        {!voiceAiOk || !token ? <Pressable onPress={() => navigation.navigate("Pricing")}><Text style={styles.aiLocked}>AI capture needs an active trial slot or Pro. View plans</Text></Pressable> : null}
        <Text style={styles.aiExamplesTitle}>Try these examples</Text>
        {["Lunch at Chipotle for $12.50", "Uber ride $18.20 on Apr 9", "Office supplies at Amazon $45"].map((example) => <Pressable key={example} style={styles.aiExample} onPress={() => { setVoicePhrase(example); setAiMode("Quick Text"); }}><Ionicons name="sparkles-outline" size={16} color={colors.primary} /><Text style={styles.aiExampleText}>{example}</Text></Pressable>)}
      </ScrollView>
    </LinearGradient>;
  }

  return (
    <LinearGradient colors={[...gradients.page]} style={styles.flex}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.gray900} />
        </Pressable>
        <Text style={styles.headerTitle}>{editId ? "Edit Transaction" : transactionType === "income" ? "Add Income" : "Add Expense"}</Text>
        {!editId ? <Pressable onPress={() => setAiCapture(true)} hitSlop={8} accessibilityLabel="Open AI capture"><Ionicons name="sparkles-outline" size={21} color={colors.primary} /></Pressable> : <View style={{ width: 24 }} />}
      </View>
      <ScrollView contentContainerStyle={styles.pad}>
        {sub && !sub.pro && sub.trialTimeActive && sub.canCreateTransaction ? (
          <View style={styles.subBannerTrial}>
            <Text style={styles.subBannerTitle}>Pro trial</Text>
            <Text style={styles.subBannerTxt}>
              {sub.trialAddsUsed} of {sub.trialAddsLimit} transactions used (all entry types count).
            </Text>
          </View>
        ) : null}
        {sub && !sub.pro && sub.blockReason ? (
          <View style={styles.subBannerWarn}>
            <Text style={styles.subBannerTitle}>Subscription</Text>
            <Text style={styles.subBannerTxt}>{sub.blockReason}</Text>
            <Pressable style={styles.subBannerBtn} onPress={() => navigation.navigate("Pricing")}>
              <Text style={styles.subBannerBtnTxt}>View plans</Text>
            </Pressable>
          </View>
        ) : null}

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

        {!editId ? <Pressable style={styles.aiEntry} onPress={() => setAiCapture(true)}><Ionicons name="sparkles-outline" size={19} color={colors.primary} /><View style={{ flex: 1 }}><Text style={styles.aiEntryTitle}>AI Capture</Text><Text style={styles.aiEntryText}>Speak or type to fill this form</Text></View><Ionicons name="chevron-forward" size={18} color={colors.gray500} /></Pressable> : null}
        <FormField label="Amount" icon="cash-outline" prefix={currency === "USD" ? "$" : currency} value={amount} onChangeText={setAmount} placeholder="0.00" keyboardType="decimal-pad" required />
        <FormField label={transactionType === "income" ? "Source" : "Merchant"} icon={transactionType === "income" ? "person-circle-outline" : "storefront-outline"} value={merchant} onChangeText={setMerchant} placeholder={transactionType === "income" ? "Income source" : "Store name"} />
        <SelectField label="Category" icon="pricetag-outline" value={category} onPress={() => setCatModal(true)} />
        <SelectField label="Date" icon="calendar-outline" value={date} onPress={() => setShowDatePicker(true)} />
        {showDatePicker && (
          <DateTimePicker value={dateObj} mode="date" display={Platform.OS === "ios" ? "spinner" : "default"} onChange={onDateChange} />
        )}
        {Platform.OS === "ios" && showDatePicker && (
          <Pressable style={styles.doneBtn} onPress={() => setShowDatePicker(false)}>
            <Text style={styles.doneBtnTxt}>Done</Text>
          </Pressable>
        )}

        <SelectField label={transactionType === "income" ? "Receive into account" : "Paid from / account"} icon="card-outline" value={paymentMethod} onPress={() => setAccModal(true)} />
        <FormField label="Notes (optional)" icon="document-text-outline" value={notes} onChangeText={setNotes} placeholder="Add a note..." multiline />
        {attachedScan || route.params?.scannedData || (editId && existing?.receipt_data) ? <View style={styles.attached}><Ionicons name="receipt-outline" size={18} color={colors.primary} /><Text style={styles.attachedText}>Receipt details attached</Text><Ionicons name="checkmark-circle" size={18} color={colors.success} /></View> : !editId ? <Pressable style={styles.attachLink} onPress={() => void attachReceiptFromGallery()} disabled={attachmentBusy}>{attachmentBusy ? <ActivityIndicator size="small" color={colors.primary} /> : <Ionicons name="attach-outline" size={18} color={colors.primary} />}<Text style={styles.attachLinkText}>{attachmentBusy ? "Reading receipt…" : "Attach receipt image (optional)"}</Text></Pressable> : null}

        <Animated.View style={{ transform: [{ translateY: keyboardLift }] }}>
          <AnimatedPressable
            style={[
              styles.saveBtn,
              (saving || attachmentBusy || (editId ? !canSaveEdit : !canSaveNew)) && { opacity: 0.55 },
            ]}
            onPress={save}
            disabled={saving || attachmentBusy || (editId ? !canSaveEdit : !canSaveNew)}
            pressedScale={0.985}
          >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveTxt}>{editId ? "Save changes" : transactionType === "income" ? "Save income" : "Save expense"}</Text>
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
    paddingTop: 8,
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
  aiEntry: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.purpleSoft, padding: 12, marginBottom: 16 },
  aiEntryTitle: { color: colors.textPrimary, fontSize: 13, fontWeight: "700" },
  aiEntryText: { color: colors.gray600, fontSize: 11, marginTop: 2 },
  aiPad: { padding: 16, paddingBottom: 36 },
  aiHero: { alignItems: "center", paddingTop: 34, paddingBottom: 28 },
  aiMicHalo: { width: 106, height: 106, borderRadius: 53, backgroundColor: colors.mintSoft, borderWidth: 9, borderColor: "#d5f4ef", alignItems: "center", justifyContent: "center" },
  aiTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: "700", marginTop: 14 },
  aiQuote: { color: colors.gray600, fontSize: 13, fontStyle: "italic", textAlign: "center", lineHeight: 19, marginTop: 8, maxWidth: 230 },
  waveform: { height: 36, flexDirection: "row", alignItems: "center", gap: 4, marginTop: 18 },
  waveBar: { width: 3, borderRadius: 3, backgroundColor: colors.primary },
  aiStatus: { color: colors.primary, backgroundColor: colors.mintSoft, borderRadius: 99, paddingHorizontal: 16, paddingVertical: 7, marginTop: 14, fontSize: 12, fontWeight: "700" },
  aiFieldTitle: { color: colors.textPrimary, fontSize: 13, fontWeight: "700", marginBottom: 7 },
  aiTextBox: { flexDirection: "row", borderWidth: 1, borderColor: colors.border, borderRadius: 14, backgroundColor: colors.surface, padding: 7, alignItems: "center", minHeight: 76 },
  aiInput: { flex: 1, minHeight: 56, paddingHorizontal: 8, color: colors.textPrimary, fontSize: 13, textAlignVertical: "top" },
  aiSend: { width: 33, height: 33, borderRadius: 17, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  aiLocked: { color: colors.primary, fontSize: 12, fontWeight: "600", marginTop: 10 },
  aiExamplesTitle: { color: colors.textPrimary, fontSize: 12, fontWeight: "700", marginTop: 18, marginBottom: 5 },
  aiExample: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", backgroundColor: colors.surface, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 9, marginTop: 8, borderWidth: 1, borderColor: colors.border },
  aiExampleText: { color: colors.gray700, fontSize: 12 },
  attached: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, padding: 12, backgroundColor: colors.mintSoft, marginBottom: 14 },
  attachedText: { color: colors.textPrimary, fontSize: 12, flex: 1, fontWeight: "600" },
  attachLink: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 12, paddingVertical: 8 },
  attachLinkText: { color: colors.primary, fontSize: 12, fontWeight: "700" },
  subBannerTrial: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary + "55",
    backgroundColor: colors.teal50,
    padding: 12,
    marginBottom: 14,
  },
  subBannerWarn: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fcd34d",
    backgroundColor: "#fffbeb",
    padding: 12,
    marginBottom: 14,
  },
  subBannerTitle: { fontSize: 13, fontWeight: "800", color: colors.gray900 },
  subBannerTxt: { fontSize: 12, color: colors.gray700, marginTop: 4, lineHeight: 17 },
  subBannerBtn: { marginTop: 10, alignSelf: "flex-start" },
  subBannerBtnTxt: { fontSize: 13, fontWeight: "700", color: colors.primary },
  typeRow: { flexDirection: "row", gap: 3, marginBottom: 16, padding: 3, borderRadius: 999, backgroundColor: "#edf3f9" },
  typeChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 0,
    alignItems: "center",
    backgroundColor: "transparent",
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
