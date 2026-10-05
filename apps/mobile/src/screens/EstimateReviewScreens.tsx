import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Sharing from "expo-sharing";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScreenHeader } from "../components/ScreenHeader";
import { AppButton, AppCard, EmptyState, IconTile, ScreenContainer, SegmentedTabs, StatusBadge } from "../components/ui/FinanceUI";
import { DocumentPreviewCard } from "../components/ui/SalesDocumentUI";
import { ContactAction, InitialsAvatar } from "../components/ui/SalesSetupUI";
import { useEstimateFlow } from "../contexts/EstimateFlowContext";
import { useInvoiceFlow } from "../contexts/InvoiceFlowContext";
import { usePreferences } from "../contexts/PreferencesContext";
import { useSalesSetup } from "../contexts/SalesSetupContext";
import { calculateEstimateTotals, createAcceptedPreviewEstimate, estimateAsInvoiceDraft, type SavedEstimate } from "../features/estimates/model";
import { createInvoicePdf } from "../features/invoices/pdf";
import type { BusinessProfile, SalesCustomer } from "../features/sales/setupData";
import type { RootStackParamList } from "../navigation/types";
import { colors, radius, spacing, uiType } from "../theme/tokens";

type RootNav = NativeStackNavigationProp<RootStackParamList>;

async function shareEstimatePdf(estimate: SavedEstimate | ReturnType<typeof useEstimateFlow>["draft"], business: BusinessProfile, customer: SalesCustomer, currency: string) {
  if (!(await Sharing.isAvailableAsync())) throw new Error("Sharing is not available on this device.");
  const uri = createInvoicePdf(estimateAsInvoiceDraft(estimate), business, customer, currency, "ESTIMATE");
  await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: `Share ${estimate.estimateNumber}`, UTI: "com.adobe.pdf" });
}

export function EstimatePreviewScreen() {
  const navigation = useNavigation<RootNav>();
  const { draft, saveEstimate } = useEstimateFlow();
  const { customers, businessProfile } = useSalesSetup();
  const { currency, formatMoney, formatDate } = usePreferences();
  const [tab, setTab] = useState<"PDF Preview" | "Details">("PDF Preview");
  const customer = customers.find((item) => item.id === draft.customerId);
  const totals = calculateEstimateTotals(draft);

  async function share(markSent = false) {
    if (!customer) return;
    try {
      await shareEstimatePdf(draft, businessProfile, customer, currency);
      if (markSent) {
        const saved = saveEstimate("sent");
        if (saved) navigation.replace("EstimateDetail", { estimateNumber: saved.estimateNumber });
      }
    } catch (error) { Alert.alert("Could not share estimate", error instanceof Error ? error.message : "Please try again."); }
  }

  if (!customer || !draft.items.length) return <ScreenContainer><ScreenHeader title="Estimate Preview" back /><EmptyState icon="document-outline" title="Estimate is incomplete" description="Choose a customer and add at least one item before previewing." /></ScreenContainer>;

  return <ScreenContainer>
    <ScreenHeader title="Estimate Preview" back rightIcon="share-outline" onRightPress={() => void share()} />
    <ScrollView contentContainerStyle={styles.previewContent} showsVerticalScrollIndicator={false}>
      <SegmentedTabs options={["PDF Preview", "Details"] as const} value={tab} onChange={setTab} />
      {tab === "PDF Preview" ? <DocumentPreviewCard draft={estimateAsInvoiceDraft(draft)} business={businessProfile} customer={customer} currency={currency} formatMoney={formatMoney} formatDate={formatDate} label="ESTIMATE" /> : <AppCard style={styles.detailsCard}>
        <DetailLine label="Estimate" value={draft.estimateNumber} />
        <DetailLine label="Customer" value={customer.name} />
        <DetailLine label="Estimate date" value={formatDate(draft.estimateDate)} />
        <DetailLine label="Valid until" value={formatDate(draft.validUntil)} />
        <DetailLine label="Items" value={String(draft.items.length)} />
        <DetailLine label="Subtotal" value={formatMoney(totals.subtotal)} />
        <DetailLine label="Discount" value={`-${formatMoney(totals.discountAmount)}`} />
        <DetailLine label={draft.taxLabel} value={formatMoney(totals.taxAmount)} />
        <DetailLine label="Total" value={formatMoney(totals.total)} strong />
      </AppCard>}
      <View style={styles.previewActions}><AppButton label="Back" icon="arrow-back" variant="secondary" onPress={() => navigation.goBack()} style={{ flex: 0.7 }} /><AppButton label="Send Estimate" icon="paper-plane-outline" onPress={() => void share(true)} style={{ flex: 1.6 }} /></View>
    </ScrollView>
  </ScreenContainer>;
}

