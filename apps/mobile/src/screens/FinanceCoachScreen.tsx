import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAction, useQuery } from "convex/react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Audio } from "expo-av";
import * as Speech from "expo-speech";
import { readAsStringAsync } from "expo-file-system/legacy";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../convex/_generated/api";
import { colors, gradients, type as typeScale } from "../theme/tokens";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { useAuth } from "../contexts/AuthContext";
import { usePreferences } from "../contexts/PreferencesContext";
import { useSubscriptionState } from "../hooks/useSubscriptionState";
import type { DocTx } from "../types/transaction";
import {
  addMonthsYm,
  formatMonthYearLabel,
  todayYm,
  ymToDateRange,
} from "../utils/transactionMath";
import { userFacingError, userFacingErrorFromUnknown } from "../lib/userFacingErrors";
import type { RootStackParamList } from "../navigation/types";
import { MOBILE_NOT_ADVICE_DISCLAIMER } from "../lib/playStoreUiCopy";

type Msg = { role: "user" | "assistant"; content: string };
type Nav = NativeStackNavigationProp<RootStackParamList>;

export function FinanceCoachScreen() {
  const navigation = useNavigation<Nav>();
  const { workspace, ready } = useWorkspace();
  const { user, token } = useAuth();
  const { voiceInputLanguage } = usePreferences();
  const sub = useSubscriptionState();
  const aiOk = !sub || sub.canUseAiFeatures;
  const coachChat = useAction(api.voiceFinance.financeCoachChat);
  const transcribe = useAction(api.voiceFinance.transcribeUserAudio);

  const [period, setPeriod] = useState<"month" | "all">("month");
  const [selectedYm, setSelectedYm] = useState(() => todayYm());
  const range =
    period === "month"
      ? (() => {
          const { start, end } = ymToDateRange(selectedYm);
          return { startStr: start, endStr: end };
        })()
      : null;

  const all = useQuery(
    api.transactions.list,
    ready
      ? {
          workspace,
          userId: user?.id,
          startDate: range?.startStr,
          endDate: range?.endStr,
        }
      : "skip",
  );

  const [messages, setMessages] = useState<Msg[]>(() => [
    {
      role: "assistant",
      content:
        "What should we do with your saved entries this period? For example: list totals by category, rephrase a label, or turn your log into a short recap. This tool organizes what you already saved—it is not financial, investment, tax, or legal advice. Use voice or type.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const recRef = useRef<Audio.Recording | null>(null);
  const listRef = useRef<FlatList<Msg>>(null);

  const periodLabel =
    period === "month" ? formatMonthYearLabel(selectedYm) : "All loaded transactions";

  const rowsForAi = useMemo(() => {
    const raw = (all ?? []) as DocTx[];
    return raw.slice(0, 400).map((t) => ({
      date: t.date,
      amount: t.amount,
      type: t.type,
      category: t.category,
      merchant: t.merchant ?? undefined,
      description: t.description ?? undefined,
    }));
  }, [all]);

  useEffect(() => {
    return () => {
      Speech.stop();
      void (async () => {
        try {
          if (recRef.current) {
            await recRef.current.stopAndUnloadAsync();
            recRef.current = null;
          }
        } catch {
          /* ignore */
        }
      })();
    };
  }, []);

  const sendMessages = useCallback(
    async (nextMsgs: Msg[]) => {
      if (!user?.id) return;
      if (!token) {
        setMessages([
          ...nextMsgs,
          { role: "assistant", content: "Sign in to use Ask AI." },
        ]);
        return;
      }
      if (rowsForAi.length === 0) {
        setMessages([
          ...nextMsgs,
          {
            role: "assistant",
            content: "Save a few entries first — then you can ask AI to summarize or rephrase what you logged.",
          },
        ]);
        return;
      }
      setBusy(true);
      try {
        const out = await coachChat({
          periodLabel,
          rows: rowsForAi,
          messages: nextMsgs.map((m) => ({ role: m.role, content: m.content })),
          sessionToken: token,
        });
        if (!out.ok) {
          setMessages([
            ...nextMsgs,
            { role: "assistant", content: userFacingError(out.error ?? undefined) },
          ]);
          return;
        }
        setMessages([...nextMsgs, { role: "assistant", content: out.reply }]);
      } catch (e) {
        setMessages([
          ...nextMsgs,
          {
            role: "assistant",
            content: userFacingErrorFromUnknown(e),
          },
        ]);
      } finally {
        setBusy(false);
      }
    },
    [coachChat, periodLabel, rowsForAi, user?.id, token],
  );

  const onSend = useCallback(async () => {
    const t = input.trim();
    if (!t || busy || !token || !aiOk) return;
    Speech.stop();
    setInput("");
    const next: Msg[] = [...messages, { role: "user", content: t }];
    setMessages(next);
    await sendMessages(next);
  }, [input, busy, messages, sendMessages, token, aiOk]);

  const toggleRecord = useCallback(async () => {
    if (!token || !aiOk) return;
    if (busy || recording) {
      if (recording && recRef.current) {
        try {
          setRecording(false);
          await recRef.current.stopAndUnloadAsync();
          const uri = recRef.current.getURI();
          recRef.current = null;
          if (!uri) return;
          const b64 = await readAsStringAsync(uri, { encoding: "base64" });
          const lower = uri.toLowerCase();
          const mime = lower.endsWith(".webm")
            ? "audio/webm"
            : lower.endsWith(".wav")
              ? "audio/wav"
              : lower.endsWith(".caf")
                ? "audio/x-caf"
                : "audio/m4a";
          setBusy(true);
          const tr = await transcribe({
            audioBase64: b64,
            mimeType: mime,
            language: voiceInputLanguage,
            sessionToken: token,
          });
          setBusy(false);
          if (!tr.ok) {
            setMessages((m) => [
              ...m,
              { role: "assistant", content: userFacingError(tr.error ?? undefined) },
            ]);
            return;
          }
          const text = tr.text.trim();
          if (!text) return;
          let nextForSend: Msg[] = [];
          setMessages((prev) => {
            nextForSend = [...prev, { role: "user", content: text }];
            return nextForSend;
          });
          await sendMessages(nextForSend);
        } catch (e) {
          setBusy(false);
          setMessages((m) => [
            ...m,
            {
              role: "assistant",
              content: userFacingErrorFromUnknown(e),
            },
          ]);
        }
      }
      return;
    }

    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: "Microphone permission is needed for voice." },
        ]);
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      recRef.current = rec;
      setRecording(true);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: userFacingErrorFromUnknown(e),
        },
      ]);
    }
  }, [busy, recording, transcribe, sendMessages, voiceInputLanguage, token, aiOk]);

  const speakLastAssistant = useCallback(() => {
    const last = [...messages].reverse().find((m) => m.role === "assistant");
    if (!last?.content) return;
    Speech.stop();
    Speech.speak(last.content, {
      rate: 0.96,
      language: "en-US",
    });
  }, [messages]);

  const loadingData = !ready || all === undefined;

  return (
    <LinearGradient colors={[...gradients.page]} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={["top"]}>
        <View style={styles.topBar}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={14} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.gray900} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Ask AI</Text>
            <Text style={styles.sub} numberOfLines={1}>
              {periodLabel}
            </Text>
          </View>
          <Pressable onPress={speakLastAssistant} hitSlop={12} style={styles.iconBtn}>
            <Ionicons name="volume-high-outline" size={22} color={colors.primary} />
          </Pressable>
        </View>

        <View style={styles.periodRow}>
          <Pressable
            style={[styles.periodChip, period === "month" && styles.periodChipOn]}
            onPress={() => {
              setPeriod("month");
              setSelectedYm(todayYm());
            }}
          >
            <Text style={[styles.periodTxt, period === "month" && styles.periodTxtOn]}>Month</Text>
          </Pressable>
          <Pressable
            style={[styles.periodChip, period === "all" && styles.periodChipOn]}
            onPress={() => setPeriod("all")}
          >
            <Text style={[styles.periodTxt, period === "all" && styles.periodTxtOn]}>All</Text>
          </Pressable>
          {period === "month" ? (
            <View style={styles.monthNav}>
              <Pressable onPress={() => setSelectedYm((y) => addMonthsYm(y, -1))} hitSlop={8}>
                <Ionicons name="chevron-back" size={20} color={colors.gray600} />
              </Pressable>
              <Text style={styles.monthLbl}>{formatMonthYearLabel(selectedYm)}</Text>
              <Pressable onPress={() => setSelectedYm((y) => addMonthsYm(y, 1))} hitSlop={8}>
                <Ionicons name="chevron-forward" size={20} color={colors.gray600} />
              </Pressable>
            </View>
          ) : null}
        </View>

        {sub && !aiOk && sub.blockReason ? (
          <View style={styles.coachWarn}>
            <Text style={styles.coachWarnTxt}>{sub.blockReason}</Text>
            <Pressable onPress={() => navigation.navigate("Pricing")} style={{ marginTop: 6 }}>
              <Text style={styles.coachWarnLink}>View plans</Text>
            </Pressable>
          </View>
        ) : null}

        {loadingData ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
        ) : null}

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
        >
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(_, i) => `${i}`}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            contentContainerStyle={styles.listPad}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.bubble,
                  item.role === "user" ? styles.bubbleUser : styles.bubbleAssistant,
                ]}
              >
                <Text
                  style={item.role === "user" ? styles.bubbleTxtUser : styles.bubbleTxtAssistant}
                >
                  {item.content}
                </Text>
              </View>
            )}
          />

          <View style={styles.inputRow}>
            <Pressable
              style={[styles.micOuter, recording && styles.micRecording]}
              onPress={() => void toggleRecord()}
              disabled={busy || !aiOk || !token}
            >
              {busy && !recording ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons name={recording ? "stop" : "mic"} size={22} color={recording ? "#fff" : colors.primary} />
              )}
            </Pressable>
            <TextInput
              style={styles.input}
              placeholder="What do you want AI to do with your entries?"
              placeholderTextColor={colors.gray400}
              value={input}
              onChangeText={setInput}
              multiline
              editable={!busy && aiOk && Boolean(token)}
            />
            <Pressable
              style={[styles.sendBtn, (!input.trim() || busy || !aiOk || !token) && { opacity: 0.45 }]}
              onPress={() => void onSend()}
              disabled={!input.trim() || busy || !aiOk || !token}
            >
              {busy ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={18} color="#fff" />
              )}
            </Pressable>
          </View>
          {recording ? (
            <Text style={styles.recHint}>Recording… tap again to stop and transcribe</Text>
          ) : null}
          <Text style={styles.adviceDisclaimer}>{MOBILE_NOT_ADVICE_DISCLAIMER}</Text>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  backBtn: { padding: 8 },
  title: { fontSize: typeScale.headline, fontWeight: "800", color: colors.gray900 },
  sub: { fontSize: typeScale.xs, color: colors.gray500, marginTop: 2 },
  iconBtn: { padding: 8 },
  coachWarn: {
    marginHorizontal: 12,
    marginBottom: 6,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#fcd34d",
    backgroundColor: "#fffbeb",
  },
  coachWarnTxt: { fontSize: 12, color: "#78350f", lineHeight: 17 },
  coachWarnLink: { fontSize: 13, fontWeight: "700", color: colors.primary },
  adviceDisclaimer: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
    fontSize: 10,
    lineHeight: 14,
    color: colors.gray500,
    textAlign: "center",
  },
  periodRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  periodChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.gray100,
  },
  periodChipOn: { backgroundColor: colors.primary + "22" },
  periodTxt: { fontSize: typeScale.sm, fontWeight: "600", color: colors.gray600 },
  periodTxtOn: { color: colors.primary },
  monthNav: { flexDirection: "row", alignItems: "center", gap: 6, marginLeft: "auto" },
  monthLbl: { fontSize: typeScale.xs, fontWeight: "700", color: colors.gray700, minWidth: 100, textAlign: "center" },
  listPad: { padding: 16, paddingBottom: 8 },
  bubble: {
    maxWidth: "88%",
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
  },
  bubbleUser: {
    alignSelf: "flex-end",
    backgroundColor: colors.primary,
  },
  bubbleAssistant: {
    alignSelf: "flex-start",
    backgroundColor: colors.gray100,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  bubbleTxtUser: { fontSize: typeScale.md, color: "#fff", lineHeight: 22 },
  bubbleTxtAssistant: { fontSize: typeScale.md, color: colors.gray900, lineHeight: 22 },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    padding: 12,
    paddingBottom: Platform.OS === "ios" ? 22 : 14,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    backgroundColor: colors.surface,
  },
  micOuter: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  micRecording: { backgroundColor: colors.rose600, borderColor: colors.rose600 },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: typeScale.md,
    color: colors.gray900,
    backgroundColor: "#fff",
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  recHint: {
    textAlign: "center",
    fontSize: typeScale.xs,
    color: colors.rose600,
    paddingBottom: 8,
    backgroundColor: colors.surface,
  },
});
