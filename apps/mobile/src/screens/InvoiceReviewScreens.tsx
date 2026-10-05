import { useMemo, useState } from "react";
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Sharing from "expo-sharing";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScreenHeader } from "../components/ScreenHeader";
import { AppButton, AppCard, EmptyState, ScreenContainer, SegmentedTabs } from "../components/ui/FinanceUI";
import { DocumentPreviewCard, DocumentProgress, SendOptionRow } from "../components/ui/SalesDocumentUI";
import { useInvoiceFlow } from "../contexts/InvoiceFlowContext";
import { usePreferences } from "../contexts/PreferencesContext";
import { useSalesSetup } from "../contexts/SalesSetupContext";
import { calculateInvoiceTotals, type InvoiceDraft } from "../features/invoices/model";
import { createInvoicePdf, invoiceShareSummary } from "../features/invoices/pdf";
import type { BusinessProfile, SalesCustomer } from "../features/sales/setupData";
import type { RootStackParamList } from "../navigation/types";
import { colors, spacing, uiType } from "../theme/tokens";

type RootNav = NativeStackNavigationProp<RootStackParamList>;

async function sharePdf(draft: InvoiceDraft, business: BusinessProfile, customer: SalesCustomer, currency: string) {
  const available = await Sharing.isAvailableAsync();
  if (!available) throw new Error("Sharing is not available on this device.");
  const uri = createInvoicePdf(draft, business, customer, currency);
  await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: `Share ${draft.invoiceNumber}`, UTI: "com.adobe.pdf" });
}

export function InvoicePreviewScreen() {
  const navigation = useNavigation<RootNav>();
  const { draft } = useInvoiceFlow();
  const { customers, businessProfile } = useSalesSetup();
  const { currency, formatMoney, formatDate } = usePreferences();
  const [tab, setTab] = useState<"PDF Preview" | "Details">("PDF Preview");
  const customer = customers.find((item) => item.id === draft.customerId);
  const totals = calculateInvoiceTotals(draft);

  async function onShare() {
    if (!customer) return;
    try { await sharePdf(draft, businessProfile, customer, currency); }
    catch (error) { Alert.alert("Could not share PDF", error instanceof Error ? error.message : "Please try again."); }
  }

  if (!customer || !draft.items.length) return <ScreenContainer><ScreenHeader title="Invoice Preview" back /><EmptyState icon="document-text-outline" title="Invoice is incomplete" description="Choose a customer and add at least one item before previewing." /></ScreenContainer>;

  return <ScreenContainer>
    <ScreenHeader title="Invoice Preview" back rightIcon="share-outline" onRightPress={() => void onShare()} />
    <DocumentProgress active={4} />
    <ScrollView contentContainerStyle={styles.previewContent} showsVerticalScrollIndicator={false}>
      <SegmentedTabs options={["PDF Preview", "Details"] as const} value={tab} onChange={setTab} />
      {tab === "PDF Preview" ? <DocumentPreviewCard draft={draft} business={businessProfile} customer={customer} currency={currency} formatMoney={formatMoney} formatDate={formatDate} /> : <AppCard style={styles.detailsCard}>
        <DetailLine label="Invoice" value={draft.invoiceNumber} />
        <DetailLine label="Customer" value={customer.name} />
        <DetailLine label="Issue date" value={formatDate(draft.issueDate)} />
        <DetailLine label="Due date" value={formatDate(draft.dueDate)} />
        <DetailLine label="Items" value={String(draft.items.length)} />
        <DetailLine label="Subtotal" value={formatMoney(totals.subtotal)} />
        <DetailLine label="Discount" value={`-${formatMoney(totals.discountAmount)}`} />
        <DetailLine label={draft.taxLabel} value={formatMoney(totals.taxAmount)} />
        <DetailLine label="Total" value={formatMoney(totals.total)} strong />
        {draft.attachment ? <DetailLine label="Attachment" value={draft.attachment.name} /> : null}
      </AppCard>}
      <AppButton label="Continue to Send" icon="paper-plane-outline" onPress={() => navigation.navigate("InvoiceSend")} style={styles.continueButton} />
    </ScrollView>
  </ScreenContainer>;
}

