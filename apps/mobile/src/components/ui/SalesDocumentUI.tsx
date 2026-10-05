import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import type { BusinessProfile, SalesCustomer } from "../../features/sales/setupData";
import { calculateInvoiceTotals, type InvoiceDraft } from "../../features/invoices/model";
import { colors, radius, spacing, uiType } from "../../theme/tokens";

type IconName = ComponentProps<typeof Ionicons>["name"];

const defaultSteps = ["Basic Info", "Items", "Details", "Review"] as const;

export function DocumentProgress({ active, labels = defaultSteps }: { active: 1 | 2 | 3 | 4; labels?: readonly [string, string, string, string] }) {
  return <View style={styles.progress}>
    {labels.map((label, index) => <View key={label} style={styles.stepWrap}>
      <View style={styles.stepLineRow}>{index > 0 ? <View style={[styles.connector, index < active && styles.connectorActive]} /> : <View style={styles.connectorSpacer} />}<View style={[styles.stepCircle, index + 1 <= active && styles.stepCircleActive]}><Text style={[styles.stepNumber, index + 1 <= active && styles.stepNumberActive]}>{index + 1}</Text></View>{index < labels.length - 1 ? <View style={[styles.connector, index + 1 < active && styles.connectorActive]} /> : <View style={styles.connectorSpacer} />}</View>
      <Text style={[styles.stepLabel, index + 1 === active && styles.stepLabelActive]} numberOfLines={1}>{label}</Text>
    </View>)}
  </View>;
}

export function DocumentPreviewCard({ draft, business, customer, currency, formatMoney, formatDate, label = "INVOICE" }: {
  draft: InvoiceDraft;
  business: BusinessProfile;
  customer: SalesCustomer;
  currency: string;
  formatMoney: (amount: number) => string;
  formatDate: (date: string) => string;
  label?: "INVOICE" | "ESTIMATE";
}) {
  const totals = calculateInvoiceTotals(draft);
  return <View style={styles.paper}>
    <View style={styles.paperHeader}>
      <View style={styles.brandRow}>{business.logoUri ? <Image source={{ uri: business.logoUri }} style={styles.logo} /> : <View style={styles.brandMark}><Ionicons name="leaf-outline" size={18} color="#fff" /></View>}<View><Text style={styles.businessName}>{business.businessName || "Receipt Cycle"}</Text><Text style={styles.micro}>Track · Invoice · Grow</Text></View></View>
      <View style={styles.invoiceMeta}><Text style={styles.invoiceWord}>{label}</Text><Text style={styles.micro}>{label === "INVOICE" ? "Invoice" : "Estimate"} #: {draft.invoiceNumber}</Text><Text style={styles.micro}>Issue: {formatDate(draft.issueDate)}</Text><Text style={styles.micro}>{label === "INVOICE" ? "Due" : "Valid until"}: {formatDate(draft.dueDate)}</Text></View>
    </View>
    <View style={styles.billTo}><Text style={styles.miniHeading}>BILL TO</Text><Text style={styles.customerName}>{customer.name}</Text>{customer.businessName && customer.businessName !== customer.name ? <Text style={styles.micro}>{customer.businessName}</Text> : null}<Text style={styles.address}>{customer.billingAddress || customer.email || "No billing address"}</Text></View>
    <View style={styles.tableHead}><Text style={[styles.tableHeadText, { flex: 1 }]}>Description</Text><Text style={styles.qty}>Qty</Text><Text style={styles.rate}>Rate</Text><Text style={styles.amount}>Amount</Text></View>
    {draft.items.map((item) => <View key={item.id} style={styles.previewItem}><View style={{ flex: 1 }}><Text style={styles.itemName}>{item.name}</Text>{item.description ? <Text style={styles.itemDescription} numberOfLines={2}>{item.description}</Text> : null}</View><Text style={styles.qty}>{item.quantity}</Text><Text style={styles.rate}>{currency} {item.rate.toFixed(2)}</Text><Text style={styles.amount}>{formatMoney(item.quantity * item.rate)}</Text></View>)}
    <View style={styles.totalArea}>
      <SummaryLine label="Subtotal" value={formatMoney(totals.subtotal)} />
      {totals.discountAmount > 0 ? <SummaryLine label={`Discount${draft.discountType === "percentage" ? ` (${draft.discountValue}%)` : ""}`} value={`-${formatMoney(totals.discountAmount)}`} /> : null}
      {draft.taxRate > 0 ? <SummaryLine label={`${draft.taxLabel} (${draft.taxRate}%)`} value={formatMoney(totals.taxAmount)} /> : null}
      {draft.shipping > 0 ? <SummaryLine label="Shipping" value={formatMoney(draft.shipping)} /> : null}
      <View style={styles.grandTotal}><Text style={styles.grandLabel}>Total</Text><Text style={styles.grandValue}>{formatMoney(totals.total)}</Text></View>
    </View>
    {draft.notes ? <Text style={styles.thanks}>{draft.notes}</Text> : null}
    <View style={styles.paperFooter}><Ionicons name="leaf-outline" size={33} color="#b9efe2" /><Text style={styles.footerText}>A BRIGHTER TOMORROW{`\n`}TOGETHER</Text></View>
  </View>;
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return <View style={styles.summaryLine}><Text style={styles.summaryLabel}>{label}</Text><Text style={styles.summaryValue}>{value}</Text></View>;
}