function DetailLine({ label, value, strong = false, badge }: { label: string; value: string; strong?: boolean; badge?: SavedEstimate["status"] }) {
  return <View style={styles.detailLine}><Text style={[styles.detailLabel, strong && styles.strong]}>{label}</Text>{badge ? <StatusBadge status={badge} /> : <Text style={[styles.detailValue, strong && styles.total]} numberOfLines={2}>{value}</Text>}</View>;
}

export function EstimateDetailScreen() {
  const navigation = useNavigation<RootNav>();
  const route = useRoute<RouteProp<RootStackParamList, "EstimateDetail">>();
  const { estimates, loadEstimate, duplicateEstimate, setEstimateStatus } = useEstimateFlow();
  const { convertToInvoice } = useInvoiceFlow();
  const { customers, businessProfile } = useSalesSetup();
  const { currency, formatMoney, formatDate } = usePreferences();
  const preview = route.params.estimateNumber === "EST-2026-001";
  const acme = customers.find((customer) => customer.id === "customer-acme") ?? customers[0];
  const estimate = useMemo(() => estimates.find((item) => item.estimateNumber === route.params.estimateNumber) ?? (preview && acme ? createAcceptedPreviewEstimate(acme.id) : null), [acme, estimates, preview, route.params.estimateNumber]);
  const customer = estimate ? customers.find((item) => item.id === estimate.customerId) : undefined;

  if (!estimate || !customer) return <ScreenContainer><ScreenHeader title="Estimate Detail" back /><EmptyState icon="document-outline" title="Estimate unavailable" description="This estimate is no longer available on this device." /></ScreenContainer>;

  function loadAndNavigate(target: "EstimateCreate" | "EstimatePreview") {
    if (preview || !loadEstimate(estimate!.estimateNumber)) { Alert.alert("Worksheet preview", "Create or save an estimate to edit and send it from this device."); return; }
    navigation.navigate(target);
  }

  function duplicate() {
    const number = duplicateEstimate(estimate!.estimateNumber);
    if (!number) { Alert.alert("Worksheet preview", "Preview rows cannot be duplicated. Create an estimate first."); return; }
    navigation.navigate("EstimateCreate");
  }

  function convert() {
    const invoiceDraft = estimateAsInvoiceDraft(estimate!);
    const invoice = convertToInvoice({
      customerId: invoiceDraft.customerId, items: invoiceDraft.items, discountType: invoiceDraft.discountType, discountValue: invoiceDraft.discountValue,
      taxRate: invoiceDraft.taxRate, taxLabel: invoiceDraft.taxLabel, shipping: 0, notes: invoiceDraft.notes, terms: invoiceDraft.terms,
      signatureEnabled: invoiceDraft.signatureEnabled, signatureText: invoiceDraft.signatureText, attachment: invoiceDraft.attachment,
    });
    if (!invoice) { Alert.alert("Could not convert estimate", "The customer for this estimate is unavailable."); return; }
    navigation.navigate("EstimateConvert", { estimateNumber: estimate!.estimateNumber, invoiceNumber: invoice.invoiceNumber });
  }

  function more() {
    const actions = preview ? [{ text: "Convert to Invoice", onPress: convert }] : [
      { text: "Mark Accepted", onPress: () => setEstimateStatus(estimate!.estimateNumber, "accepted") },
      { text: "Mark Expired", onPress: () => setEstimateStatus(estimate!.estimateNumber, "expired") },
      { text: "Convert to Invoice", onPress: convert },
    ];
    Alert.alert("Estimate actions", estimate!.estimateNumber, [...actions, { text: "Cancel", style: "cancel" }]);
  }

  async function pdf() {
    try { await shareEstimatePdf(estimate!, businessProfile, customer!, currency); }
    catch (error) { Alert.alert("Could not share PDF", error instanceof Error ? error.message : "Please try again."); }
  }

  return <ScreenContainer>
    <ScreenHeader title="Estimate Detail" back rightIcon="ellipsis-vertical" onRightPress={more} />
    <ScrollView contentContainerStyle={styles.detailContent} showsVerticalScrollIndicator={false}>
      {estimate.status === "accepted" ? <AppCard style={styles.acceptedBanner}><View style={styles.acceptedIcon}><Ionicons name="checkmark" size={23} color="#fff" /></View><View style={{ flex: 1 }}><Text style={styles.acceptedTitle}>Accepted</Text><Text style={styles.acceptedCopy}>This estimate was accepted on {formatDate((estimate.acceptedAt ?? estimate.updatedAt).slice(0, 10))}.</Text></View></AppCard> : null}
      <View style={styles.documentHero}><View style={{ flex: 1 }}><Text style={styles.documentNumber}>{estimate.estimateNumber}</Text><Text style={styles.documentCustomer}>{estimate.customerName}</Text><Text style={styles.documentDate}>{formatDate(estimate.estimateDate)} · Valid until {formatDate(estimate.validUntil)}</Text></View><Text style={styles.documentAmount}>{formatMoney(estimate.total)}</Text></View>
      <View style={styles.actions}><ContactAction icon="paper-plane-outline" label="Send" onPress={() => loadAndNavigate("EstimatePreview")} /><ContactAction icon="pencil-outline" label="Edit" onPress={() => loadAndNavigate("EstimateCreate")} /><ContactAction icon="copy-outline" label="Duplicate" onPress={duplicate} /><ContactAction icon="ellipsis-horizontal" label="More" onPress={more} /></View>
      <AppCard style={styles.customerSummary}><InitialsAvatar name={customer.name} size={40} /><View style={{ flex: 1 }}><Text style={styles.customerName}>{customer.name}</Text><Text style={styles.customerMeta}>{customer.email || customer.billingAddress}</Text></View><Ionicons name="chevron-forward" size={18} color={colors.gray400} /></AppCard>
      <AppCard style={styles.detailsCard}>
        <DetailLine label="Customer" value={customer.name} />
        <DetailLine label="Items" value={`${estimate.items.length} items`} />
        <DetailLine label="Total" value={formatMoney(estimate.total)} strong />
        <DetailLine label="Status" value={estimate.status} badge={estimate.status} />
        {estimate.acceptedAt ? <DetailLine label="Accepted On" value={formatDate(estimate.acceptedAt.slice(0, 10))} /> : null}
        <DetailLine label="Terms" value={estimate.terms} />
      </AppCard>
      <AppButton label="View Estimate PDF" icon="document-text-outline" variant="secondary" onPress={() => void pdf()} style={styles.pdfButton} />
      {estimate.status === "accepted" ? <AppButton label="Convert to Invoice" icon="swap-horizontal-outline" onPress={convert} style={styles.convertButton} /> : null}
    </ScrollView>
  </ScreenContainer>;
}