function DetailLine({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <View style={styles.detailLine}><Text style={[styles.detailLabel, strong && styles.strong]}>{label}</Text><Text style={[styles.detailValue, strong && styles.total]}>{value}</Text></View>;
}

export function InvoiceSendScreen() {
  const navigation = useNavigation<RootNav>();
  const { draft, invoices, saveDraft } = useInvoiceFlow();
  const { customers, businessProfile } = useSalesSetup();
  const { currency } = usePreferences();
  const customer = customers.find((item) => item.id === draft.customerId);
  const alreadySent = useMemo(() => invoices.some((item) => item.invoiceNumber === draft.invoiceNumber && item.status === "sent"), [draft.invoiceNumber, invoices]);
  const [sent, setSent] = useState(alreadySent);

  if (!customer) return <ScreenContainer><ScreenHeader title="Send Invoice" back /><EmptyState icon="person-outline" title="Customer missing" description="Return to the invoice and select a customer." /></ScreenContainer>;
  const sendCustomer = customer;
  const summary = invoiceShareSummary(draft, sendCustomer, currency);

  async function openUrl(url: string, title: string) {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) throw new Error();
      await Linking.openURL(url);
    } catch { Alert.alert(`${title} unavailable`, `No compatible ${title.toLowerCase()} app is available on this device.`); }
  }

  async function onSharePdf() {
    try { await sharePdf(draft, businessProfile, sendCustomer, currency); }
    catch (error) { Alert.alert("Could not share PDF", error instanceof Error ? error.message : "Please try again."); }
  }

  function markSent() {
    const saved = saveDraft("sent");
    if (!saved) { Alert.alert("Invoice incomplete", "Choose a customer before marking this invoice sent."); return; }
    setSent(true);
  }

  function backToInvoices() {
    navigation.popTo("Main", { screen: "Sales", params: { screen: "SalesInvoices" } } as never);
  }

  return <ScreenContainer>
    <ScrollView contentContainerStyle={styles.sendContent} showsVerticalScrollIndicator={false}>
      <View style={styles.sendHero}><View style={styles.planeHalo}><Ionicons name="paper-plane" size={48} color={colors.primary} /></View><Text style={styles.readyTitle}>{sent ? "Invoice Sent" : "Invoice Ready to Send"}</Text><Text style={styles.readyCopy}>Your invoice <Text style={styles.strong}>{draft.invoiceNumber}</Text>{sent ? " is marked as sent." : " is ready to share."}</Text></View>
      <View style={styles.options}>
        <SendOptionRow icon="mail-outline" tone="blue" title="Send by Email" subtitle="Compose and send via email" onPress={() => void openUrl(`mailto:${sendCustomer.email}?subject=${encodeURIComponent(`Invoice ${draft.invoiceNumber}`)}&body=${encodeURIComponent(summary)}`, "Email")} />
        <SendOptionRow icon="document-text-outline" tone="rose" title="Share PDF" subtitle="Share or save the PDF file" onPress={() => void onSharePdf()} />
        <SendOptionRow icon="link-outline" tone="blue" title="Copy Link" subtitle="Requires a hosted secure invoice link" onPress={() => { void Clipboard.setStringAsync(draft.invoiceNumber); Alert.alert("Invoice reference copied", "A secure online invoice link needs backend hosting. The invoice number was copied instead."); }} />
        <SendOptionRow icon="logo-whatsapp" tone="green" title="Send via WhatsApp" subtitle="Share invoice details on WhatsApp" onPress={() => void openUrl(`https://wa.me/?text=${encodeURIComponent(summary)}`, "WhatsApp")} />
      </View>
      <AppButton label={sent ? "Invoice Sent!" : "Mark Invoice Sent"} icon="checkmark" onPress={sent ? backToInvoices : markSent} style={styles.sentButton} />
      <Pressable onPress={backToInvoices} style={styles.backLink} accessibilityRole="button"><Text style={styles.backLinkText}>Back to Invoices</Text></Pressable>
    </ScrollView>
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  previewContent: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  detailsCard: { paddingVertical: 0 },
  detailLine: { minHeight: 50, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider },
  detailLabel: { color: colors.gray600, fontSize: uiType.secondary },
  detailValue: { color: colors.textPrimary, fontSize: uiType.secondary, fontWeight: "700", flexShrink: 1, textAlign: "right" },
  strong: { fontWeight: "900", color: colors.textPrimary },
  total: { color: colors.primary, fontSize: uiType.sectionTitle },
  continueButton: { marginTop: spacing.lg },
  sendContent: { padding: spacing.lg, paddingTop: 70, paddingBottom: spacing.xxxl },
  sendHero: { alignItems: "center", marginBottom: spacing.xxl },
  planeHalo: { width: 112, height: 112, borderRadius: 56, backgroundColor: colors.mintSoft, alignItems: "center", justifyContent: "center", marginBottom: spacing.lg, borderWidth: 8, borderColor: "#effcf8" },
  readyTitle: { color: colors.textPrimary, fontSize: 22, fontWeight: "900", textAlign: "center" },
  readyCopy: { color: colors.gray600, fontSize: uiType.body, textAlign: "center", lineHeight: 20, marginTop: spacing.sm },
  options: { marginTop: spacing.md },
  sentButton: { marginTop: spacing.lg },
  backLink: { minHeight: 48, alignItems: "center", justifyContent: "center" },
  backLinkText: { color: colors.primary, fontSize: uiType.body, fontWeight: "800" },
});
