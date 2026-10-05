import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { BusinessProfile } from "../../features/sales/setupData";
import type { SavedPayment } from "../../features/payments/model";
import { colors, radius, spacing, uiType } from "../../theme/tokens";

export function ReceiptPreviewCard({ payment, business, formatMoney, formatDate }: { payment: SavedPayment; business: BusinessProfile; formatMoney: (amount: number) => string; formatDate: (date: string) => string }) {
  return <View style={styles.paper}>
    <View style={styles.header}><View style={styles.brandRow}><View style={styles.brandMark}><Ionicons name="leaf-outline" size={19} color="#fff" /></View><View><Text style={styles.brand}>{business.businessName || "Receipt Cycle"}</Text><Text style={styles.micro}>Simple Financial Tools</Text><Text style={styles.micro}>for A Brighter Tomorrow</Text></View></View><View style={styles.receiptMeta}><Text style={styles.receiptTitle}>RECEIPT</Text><Text style={styles.metaStrong}>{payment.receiptNumber}</Text><Text style={styles.micro}>{formatDate(payment.paymentDate)}</Text></View></View>
    <View style={styles.rule} />
    <View style={styles.partyRow}><View style={{ flex: 1 }}><Text style={styles.label}>BILL TO</Text><Text style={styles.party}>{payment.customerName}</Text><Text style={styles.address}>{payment.customerAddress || payment.customerEmail || "Customer payment"}</Text></View><View style={styles.invoiceRef}><Text style={styles.label}>INVOICE REF.</Text><Text style={styles.party}>{payment.invoiceNumber}</Text></View></View>
    <ReceiptLine label="Amount Received" value={formatMoney(payment.amount)} strong />
    <ReceiptLine label="Payment Method" value={payment.method} />
    <ReceiptLine label="Received Into" value={payment.accountName} />
    <ReceiptLine label="Payment Date" value={formatDate(payment.paymentDate)} />
    <ReceiptLine label="Reference" value={payment.reference} />
    <View style={styles.balance}><Text style={styles.balanceLabel}>Remaining Balance</Text><Text style={styles.balanceValue}>{formatMoney(payment.remainingBalance)}</Text></View>
    <View style={styles.thanks}><Text style={styles.thanksMain}>Thank you for your payment!</Text><Text style={styles.thanksSub}>Together, we build brighter businesses.</Text></View>
    <View style={styles.signature}><Text style={styles.signatureText}>{business.businessName || "Receipt Cycle"}</Text><View style={styles.signatureLine} /><Text style={styles.micro}>Authorized Signature</Text></View>
  </View>;
}

function ReceiptLine({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <View style={styles.line}><Text style={styles.lineLabel}>{label}</Text><Text style={[styles.lineValue, strong && styles.lineStrong]}>{value}</Text></View>;
}

export function PaymentSuccessIcon() {
  return <View style={styles.successHalo}><Ionicons name="checkmark" size={45} color="#fff" /></View>;
}

const styles = StyleSheet.create({
  paper: { minHeight: 610, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, borderRadius: radius.small },
  header: { flexDirection: "row", justifyContent: "space-between", gap: spacing.sm },
  brandRow: { flexDirection: "row", gap: spacing.sm, alignItems: "center", flex: 1 },
  brandMark: { width: 38, height: 38, borderRadius: radius.small, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  brand: { color: colors.textPrimary, fontSize: uiType.body, fontWeight: "900" },
  micro: { color: colors.gray500, fontSize: 9, marginTop: 2 },
  receiptMeta: { alignItems: "flex-end" },
  receiptTitle: { color: colors.textPrimary, fontSize: uiType.body, fontWeight: "900" },
  metaStrong: { color: colors.textPrimary, fontSize: 10, fontWeight: "800", marginTop: 4 },
  rule: { borderTopWidth: 1, borderStyle: "dashed", borderTopColor: colors.gray400, marginVertical: spacing.lg },
  partyRow: { flexDirection: "row", gap: spacing.lg, marginBottom: spacing.xl },
  invoiceRef: { alignItems: "flex-end" },
  label: { color: colors.gray600, fontSize: 9, fontWeight: "800" },
  party: { color: colors.textPrimary, fontSize: uiType.secondary, fontWeight: "800", marginTop: 4 },
  address: { color: colors.gray600, fontSize: 9, lineHeight: 13, marginTop: 4 },
  line: { minHeight: 40, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider },
  lineLabel: { color: colors.gray600, fontSize: uiType.caption },
  lineValue: { color: colors.textPrimary, fontSize: uiType.caption, fontWeight: "700", textAlign: "right" },
  lineStrong: { fontSize: uiType.body, fontWeight: "900" },
  balance: { minHeight: 56, backgroundColor: colors.gray100, borderRadius: radius.small, paddingHorizontal: spacing.md, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.md },
  balanceLabel: { color: colors.textPrimary, fontSize: uiType.secondary, fontWeight: "800" },
  balanceValue: { color: colors.textPrimary, fontSize: uiType.body, fontWeight: "900" },
  thanks: { alignItems: "center", marginTop: spacing.xl },
  thanksMain: { color: colors.gray600, fontSize: uiType.caption },
  thanksSub: { color: colors.gray500, fontSize: 9, fontStyle: "italic", marginTop: 4 },
  signature: { alignItems: "center", marginTop: "auto", paddingTop: spacing.xxl },
  signatureText: { color: colors.textPrimary, fontSize: 22, fontStyle: "italic" },
  signatureLine: { width: 190, borderTopWidth: 1, borderTopColor: colors.gray600, marginTop: 3 },
  successHalo: { width: 102, height: 102, borderRadius: 51, backgroundColor: colors.primary, borderWidth: 12, borderColor: colors.mintSoft, alignItems: "center", justifyContent: "center" },
});