export function SendOptionRow({ icon, tone, title, subtitle, onPress }: { icon: IconName; tone: "blue" | "rose" | "mint" | "green"; title: string; subtitle: string; onPress: () => void }) {
  const palette = tone === "rose" ? [colors.roseSoft, colors.rose600] : tone === "mint" || tone === "green" ? [colors.mintSoft, colors.success] : [colors.blueSoft, colors.blue600];
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.sendRow, pressed && { opacity: 0.72 }]} accessibilityRole="button" accessibilityLabel={title}><View style={[styles.sendIcon, { backgroundColor: palette[0] }]}><Ionicons name={icon} size={20} color={palette[1]} /></View><View style={styles.sendCopy}><Text style={styles.sendTitle}>{title}</Text><Text style={styles.sendSubtitle}>{subtitle}</Text></View><Ionicons name="chevron-forward" size={18} color={colors.gray400} /></Pressable>;
}

const styles = StyleSheet.create({
  progress: { flexDirection: "row", paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md, backgroundColor: colors.surface },
  stepWrap: { flex: 1, alignItems: "center", minWidth: 0 },
  stepLineRow: { flexDirection: "row", alignItems: "center", width: "100%" },
  connector: { flex: 1, height: 2, backgroundColor: colors.gray200 },
  connectorActive: { backgroundColor: "#88d8ca" },
  connectorSpacer: { flex: 1 },
  stepCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.gray100, alignItems: "center", justifyContent: "center" },
  stepCircleActive: { backgroundColor: colors.primary },
  stepNumber: { color: colors.gray500, fontSize: uiType.secondary, fontWeight: "800" },
  stepNumberActive: { color: "#fff" },
  stepLabel: { color: colors.gray500, fontSize: 9, marginTop: 4 },
  stepLabelActive: { color: colors.primary, fontWeight: "800" },
  paper: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.large, padding: spacing.md, minHeight: 510 },
  paperHeader: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md },
  brandRow: { flexDirection: "row", gap: spacing.sm, alignItems: "center", flex: 1 },
  brandMark: { width: 30, height: 30, borderRadius: radius.small, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  logo: { width: 30, height: 30, borderRadius: radius.small },
  businessName: { color: colors.textPrimary, fontSize: uiType.secondary, fontWeight: "800" },
  micro: { color: colors.gray500, fontSize: 8, marginTop: 2 },
  invoiceMeta: { alignItems: "flex-end" },
  invoiceWord: { color: colors.textPrimary, fontSize: uiType.body, fontWeight: "900", marginBottom: 3 },
  billTo: { marginTop: spacing.xl, marginBottom: spacing.lg },
  miniHeading: { color: colors.gray700, fontSize: 8, fontWeight: "900" },
  customerName: { color: colors.textPrimary, fontSize: uiType.secondary, fontWeight: "800", marginTop: 3 },
  address: { color: colors.gray600, fontSize: 8, lineHeight: 11, marginTop: 2 },
  tableHead: { minHeight: 28, backgroundColor: colors.blueSoft, flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.xs },
  tableHeadText: { color: colors.gray700, fontSize: 8, fontWeight: "800" },
  previewItem: { flexDirection: "row", gap: 3, paddingHorizontal: spacing.xs, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.divider },
  itemName: { color: colors.textPrimary, fontSize: 8, fontWeight: "700" },
  itemDescription: { color: colors.gray500, fontSize: 7, lineHeight: 10, marginTop: 2 },
  qty: { width: 27, color: colors.gray700, fontSize: 8, textAlign: "center" },
  rate: { width: 54, color: colors.gray700, fontSize: 8, textAlign: "right" },
  amount: { width: 62, color: colors.textPrimary, fontSize: 8, fontWeight: "700", textAlign: "right" },
  totalArea: { alignSelf: "flex-end", width: "60%", marginTop: spacing.md },
  summaryLine: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  summaryLabel: { color: colors.gray600, fontSize: 8 },
  summaryValue: { color: colors.textPrimary, fontSize: 8 },
  grandTotal: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: colors.gray200, marginTop: 3, paddingTop: 6 },
  grandLabel: { color: colors.textPrimary, fontSize: uiType.secondary, fontWeight: "900" },
  grandValue: { color: colors.primary, fontSize: uiType.body, fontWeight: "900" },
  thanks: { color: colors.gray600, fontSize: 8, marginTop: spacing.xl },
  paperFooter: { marginTop: "auto", flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: spacing.sm, paddingTop: spacing.xl },
  footerText: { color: colors.primary, fontSize: 7, fontWeight: "800", lineHeight: 10 },
  sendRow: { minHeight: 68, flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.medium, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  sendIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  sendCopy: { flex: 1, minWidth: 0 },
  sendTitle: { color: colors.textPrimary, fontSize: uiType.secondary, fontWeight: "800" },
  sendSubtitle: { color: colors.gray500, fontSize: uiType.caption, marginTop: 3 },
});
