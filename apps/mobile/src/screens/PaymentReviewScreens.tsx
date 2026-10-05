import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Sharing from "expo-sharing";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScreenHeader } from "../components/ScreenHeader";
import { AppButton, AppCard, EmptyState, ScreenContainer, SectionHeader, StatusBadge } from "../components/ui/FinanceUI";
import { PaymentSuccessIcon, ReceiptPreviewCard } from "../components/ui/PaymentUI";
import { SendOptionRow } from "../components/ui/SalesDocumentUI";
import { InitialsAvatar } from "../components/ui/SalesSetupUI";
import { usePaymentFlow } from "../contexts/PaymentFlowContext";
import { usePreferences } from "../contexts/PreferencesContext";
import { useSalesSetup } from "../contexts/SalesSetupContext";
import { createReceiptImage, createReceiptPdf } from "../features/payments/receiptFiles";
import type { SavedPayment } from "../features/payments/model";
import type { RootStackParamList } from "../navigation/types";
import { colors, radius, spacing, uiType } from "../theme/tokens";

type RootNav = NativeStackNavigationProp<RootStackParamList>;

function backToPayments(navigation: RootNav) {
  navigation.popTo("Main", { screen: "Sales", params: { screen: "SalesPayments" } } as never);
}

export function PaymentInvoiceDetailScreen() {
  const navigation = useNavigation<RootNav>();
  const route = useRoute<RouteProp<RootStackParamList, "PaymentInvoiceDetail">>();
  const { paymentInvoices, payments, startNewPayment } = usePaymentFlow();
  const { formatMoney, formatDate } = usePreferences();
  const invoice = paymentInvoices.find((item) => item.invoiceNumber === route.params.invoiceNumber);
  const history = payments.filter((item) => item.invoiceNumber === route.params.invoiceNumber && item.status !== "refunded");

  if (!invoice) return <ScreenContainer><ScreenHeader title="Invoice Details" back /><EmptyState icon="document-text-outline" title="Invoice unavailable" description="This invoice is no longer available for payment." /></ScreenContainer>;
  const paid = Math.min(invoice.total, invoice.amountPaid);
  const balance = Math.max(0, invoice.total - paid);
  const percent = invoice.total > 0 ? Math.min(100, paid / invoice.total * 100) : 0;

  function record() { startNewPayment(invoice!.invoiceNumber); navigation.navigate("PaymentCreate"); }
  async function reminder() {
    if (!invoice!.customerEmail) { Alert.alert("No customer email", "Add an email address to this customer before sending a reminder."); return; }
    const url = `mailto:${invoice!.customerEmail}?subject=${encodeURIComponent(`Payment reminder for ${invoice!.invoiceNumber}`)}&body=${encodeURIComponent(`A balance of ${formatMoney(balance)} remains due for ${invoice!.invoiceNumber}.`)}`;
    try { await Linking.openURL(url); } catch { Alert.alert("Email unavailable", "No compatible email app is available."); }
  }

  return <ScreenContainer>
    <ScreenHeader title="Invoice Details" back rightIcon="ellipsis-vertical" onRightPress={() => Alert.alert("Invoice actions", invoice.invoiceNumber, [{ text: "Record Payment", onPress: record }, { text: "Send Reminder", onPress: () => void reminder() }, { text: "Cancel", style: "cancel" }])} />
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <AppCard style={styles.invoiceCard}>
        <View style={styles.invoiceHead}><View><StatusBadge status={balance === 0 ? "paid" : paid > 0 ? "partially_paid" : invoice.status === "overdue" ? "overdue" : "sent"} /><Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text></View><Text style={styles.issueDate}>{formatDate(invoice.issueDate)}</Text></View>
        <View style={styles.customerRow}><InitialsAvatar name={invoice.customerName} size={42} /><View style={{ flex: 1 }}><Text style={styles.customerName}>{invoice.customerName}</Text><Text style={styles.meta}>{invoice.customerEmail || "Customer invoice"}</Text></View><Ionicons name="chevron-forward" size={18} color={colors.gray400} /></View>
        <SummaryLine label="Subtotal" value={formatMoney(invoice.subtotal)} />
        <SummaryLine label="Tax" value={formatMoney(invoice.taxAmount)} />
        <SummaryLine label="Total" value={formatMoney(invoice.total)} strong />
      </AppCard>
      <View style={styles.balanceCards}><AppCard style={styles.paidCard}><Text style={styles.meta}>Amount Paid</Text><Text style={styles.paidAmount}>{formatMoney(paid)}</Text><Text style={styles.meta}>{history.length} {history.length === 1 ? "payment" : "payments"}</Text></AppCard><AppCard style={styles.dueCard}><Text style={styles.meta}>Balance Due</Text><Text style={styles.dueAmount}>{formatMoney(balance)}</Text><Text style={styles.meta}>Due {formatDate(invoice.dueDate)}</Text></AppCard></View>
      <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${percent}%` }]} /></View><View style={styles.progressLabels}><Text style={styles.progressText}>{Math.round(percent)}% paid</Text><Text style={styles.progressText}>{Math.round(100 - percent)}% remaining</Text></View>
      <SectionHeader title="Payment History" actionLabel="See all" onAction={() => backToPayments(navigation)} />
      {history.length ? <AppCard style={styles.historyCard}>{history.map((payment, index) => <Pressable key={payment.id} onPress={() => navigation.navigate("ReceiptPreview", { paymentId: payment.id })} style={[styles.historyRow, index < history.length - 1 && styles.divider]}><View style={styles.historyDot} /><View style={{ flex: 1 }}><Text style={styles.customerName}>{formatDate(payment.paymentDate)}</Text><Text style={styles.meta}>{payment.method} · {payment.reference}</Text></View><Text style={styles.historyAmount}>{formatMoney(payment.amount)}</Text></Pressable>)}</AppCard> : <AppCard><Text style={styles.emptyHistory}>No payments have been recorded for this invoice.</Text></AppCard>}
      <AppButton label="Record Payment" onPress={record} disabled={balance <= 0} style={styles.primaryAction} />
      <AppButton label="Send Reminder" variant="secondary" onPress={() => void reminder()} disabled={balance <= 0} style={styles.secondaryAction} />
    </ScrollView>
  </ScreenContainer>;
}

function SummaryLine({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <View style={styles.summaryLine}><Text style={[styles.summaryLabel, strong && styles.strong]}>{label}</Text><Text style={[styles.summaryValue, strong && styles.strong]}>{value}</Text></View>;
}

export function PaymentConfirmationScreen() {
  const navigation = useNavigation<RootNav>();
  const route = useRoute<RouteProp<RootStackParamList, "PaymentConfirmation">>();
  const { findPayment } = usePaymentFlow();
  const { formatMoney, formatDate } = usePreferences();
  const payment = findPayment(route.params.paymentId);
  if (!payment) return <ScreenContainer><ScreenHeader title="Payment" back /><EmptyState icon="checkmark-circle-outline" title="Payment unavailable" description="Return to Payments to review saved records." /></ScreenContainer>;
  return <ScreenContainer>
    <ScreenHeader title="" rightIcon="close" onRightPress={() => backToPayments(navigation)} />
    <ScrollView contentContainerStyle={styles.confirmContent} showsVerticalScrollIndicator={false}>
      <PaymentSuccessIcon />
      <Text style={styles.confirmTitle}>Payment Recorded!</Text>
      <Text style={styles.confirmCopy}>Payment of <Text style={styles.strong}>{formatMoney(payment.amount)}</Text> has been successfully recorded for <Text style={styles.strong}>{payment.invoiceNumber}</Text>.</Text>
      <AppCard style={styles.confirmCard}>
        <View style={styles.confirmCustomer}><InitialsAvatar name={payment.customerName} size={39} /><View><Text style={styles.meta}>Customer</Text><Text style={styles.customerName}>{payment.customerName}</Text></View></View>
        <SummaryLine label="Amount Received" value={formatMoney(payment.amount)} />
        <SummaryLine label="Payment Method" value={payment.method} />
        <SummaryLine label="Date" value={formatDate(payment.paymentDate)} />
        <SummaryLine label="Reference" value={payment.reference} />
      </AppCard>
      <AppButton label="Generate Receipt" icon="receipt-outline" onPress={() => navigation.navigate("ReceiptPreview", { paymentId: payment.id })} style={styles.generateButton} />
      <AppButton label="Maybe Later" variant="secondary" onPress={() => backToPayments(navigation)} />
    </ScrollView>
  </ScreenContainer>;
}

function useSavedPayment(routeName: "ReceiptPreview" | "ReceiptShare") {
  const route = useRoute<RouteProp<RootStackParamList, typeof routeName>>();
  const { findPayment } = usePaymentFlow();
  return findPayment(route.params.paymentId);
}

export function ReceiptPreviewScreen() {
  const navigation = useNavigation<RootNav>();
  const payment = useSavedPayment("ReceiptPreview");
  const { businessProfile } = useSalesSetup();
  const { formatMoney, formatDate } = usePreferences();
  if (!payment) return <ScreenContainer><ScreenHeader title="Receipt Preview" back /><EmptyState icon="receipt-outline" title="Receipt unavailable" description="The payment record could not be found." /></ScreenContainer>;
  return <ScreenContainer>
    <ScreenHeader title="Receipt Preview" back rightLabel="Share" onRightPress={() => navigation.navigate("ReceiptShare", { paymentId: payment.id })} />
    <ScrollView contentContainerStyle={styles.receiptContent} showsVerticalScrollIndicator={false}><ReceiptPreviewCard payment={payment} business={businessProfile} formatMoney={formatMoney} formatDate={formatDate} /></ScrollView>
  </ScreenContainer>;
}

async function shareFile(payment: SavedPayment, type: "pdf" | "image", business: ReturnType<typeof useSalesSetup>["businessProfile"], currency: string, title?: string) {
  if (!(await Sharing.isAvailableAsync())) throw new Error("Sharing is not available on this device.");
  const uri = type === "pdf" ? createReceiptPdf(payment, business, currency) : createReceiptImage(payment, business, currency);
  await Sharing.shareAsync(uri, { mimeType: type === "pdf" ? "application/pdf" : "image/svg+xml", dialogTitle: title ?? `Share ${payment.receiptNumber}`, ...(type === "pdf" ? { UTI: "com.adobe.pdf" } : {}) });
}

export function ReceiptShareScreen() {
  const navigation = useNavigation<RootNav>();
  const payment = useSavedPayment("ReceiptShare");
  const { businessProfile } = useSalesSetup();
  const { currency, formatMoney, formatDate } = usePreferences();
  if (!payment) return <ScreenContainer><ScreenHeader title="Share Receipt" back /><EmptyState icon="receipt-outline" title="Receipt unavailable" description="The payment record could not be found." /></ScreenContainer>;

  async function share(type: "pdf" | "image", title?: string) {
    try { await shareFile(payment!, type, businessProfile, currency, title); }
    catch (error) { Alert.alert("Could not share receipt", error instanceof Error ? error.message : "Please try again."); }
  }
  function message() {
    const summary = `${payment!.receiptNumber}\nPayment received from ${payment!.customerName}: ${formatMoney(payment!.amount)}\nInvoice: ${payment!.invoiceNumber}\nReference: ${payment!.reference}`;
    Alert.alert("Send via message", "Choose an app", [
      { text: "SMS", onPress: () => void Linking.openURL(`sms:?body=${encodeURIComponent(summary)}`) },
      { text: "Email", onPress: () => void Linking.openURL(`mailto:${payment!.customerEmail}?subject=${encodeURIComponent(`Receipt ${payment!.receiptNumber}`)}&body=${encodeURIComponent(summary)}`) },
      { text: "WhatsApp", onPress: () => void Linking.openURL(`https://wa.me/?text=${encodeURIComponent(summary)}`) },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  return <ScreenContainer>
    <ScreenHeader title="Share Receipt" back />
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <AppCard style={styles.shareSummary}><View style={styles.thumbnail}><Ionicons name="receipt-outline" size={42} color={colors.primary} /><Text style={styles.thumbnailText}>{payment.receiptNumber}</Text></View><View style={{ flex: 1 }}><View style={styles.readyRow}><Ionicons name="checkmark-circle" size={25} color={colors.success} /><Text style={styles.readyText}>Receipt ready to share</Text></View><Text style={styles.shareReceipt}>{payment.receiptNumber} · {formatMoney(payment.amount)}</Text><Text style={styles.meta}>{payment.customerName} · {payment.invoiceNumber}</Text><Text style={styles.meta}>{formatDate(payment.paymentDate)}</Text></View></AppCard>
      <View style={styles.shareOptions}>
        <SendOptionRow icon="image-outline" tone="blue" title="Share as Image" subtitle="Send via any compatible app" onPress={() => void share("image")} />
        <SendOptionRow icon="document-text-outline" tone="rose" title="Share as PDF" subtitle="High quality document" onPress={() => void share("pdf")} />
        <SendOptionRow icon="print-outline" tone="blue" title="Print Receipt" subtitle="Use printer or save as PDF" onPress={() => void share("pdf", "Print or save receipt")} />
        <SendOptionRow icon="paper-plane-outline" tone="mint" title="Send via Message" subtitle="WhatsApp, SMS, or email" onPress={message} />
      </View>
      <AppButton label="View Receipt" icon="eye-outline" variant="secondary" onPress={() => navigation.replace("ReceiptPreview", { paymentId: payment.id })} />
    </ScrollView>
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  invoiceCard: { paddingVertical: spacing.sm },
  invoiceHead: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", paddingBottom: spacing.md },
  invoiceNumber: { color: colors.textPrimary, fontSize: uiType.body, fontWeight: "900", marginTop: spacing.sm },
  issueDate: { color: colors.gray500, fontSize: uiType.caption },
  customerRow: { minHeight: 70, flexDirection: "row", alignItems: "center", gap: spacing.sm, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.divider, marginBottom: spacing.sm },
  customerName: { color: colors.textPrimary, fontSize: uiType.secondary, fontWeight: "800" },
  meta: { color: colors.gray500, fontSize: uiType.caption, marginTop: 3 },
  summaryLine: { minHeight: 38, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md },
  summaryLabel: { color: colors.gray600, fontSize: uiType.secondary },
  summaryValue: { color: colors.textPrimary, fontSize: uiType.secondary, fontWeight: "700", textAlign: "right" },
  strong: { color: colors.textPrimary, fontWeight: "900" },
  balanceCards: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  paidCard: { flex: 1, backgroundColor: "#effcf7", borderColor: "#d2f0e5" },
  dueCard: { flex: 1, backgroundColor: "#fff4f7", borderColor: "#f7dbe4" },
  paidAmount: { color: colors.success, fontSize: 20, fontWeight: "900", marginTop: spacing.sm },
  dueAmount: { color: colors.danger, fontSize: 20, fontWeight: "900", marginTop: spacing.sm },
  progressTrack: { height: 12, backgroundColor: colors.gray200, borderRadius: radius.pill, overflow: "hidden", marginTop: spacing.md },
  progressFill: { height: "100%", backgroundColor: colors.primary },
  progressLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.xs, marginBottom: spacing.xl },
  progressText: { color: colors.gray600, fontSize: uiType.caption, fontWeight: "700" },
  historyCard: { paddingVertical: 0 },
  historyRow: { minHeight: 59, flexDirection: "row", alignItems: "center", gap: spacing.sm },
  historyDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.success },
  historyAmount: { color: colors.textPrimary, fontSize: uiType.secondary, fontWeight: "900" },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  emptyHistory: { color: colors.gray500, fontSize: uiType.secondary, textAlign: "center" },
  primaryAction: { marginTop: spacing.lg },
  secondaryAction: { marginTop: spacing.sm },
  confirmContent: { flexGrow: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, paddingBottom: spacing.xxxl },
  confirmTitle: { color: colors.textPrimary, fontSize: 24, fontWeight: "900", marginTop: spacing.xl },
  confirmCopy: { color: colors.gray600, fontSize: uiType.body, lineHeight: 21, textAlign: "center", marginTop: spacing.sm, maxWidth: 330 },
  confirmCard: { width: "100%", marginTop: spacing.xxl, paddingVertical: spacing.sm },
  confirmCustomer: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.divider },
  generateButton: { width: "100%", marginTop: spacing.xl, marginBottom: spacing.sm },
  receiptContent: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  shareSummary: { flexDirection: "row", alignItems: "center", gap: spacing.md, minHeight: 155 },
  thumbnail: { width: 92, height: 116, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", gap: spacing.sm },
  thumbnailText: { color: colors.gray600, fontSize: 8, fontWeight: "800" },
  readyRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  readyText: { color: colors.success, fontSize: uiType.secondary, fontWeight: "800", flex: 1 },
  shareReceipt: { color: colors.textPrimary, fontSize: uiType.secondary, fontWeight: "900", marginTop: spacing.md },
  shareOptions: { marginTop: spacing.lg },
});