export function EstimateConvertScreen() {
  const navigation = useNavigation<RootNav>();
  const route = useRoute<RouteProp<RootStackParamList, "EstimateConvert">>();

  function backToEstimates() {
    navigation.popTo("Main", { screen: "Sales", params: { screen: "SalesEstimates" } } as never);
  }

  return <ScreenContainer>
    <ScrollView contentContainerStyle={styles.convertContent} showsVerticalScrollIndicator={false}>
      <View style={styles.confettiRow}><Text style={styles.confetti}>✦</Text><Text style={[styles.confetti, { color: colors.amber600 }]}>│</Text><Text style={[styles.confetti, { color: colors.blue600 }]}>✦</Text></View>
      <View style={styles.convertGraphic}>
        <View style={styles.documentIcon}><Text style={styles.docCode}>EST</Text></View>
        <Ionicons name="arrow-forward" size={38} color={colors.primary} />
        <View style={styles.documentIcon}><Text style={[styles.docCode, { color: colors.primary }]}>INV</Text></View>
        <View style={styles.checkBubble}><Ionicons name="checkmark" size={20} color="#fff" /></View>
      </View>
      <Text style={styles.convertTitle}>Invoice Created Successfully!</Text>
      <Text style={styles.convertCopy}>Estimate {route.params.estimateNumber} has been converted to invoice {route.params.invoiceNumber}.</Text>
      <AppButton label="View Invoice" onPress={() => navigation.replace("InvoicePreview")} style={styles.viewInvoice} />
      <AppButton label="Back to Estimates" variant="secondary" onPress={backToEstimates} />
    </ScrollView>
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  previewContent: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  previewActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },
  detailsCard: { paddingVertical: 0 },
  detailLine: { minHeight: 50, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider },
  detailLabel: { color: colors.gray600, fontSize: uiType.secondary },
  detailValue: { color: colors.textPrimary, fontSize: uiType.secondary, fontWeight: "700", flexShrink: 1, textAlign: "right" },
  strong: { fontWeight: "900", color: colors.textPrimary },
  total: { color: colors.primary, fontSize: uiType.sectionTitle },
  detailContent: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  acceptedBanner: { backgroundColor: "#effcf4", borderColor: "#cbeed8", flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.lg },
  acceptedIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.green600, alignItems: "center", justifyContent: "center" },
  acceptedTitle: { color: colors.green600, fontSize: uiType.body, fontWeight: "900" },
  acceptedCopy: { color: colors.gray600, fontSize: uiType.caption, marginTop: 3 },
  documentHero: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md, marginVertical: spacing.sm },
  documentNumber: { color: colors.textPrimary, fontSize: 19, fontWeight: "900" },
  documentCustomer: { color: colors.textPrimary, fontSize: uiType.body, fontWeight: "700", marginTop: spacing.sm },
  documentDate: { color: colors.gray500, fontSize: uiType.caption, marginTop: 4 },
  documentAmount: { color: colors.textPrimary, fontSize: uiType.sectionTitle, fontWeight: "900" },
  actions: { flexDirection: "row", gap: spacing.sm, marginVertical: spacing.xl },
  customerSummary: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.md },
  customerName: { color: colors.textPrimary, fontSize: uiType.secondary, fontWeight: "800" },
  customerMeta: { color: colors.gray500, fontSize: uiType.caption, marginTop: 3 },
  pdfButton: { marginTop: spacing.lg },
  convertButton: { marginTop: spacing.sm },
  convertContent: { flexGrow: 1, justifyContent: "center", padding: spacing.xl, paddingBottom: spacing.xxxl },
  confettiRow: { flexDirection: "row", justifyContent: "space-around", paddingHorizontal: spacing.xxl, marginBottom: spacing.lg },
  confetti: { color: colors.primary, fontSize: 24 },
  convertGraphic: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.md, marginBottom: spacing.xxl, position: "relative" },
  documentIcon: { width: 72, height: 88, borderRadius: radius.medium, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  docCode: { color: colors.gray500, fontSize: 22, fontWeight: "900" },
  checkBubble: { position: "absolute", right: "14%", top: -12, width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  convertTitle: { color: colors.textPrimary, fontSize: 24, lineHeight: 30, fontWeight: "900", textAlign: "center" },
  convertCopy: { color: colors.gray600, fontSize: uiType.body, lineHeight: 21, textAlign: "center", marginTop: spacing.md, marginBottom: spacing.xxl },
  viewInvoice: { marginBottom: spacing.sm },
});
