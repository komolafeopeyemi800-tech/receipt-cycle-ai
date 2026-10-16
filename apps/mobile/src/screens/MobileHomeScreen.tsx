import { TrialAccessSheet } from "../components/TrialAccessSheet";
import { shouldShowTrialSheet } from "../lib/paywallSession";
import { usePaymentFlow } from "../contexts/PaymentFlowContext";
import { useEstimateFlow } from "../contexts/EstimateFlowContext";
import { useInvoiceFlow } from "../contexts/InvoiceFlowContext";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "../lib/api";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { usePreferences } from "../contexts/PreferencesContext";
import { useSubscriptionState } from "../hooks/useSubscriptionState";
import { buildSummary, filterByMonth } from "../utils/transactionMath";
import type { DocTx } from "../types/transaction";
import {
  colors,
  gradients,
  radius,
  shadows,
  spacing,
  uiType,
} from "../theme/tokens";
import {
  PremiumIcon,
  TransactionGlyph,
  type IconTone,
} from "../components/ui/PremiumIcon";

type IconName = ComponentProps<typeof Ionicons>["name"];

export function MobileHomeScreen() {
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { workspace, ready } = useWorkspace();
  const { user, token } = useAuth();
  const { formatMoney, formatDate } = usePreferences();
  const subscription = useSubscriptionState();
  const all = useQuery(
    api.transactions.list,
    ready ? { workspace, userId: user?.id } : "skip",
  );
  const rows = (all ?? []) as DocTx[];
  const summary = useMemo(() => buildSummary(filterByMonth(rows)), [rows]);
  const firstName = user?.name?.trim().split(/\s+/)[0] || "there";
  const root = navigation.getParent();
  const { startNewPayment } = usePaymentFlow();
  const { startNewInvoice } = useInvoiceFlow();
  const { startNewEstimate } = useEstimateFlow();
  const openRoot = (route: string, params?: object) =>
    root?.navigate(route, params);
  const promotionRef = useRef<ScrollView>(null);
  const [promotionIndex, setPromotionIndex] = useState(0);
  const [aiEntryMode, setAiEntryMode] = useState<"Voice" | "Quick Text">(
    "Voice",
  );
  const [aiEntryText, setAiEntryText] = useState("");
  const [showDailyAccess, setShowDailyAccess] = useState(false);
  const waveMotions = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const micPulseOne = useRef(new Animated.Value(0)).current;
  const micPulseTwo = useRef(new Animated.Value(0)).current;
  const promotionWidth = Math.max(260, width - spacing.lg * 2);
  const primaryTools: {
    label: string;
    icon: IconName;
    tone: IconTone;
    action: () => void;
  }[] = [
    {
      label: "AI capture",
      icon: "mic",
      tone: "purple",
      action: () => openRoot("AddTransaction", { initialMode: "ai" }),
    },
    {
      label: "Scan receipt",
      icon: "scan-outline",
      tone: "mint",
      action: () => openRoot("ScanReceipt"),
    },
    {
      label: "Add transaction",
      icon: "add-circle-outline",
      tone: "rose",
      action: () => openRoot("AddTransaction"),
    },
    {
      label: "Invoice",
      icon: "document-text-outline",
      tone: "blue",
      action: () => { startNewInvoice(); openRoot("InvoiceCreate"); },
    },
  ];
  const secondaryTools: {
    label: string;
    icon: IconName;
    tone: IconTone;
    action: () => void;
  }[] = [
    {
      label: "Payments",
      icon: "card-outline",
      tone: "mint",
      action: () => navigation.navigate("Sales", { screen: "SalesPayments" }),
    },
    {
      label: "Reports",
      icon: "bar-chart-outline",
      tone: "purple",
      action: () => navigation.navigate("Analysis"),
    },
    {
      label: "Customers",
      icon: "people-outline",
      tone: "blue",
      action: () => navigation.navigate("Sales", { screen: "SalesCustomers" }),
    },
    {
      label: "Budgets",
      icon: "pie-chart-outline",
      tone: "amber",
      action: () => navigation.navigate("More", { screen: "Budgets" }),
    },
    {
      label: "Accounts",
      icon: "wallet-outline",
      tone: "mint",
      action: () => navigation.navigate("More", { screen: "Accounts" }),
    },
    {
      label: "Categories",
      icon: "pricetags-outline",
      tone: "rose",
      action: () => navigation.navigate("More", { screen: "Categories" }),
    },
    {
      label: "Record payment",
      icon: "cash-outline",
      tone: "amber",
      action: () => { startNewPayment(); openRoot("PaymentCreate"); },
    },
    {
      label: "More",
      icon: "grid-outline",
      tone: "blue",
      action: () => openRoot("AllFeatures"),
    },
  ];
  const promotions = [
    {
      title: "Turn receipts into records",
      body: "Use the AI scanner to extract receipt details, then review before saving.",
      cta: "Try AI scanner",
      icon: "scan-outline" as IconName,
      tone: ["#0f766e", "#149184"] as const,
      action: () => openRoot("ScanReceipt"),
    },
    {
      title: "Send a professional estimate",
      body: "Build a quotation, share it with a customer, and convert accepted work into an invoice.",
      cta: "Create estimate",
      icon: "calculator-outline" as IconName,
      tone: ["#1d4ed8", "#2563eb"] as const,
      action: () => { startNewEstimate(); openRoot("EstimateCreate"); },
    },
    {
      title: "Plan before you spend",
      body: "Set category budgets and compare what you planned with what you actually spent.",
      cta: "Set a budget",
      icon: "pie-chart-outline" as IconName,
      tone: ["#b45309", "#f59e0b"] as const,
      action: () => navigation.navigate("More", { screen: "Budgets" }),
    },
  ];

  const aiLocked = Boolean(subscription && !subscription.canUseAiFeatures);
  const openAiCapture = (mode = aiEntryMode) => {
    if (aiLocked) {
      Alert.alert(
        "Trial access ended",
        "Your 7-day trial or 25-transaction allowance has ended. Account access is managed on Receipt Cycle web.",
      );
      return;
    }
    openRoot("AddTransaction", {
      initialMode: "ai",
      initialAiMode: mode,
      initialAiText: aiEntryText.trim() || undefined,
    });
  };

  useEffect(() => {
    // Free accounts only (never paid plans), once per sign-in, and never in the session where onboarding was just finished.
    if (!user?.id || !subscription || subscription.pro) return;
    if (shouldShowTrialSheet(user.id, token ?? null)) setShowDailyAccess(true);
  }, [subscription, user?.id, token]);

  const dismissDailyAccess = () => {
    setShowDailyAccess(false);
  };

  // The looping voice animations only run while Home is the focused tab, the Voice card is shown and the page is idle.
  // Scroll start/stop toggles them through refs (no state, so the long Home tree is not re-rendered while scrolling).
  const focused = useIsFocused();
  const scrollingRef = useRef(false);
  const scrollIdle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loopsRunning = useRef(false);
  const loopsRef = useRef<Animated.CompositeAnimation[]>([]);
  const wantLoops = useRef(false);

  const syncLoops = () => {
    const shouldRun = wantLoops.current && !scrollingRef.current;
    if (shouldRun === loopsRunning.current) return;
    loopsRunning.current = shouldRun;
    loopsRef.current.forEach((loop) => (shouldRun ? loop.start() : loop.stop()));
  };
  const markScrolling = () => {
    if (scrollIdle.current) clearTimeout(scrollIdle.current);
    scrollingRef.current = true;
    syncLoops();
  };
  const markIdle = () => {
    if (scrollIdle.current) clearTimeout(scrollIdle.current);
    scrollIdle.current = setTimeout(() => {
      scrollingRef.current = false;
      syncLoops();
    }, 400);
  };

  useEffect(() => {
    const waveLoops = waveMotions.map((motion, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 70),
          Animated.timing(motion, {
            toValue: 1,
            duration: [360, 470, 320, 540][index],
            useNativeDriver: true,
          }),
          Animated.timing(motion, {
            toValue: 0,
            duration: [430, 310, 520, 350][index],
            useNativeDriver: true,
          }),
        ]),
      ),
    );
    const makePulse = (motion: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(motion, {
            toValue: 1,
            duration: 1350,
            useNativeDriver: true,
          }),
          Animated.timing(motion, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      );
    loopsRef.current = [
      ...waveLoops,
      makePulse(micPulseOne, 0),
      makePulse(micPulseTwo, 675),
    ];
    loopsRunning.current = false;
    syncLoops();
    return () => {
      loopsRef.current.forEach((loop) => loop.stop());
      loopsRef.current = [];
      loopsRunning.current = false;
      if (scrollIdle.current) clearTimeout(scrollIdle.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waveMotions, micPulseOne, micPulseTwo]);

  useEffect(() => {
    wantLoops.current = focused && aiEntryMode === "Voice";
    syncLoops();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focused, aiEntryMode]);

  useEffect(() => {
    if (!focused) return;
    const timer = setInterval(() => {
      if (scrollingRef.current) return;
      setPromotionIndex((current) => {
        const next = (current + 1) % promotions.length;
        promotionRef.current?.scrollTo({
          x: next * promotionWidth,
          animated: true,
        });
        return next;
      });
    }, 5000);
    return () => clearInterval(timer);
  }, [promotionWidth, focused]);

  return (
    <LinearGradient colors={[...gradients.page]} style={styles.flex}>
      <TrialAccessSheet visible={showDailyAccess} onDismiss={dismissDailyAccess} subscription={subscription} />
      <ScrollView
        contentContainerStyle={[
          styles.page,
          { paddingTop: Math.max(insets.top, spacing.lg) },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        decelerationRate="normal"
        onScrollBeginDrag={markScrolling}
        onScrollEndDrag={markIdle}
        onMomentumScrollBegin={markScrolling}
        onMomentumScrollEnd={markIdle}
        nestedScrollEnabled
      >
        <View style={styles.header}>
          <View style={styles.identity}>
            <Pressable
              style={styles.avatar}
              onPress={() => openRoot("PersonalProfile")}
              accessibilityRole="button"
              accessibilityLabel="Open my profile"
            >
              {user?.image ? (
                <Image
                  source={{ uri: user.image }}
                  style={styles.avatarImage}
                />
              ) : (
                <LinearGradient
                  colors={[colors.primary, colors.blue600]}
                  style={styles.avatarFallback}
                >
                  <Ionicons name="person" size={22} color="#fff" />
                </LinearGradient>
              )}
            </Pressable>
            <View style={styles.nameCopy}>
              <Text style={styles.greeting} numberOfLines={1}>
                Hi, {firstName}
              </Text>
              <Text style={styles.subtitle}>Your business at a glance</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              style={styles.iconButton}
              onPress={() => openRoot("Notifications")}
              accessibilityLabel="Notifications"
            >
              <Ionicons
                name="notifications-outline"
                size={21}
                color={colors.textPrimary}
              />
            </Pressable>
          </View>
        </View>
        {!ready || all === undefined ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : (
          <>
            <LinearGradient
              colors={[colors.primaryDark, colors.primary, colors.teal600]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.balanceCard}
            >
              <View style={styles.balanceTop}>
                <View style={styles.balanceCopy}>
                  <Text style={styles.balanceLabel}>Net this month</Text>
                  <Text
                    style={styles.balanceAmount}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.42}
                  >
                    {formatMoney(summary.netBalance)}
                  </Text>
                </View>
                <View style={styles.balanceIcon}>
                  <Ionicons name="wallet-outline" size={24} color="#fff" />
                </View>
              </View>
              <View style={styles.balanceDivider} />
              <View style={styles.balanceStats}>
                <View style={styles.balanceStat}>
                  <Text style={styles.balanceStatLabel}>Income</Text>
                  <Text
                    style={styles.balanceStatValue}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.6}
                  >
                    {formatMoney(summary.totalIncome)}
                  </Text>
                </View>
                <View style={styles.balanceStat}>
                  <Text style={styles.balanceStatLabel}>Expenses</Text>
                  <Text
                    style={styles.balanceStatValue}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.6}
                  >
                    {formatMoney(summary.totalExpenses)}
                  </Text>
                </View>
              </View>
            </LinearGradient>
            <Pressable
              style={styles.webAccessCard}
              onPress={() => void Linking.openURL(process.env.EXPO_PUBLIC_WEB_APP_URL?.trim() || "https://receiptcycle.com")}
              accessibilityRole="link"
              accessibilityLabel="Open Receipt Cycle website"
            >
              <View style={styles.webBrowserIcon}>
                <View style={styles.webBrowserTop}><View style={styles.webBrowserDots}><View style={styles.webBrowserDot} /><View style={styles.webBrowserDot} /><View style={styles.webBrowserDot} /></View></View>
                <Ionicons name="globe-outline" size={14} color={colors.primary} />
              </View>
              <View style={styles.webTitleBox}>
                <Text style={styles.webAccessTitle} numberOfLines={1}>Access Web</Text>
                <Text style={styles.webAccessTitle} numberOfLines={1}>Version</Text>
              </View>
              <View style={styles.webSecurityMark}>
                <View style={styles.webSecurityRing}><Ionicons name="lock-closed-outline" size={21} color={colors.primary} /></View>
                <View style={styles.webCrown}><Ionicons name="diamond" size={8} color="#fff" /></View>
              </View>
              <Ionicons name="arrow-forward" size={34} color={colors.primary} />
            </Pressable>
            <View style={styles.primaryRow}>
              {primaryTools.map((tool) => (
                <Pressable
                  key={tool.label}
                  style={styles.primaryTool}
                  onPress={tool.action}
                >
                  <PremiumIcon icon={tool.icon} tone={tool.tone} size={48} />
                  <Text style={styles.primaryLabel} numberOfLines={2}>
                    {tool.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.aiCaptureCard}>
              <View style={styles.aiCaptureTop}>
                <View style={styles.aiCaptureHeading}>
                  <View style={styles.aiSparkleBadge}>
                    <Ionicons
                      name="sparkles"
                      size={15}
                      color={colors.purple600}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.aiTitleRow}>
                      <Text style={styles.aiCaptureTitle}>
                        Tell AI your transaction
                      </Text>
                    </View>
                    <Text style={styles.aiCaptureSubtitle}>
                      Speak naturally or type it. AI prepares the record for
                      your review.
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.aiModeTabs}>
                <Pressable
                  style={[
                    styles.aiModeTab,
                    aiEntryMode === "Voice" && styles.aiModeTabActive,
                  ]}
                  onPress={() => setAiEntryMode("Voice")}
                >
                  <Ionicons
                    name="mic"
                    size={16}
                    color={
                      aiEntryMode === "Voice" ? "#fff" : colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.aiModeText,
                      aiEntryMode === "Voice" && styles.aiModeTextActive,
                    ]}
                  >
                    Voice
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.aiModeTab,
                    aiEntryMode === "Quick Text" && styles.aiModeTabActive,
                  ]}
                  onPress={() => setAiEntryMode("Quick Text")}
                >
                  <Ionicons
                    name="create"
                    size={16}
                    color={
                      aiEntryMode === "Quick Text"
                        ? "#fff"
                        : colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.aiModeText,
                      aiEntryMode === "Quick Text" && styles.aiModeTextActive,
                    ]}
                  >
                    Type
                  </Text>
                </Pressable>
              </View>

              {aiEntryMode === "Voice" ? (
                <Pressable
                  style={styles.voiceStage}
                  onPress={() => openAiCapture("Voice")}
                  accessibilityLabel={
                    aiLocked
                      ? "Unlock AI voice capture"
                      : "Start AI voice capture"
                  }
                >
                  <View style={styles.waveform}>
                    {[
                      0.55, 0.9, 0.68, 1, 0.72, 0.88, 0.58, 0.96, 0.64, 0.82,
                      0.52, 0.92, 0.7, 1, 0.6, 0.86,
                    ].map((height, index) => (
                      <Animated.View
                        key={`${height}-${index}`}
                        style={[
                          styles.waveBar,
                          {
                            height: 30 * height,
                            backgroundColor:
                              index % 3 === 0
                                ? colors.teal600
                                : index % 2 === 0
                                  ? colors.primary
                                  : colors.purple600,
                            transform: [
                              {
                                scaleY: waveMotions[
                                  index % waveMotions.length
                                ].interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [
                                    0.28 + (index % 3) * 0.08,
                                    0.82 + height * 0.52,
                                  ],
                                }),
                              },
                            ],
                          },
                        ]}
                      />
                    ))}
                  </View>
                  <View style={styles.micArea}>
                    {[micPulseOne, micPulseTwo].map((pulse, index) => (
                      <Animated.View
                        key={index}
                        style={[
                          styles.micPulse,
                          {
                            opacity: pulse.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.42, 0],
                            }),
                            transform: [
                              {
                                scale: pulse.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0.82, 1.72],
                                }),
                              },
                            ],
                          },
                        ]}
                      />
                    ))}
                    <LinearGradient
                      colors={[colors.purple600, colors.primary]}
                      style={styles.micButton}
                    >
                      <Ionicons
                        name={aiLocked ? "lock-closed" : "mic"}
                        size={22}
                        color="#fff"
                      />
                    </LinearGradient>
                  </View>
                  <Text style={styles.voicePrompt}>
                    {aiLocked ? "Unlock AI capture" : "Tap and speak naturally"}
                  </Text>
                </Pressable>
              ) : (
                <View style={styles.typeStage}>
                  <TextInput
                    value={aiEntryText}
                    onChangeText={setAiEntryText}
                    placeholder="Try “Paid $45 for office supplies today”"
                    placeholderTextColor={colors.textMuted}
                    style={styles.aiTextInput}
                    multiline
                    editable={!aiLocked}
                    onFocus={() => { if (aiLocked) openAiCapture("Quick Text"); }}
                  />
                  <Pressable
                    style={styles.aiSendButton}
                    onPress={() => openAiCapture("Quick Text")}
                  >
                    <Ionicons
                      name={aiLocked ? "lock-closed" : "arrow-forward"}
                      size={18}
                      color="#fff"
                    />
                  </Pressable>
                </View>
              )}
            </View>
            <View style={styles.toolCard}>
              {secondaryTools.map((tool) => (
                <Pressable
                  key={tool.label}
                  style={styles.tool}
                  onPress={tool.action}
                >
                  <PremiumIcon icon={tool.icon} tone={tool.tone} size={44} />
                  <Text style={styles.toolLabel} numberOfLines={2}>
                    {tool.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.promotionWrap}>
              <ScrollView
                ref={promotionRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(event) =>
                  setPromotionIndex(
                    Math.round(
                      event.nativeEvent.contentOffset.x / promotionWidth,
                    ),
                  )
                }
              >
                {promotions.map((promo) => (
                  <Pressable
                    key={promo.title}
                    onPress={promo.action}
                    style={{ width: promotionWidth }}
                  >
                    <LinearGradient
                      colors={[...promo.tone]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.promotion}
                    >
                      <View style={styles.promotionCopy}>
                        <Text style={styles.promotionTitle}>{promo.title}</Text>
                        <Text style={styles.promotionBody}>{promo.body}</Text>
                        <View style={styles.promotionCta}>
                          <Text style={styles.promotionCtaText}>
                            {promo.cta}
                          </Text>
                          <Ionicons
                            name="arrow-forward"
                            size={15}
                            color={colors.primaryDark}
                          />
                        </View>
                      </View>
                      <View style={styles.promotionIcon}>
                        <Ionicons name={promo.icon} size={35} color="#fff" />
                      </View>
                    </LinearGradient>
                  </Pressable>
                ))}
              </ScrollView>
              <View style={styles.dots}>
                {promotions.map((promo, index) => (
                  <View
                    key={promo.title}
                    style={[
                      styles.dot,
                      index === promotionIndex && styles.dotActive,
                    ]}
                  />
                ))}
              </View>
            </View>
            {rows.length === 0 ? (
              <Pressable
                style={styles.emptyCard}
                onPress={() => openRoot("ScanReceipt")}
                accessibilityRole="button"
              >
                <View style={styles.emptyIcon}>
                  <Ionicons name="camera-outline" size={22} color="#fff" />
                </View>
                <View style={styles.emptyCopy}>
                  <Text style={styles.emptyTitle}>Add your first record</Text>
                  <Text style={styles.emptyText}>
                    Scan a receipt to get started.
                  </Text>
                </View>
                <Ionicons
                  name="arrow-forward"
                  size={19}
                  color={colors.primary}
                />
              </Pressable>
            ) : (
              <>
                <View style={styles.sectionHead}>
                  <Text style={styles.sectionTitle}>Recent activity</Text>
                  <Pressable onPress={() => navigation.navigate("Records")}>
                    <Text style={styles.sectionLink}>View all</Text>
                  </Pressable>
                </View>
                <View style={styles.activityCard}>
                  {rows.slice(0, 4).map((tx, index) => (
                    <Pressable
                      key={tx.id}
                      style={[
                        styles.activityRow,
                        index < Math.min(rows.length, 4) - 1 &&
                          styles.rowDivider,
                      ]}
                      onPress={() =>
                        openRoot("TransactionDetail", { transactionId: tx.id })
                      }
                    >
                      <TransactionGlyph
                        merchant={tx.merchant}
                        category={tx.category}
                        type={tx.type}
                        size={38}
                      />
                      <View style={styles.activityCopy}>
                        <Text style={styles.activityTitle} numberOfLines={1}>
                          {tx.merchant || tx.category}
                        </Text>
                        <Text style={styles.activityMeta}>
                          {tx.category} · {formatDate(tx.date)}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.activityAmount,
                          {
                            color:
                              tx.type === "income"
                                ? colors.success
                                : colors.rose600,
                          },
                        ]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.62}
                      >
                        {tx.type === "income" ? "+" : "-"}
                        {formatMoney(Math.abs(tx.amount))}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  accessOverlay: { flex: 1 },
  accessScroll: { flexGrow: 1, paddingHorizontal: spacing.xl, paddingBottom: 132 },
  accessBadge: { width: 56, height: 56, borderRadius: 18, backgroundColor: "#68e0ca", alignItems: "center", justifyContent: "center", marginBottom: spacing.lg },
  accessEyebrow: { color: "#68e0ca", fontSize: 12, fontWeight: "900", letterSpacing: 1.6 },
  accessTitle: { color: "#fff", fontSize: 34, lineHeight: 40, fontWeight: "900", marginTop: spacing.sm, maxWidth: 360 },
  accessCopy: { color: "#a9bac2", fontSize: uiType.body, lineHeight: 24, marginTop: spacing.md, marginBottom: spacing.xl },
  accessUsage: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#10272b", borderWidth: 1, borderColor: "#214348", padding: spacing.lg, borderRadius: 20, marginBottom: spacing.xl },
  accessUsageLabel: { color: "#8da4ad", fontSize: 11, fontWeight: "900", letterSpacing: 1.1 },
  accessUsageValue: { color: "#fff", fontSize: 24, lineHeight: 30, fontWeight: "900", marginTop: 4 },
  accessUsageIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: "#19393c", alignItems: "center", justifyContent: "center" },
  accessIncluded: { color: "#fff", fontSize: uiType.sectionTitle, fontWeight: "900", marginBottom: spacing.md },
  accessBenefit: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: "#101b20", borderRadius: 18, padding: spacing.md, marginBottom: spacing.md },
  accessBenefitIcon: { width: 48, height: 48, borderRadius: 15, backgroundColor: "#173035", alignItems: "center", justifyContent: "center" },
  accessBenefitCopy: { flex: 1 },
  accessBenefitTitle: { color: "#fff", fontSize: uiType.body, fontWeight: "900", marginBottom: 3 },
  accessBenefitText: { color: "#9fb0b8", fontSize: uiType.caption, lineHeight: 18 },
  accessWebNote: { color: "#80949d", fontSize: uiType.caption, lineHeight: 18, marginTop: spacing.md, textAlign: "center" },
  accessFooter: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: spacing.lg, paddingTop: spacing.md, backgroundColor: "rgba(7,19,28,0.97)", borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#20333a" },
  accessSkip: { minHeight: 56, borderRadius: 17, backgroundColor: "#68e0ca", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm },
  accessSkipText: { color: "#07131c", fontSize: uiType.body, fontWeight: "900" },
  page: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xl,
  },
  identity: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  nameCopy: { flex: 1, minWidth: 0 },
  avatar: { width: 44, height: 44, borderRadius: 22, overflow: "hidden" },
  avatarImage: { width: 44, height: 44, borderRadius: 22 },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  greeting: {
    color: colors.textPrimary,
    fontSize: uiType.sectionTitle,
    fontWeight: "800",
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: uiType.secondary,
    marginTop: 2,
  },
  headerActions: { flexDirection: "row", gap: spacing.sm },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  loader: { marginVertical: 80 },
  balanceCard: {
    borderRadius: radius.extraLarge,
    padding: spacing.xl,
    ...shadows.floating,
  },
  balanceTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  balanceCopy: { flex: 1, minWidth: 0, paddingRight: spacing.md },
  balanceLabel: {
    color: "rgba(255,255,255,0.78)",
    fontSize: uiType.caption,
    fontWeight: "700",
  },
  balanceAmount: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.45,
    marginTop: 5,
    width: "100%",
    includeFontPadding: false,
  },
  balanceIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  balanceDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.17)",
    marginVertical: spacing.md,
  },
  balanceStats: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  balanceStat: { flex: 1, minWidth: 0 },
  balanceStatLabel: {
    color: "rgba(255,255,255,0.72)",
    fontSize: uiType.caption,
  },
  balanceStatValue: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: -0.2,
    marginTop: 3,
    width: "100%",
  },
  latestStrip: {
    minHeight: 58,
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.large,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    ...shadows.card,
  },
  webAccessCard: { flexDirection: "row", alignItems: "center", marginTop: 14, paddingHorizontal: 14, paddingVertical: 10, minHeight: 70, borderRadius: 2, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, ...shadows.card },
  webBrowserIcon: { width: 32, height: 27, borderRadius: 2, borderWidth: 2, borderColor: colors.primary, alignItems: "center", justifyContent: "flex-end", paddingBottom: 1, marginRight: 14 },
  webBrowserTop: { position: "absolute", top: 0, left: 0, right: 0, height: 7, borderBottomWidth: 1.5, borderBottomColor: colors.primary, justifyContent: "center", paddingLeft: 3 },
  webBrowserDots: { flexDirection: "row", gap: 3 },
  webBrowserDot: { width: 2, height: 2, borderRadius: 1, backgroundColor: colors.primary },
  webTitleBox: { flex: 1, minWidth: 0 },
  webAccessTitle: { color: colors.textPrimary, fontSize: 16, lineHeight: 21, fontWeight: "500" },
  webSecurityMark: { width: 42, height: 42, marginRight: 9, flexShrink: 0, alignItems: "center", justifyContent: "center" },
  webSecurityRing: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: colors.primary, alignItems: "center", justifyContent: "center" },
  webCrown: { position: "absolute", right: -1, bottom: 0, width: 19, height: 19, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: colors.amber600, borderWidth: 2, borderColor: colors.surface },
  latestIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: colors.mintSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  latestCopy: { flex: 1, minWidth: 0 },
  latestTitle: {
    color: colors.textPrimary,
    fontSize: uiType.secondary,
    fontWeight: "800",
  },
  latestMeta: {
    color: colors.textMuted,
    fontSize: uiType.caption,
    marginTop: 2,
  },
  historyLabel: {
    color: colors.primary,
    fontSize: uiType.caption,
    fontWeight: "800",
  },
  primaryRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  primaryTool: {
    flex: 1,
    minWidth: 0,
    minHeight: 92,
    backgroundColor: colors.surface,
    borderRadius: radius.large,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xs,
    ...shadows.card,
  },
  primaryIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  primaryLabel: {
    minHeight: 25,
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
  },
  aiCaptureCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.extraLarge,
    borderWidth: 1,
    borderColor: "#d8e8e5",
    ...shadows.floating,
  },
  aiCaptureTop: { marginBottom: spacing.md },
  aiCaptureHeading: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  aiSparkleBadge: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: colors.purpleSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  aiTitleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  aiCaptureTitle: {
    flexShrink: 1,
    color: colors.textPrimary,
    fontSize: uiType.body,
    fontWeight: "900",
  },
  aiCaptureSubtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 3,
  },
  premiumPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.purpleSoft,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  premiumPillText: {
    color: colors.purple600,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  aiModeTabs: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: colors.gray100,
    borderRadius: radius.medium,
    padding: 4,
  },
  aiModeTab: {
    flex: 1,
    minHeight: 38,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  aiModeTabActive: { backgroundColor: colors.primary },
  aiModeText: { color: colors.textSecondary, fontSize: 12, fontWeight: "800" },
  aiModeTextActive: { color: "#fff" },
  voiceStage: {
    minHeight: 92,
    marginTop: spacing.sm,
    borderRadius: radius.large,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: "#dff1ed",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
  },
  waveform: {
    flex: 1,
    height: 46,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    overflow: "hidden",
  },
  waveBar: { width: 3, borderRadius: 3 },
  micArea: {
    width: 54,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
  },
  micPulse: {
    position: "absolute",
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
  },
  micButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  voicePrompt: {
    width: 80,
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "800",
    textAlign: "center",
  },
  typeStage: {
    minHeight: 88,
    marginTop: spacing.sm,
    borderRadius: radius.large,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: "#dff1ed",
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.sm,
    gap: spacing.sm,
  },
  aiTextInput: {
    flex: 1,
    minHeight: 66,
    maxHeight: 86,
    color: colors.textPrimary,
    fontSize: 12,
    lineHeight: 17,
    paddingHorizontal: spacing.sm,
    textAlignVertical: "center",
  },
  aiSendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: uiType.sectionTitle,
    fontWeight: "800",
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  toolCard: {
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.large,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    flexDirection: "row",
    flexWrap: "wrap",
    ...shadows.card,
  },
  tool: {
    width: "25%",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: 2,
  },
  toolIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  toolLabel: {
    minHeight: 25,
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
  },
  promotionWrap: {
    marginTop: spacing.sm,
    borderRadius: radius.large,
    overflow: "hidden",
  },
  promotion: {
    minHeight: 112,
    borderRadius: radius.large,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
  },
  promotionCopy: { flex: 1, minWidth: 0, paddingRight: spacing.md },
  promotionTitle: { color: "#fff", fontSize: uiType.body, fontWeight: "900" },
  promotionBody: {
    color: "rgba(255,255,255,0.84)",
    fontSize: 11,
    lineHeight: 14,
    marginTop: 3,
  },
  promotionCta: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fff",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    marginTop: spacing.sm,
  },
  promotionCtaText: {
    color: colors.primaryDark,
    fontSize: 10,
    fontWeight: "800",
  },
  promotionIcon: {
    width: 48,
    height: 48,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  dots: {
    position: "absolute",
    bottom: 6,
    alignSelf: "center",
    flexDirection: "row",
    gap: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.45)",
  },
  dotActive: { width: 14, backgroundColor: "#fff" },
  emptyCard: {
    marginTop: spacing.md,
    minHeight: 76,
    backgroundColor: "#f0fbf8",
    borderRadius: radius.large,
    borderWidth: 1,
    borderColor: "#c8eee5",
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    ...shadows.card,
  },
  emptyIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCopy: { flex: 1, minWidth: 0 },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: uiType.body,
    fontWeight: "800",
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: uiType.caption,
    marginTop: 3,
  },
  sectionHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionLink: {
    color: colors.primary,
    fontSize: uiType.secondary,
    fontWeight: "800",
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  activityCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.large,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    ...shadows.card,
  },
  activityRow: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  activityCopy: { flex: 1, minWidth: 0 },
  activityTitle: {
    color: colors.textPrimary,
    fontSize: uiType.body,
    fontWeight: "700",
  },
  activityMeta: {
    color: colors.textMuted,
    fontSize: uiType.caption,
    marginTop: 3,
  },
  activityAmount: {
    maxWidth: "42%",
    fontSize: uiType.secondary,
    fontWeight: "800",
    textAlign: "right",
  },
  insightRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.xl },
  insightCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.large,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.card,
  },
  insightTitle: {
    color: colors.textPrimary,
    fontSize: uiType.body,
    fontWeight: "800",
    marginTop: spacing.md,
  },
  insightText: {
    color: colors.textSecondary,
    fontSize: uiType.caption,
    lineHeight: 16,
    marginTop: spacing.xs,
  },
});
