import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import { ScreenHeader } from "../components/ScreenHeader";
import { AppButton, ScreenContainer } from "../components/ui/FinanceUI";
import { SafeActionFooter } from "../components/ui/SafeActionFooter";
import { DocumentPreview } from "../components/documents/DocumentPreview";
import { SignaturePad } from "../components/documents/SignaturePad";
import { useSalesSetup } from "../contexts/SalesSetupContext";
import { usePreferences } from "../contexts/PreferencesContext";
import { ACCENTS, PAPER, type DocInput, type DocTemplate, type PaperSize } from "../features/documents/layout";
import { resolveDocumentStyle } from "../features/documents/styleStore";
import { createInvoiceDraft } from "../features/invoices/model";
import { documentLogo } from "../features/invoices/pdf";
import type { SalesCustomer } from "../features/sales/setupData";
import type { RootStackParamList } from "../navigation/types";
import { colors, radius, spacing, uiType } from "../theme/tokens";

const SAMPLE_CUSTOMER: SalesCustomer = { id: "sample", name: "Northwind Traders", businessName: "Northwind Traders Ltd", email: "accounts@northwind.example", phone: "+1 555 010 2030", billingAddress: "48 Harbour Road\nPort City 10021", taxId: "", notes: "", status: "active", createdAt: "2026-01-01" };

export function DocumentStyleScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<RootStackParamList, "DocumentStyle">>();
  const kind = params.kind;
  const { invoiceSettings, saveInvoiceSettings, businessProfile, saveBusinessProfile } = useSalesSetup();
  const { currency, formatDate, numberFormat } = usePreferences();
  const current = resolveDocumentStyle(kind, invoiceSettings, formatDate);
  const [template, setTemplate] = useState<DocTemplate>(current.template);
  const [accent, setAccent] = useState(current.accent);
  const [paper, setPaper] = useState<PaperSize>(current.paper);
  const [padOpen, setPadOpen] = useState(false);

  const input = useMemo<DocInput>(() => {
    const base = createInvoiceDraft(invoiceSettings, []);
    const draft = {
      ...base,
      invoiceNumber: kind === "INVOICE" ? "INV-2026-001" : "EST-2026-001",
      items: [
        { id: "a", name: "Brand identity design", description: "Logo, colour palette and usage guide", quantity: 1, rate: 1200 },
        { id: "b", name: "Website hosting", description: "12 months", quantity: 12, rate: 25 },
        { id: "c", name: "Monthly support", description: "", quantity: 3, rate: 150 },
      ],
      notes: invoiceSettings.defaultNotes || "Thank you for your business.",
      taxRate: base.taxRate || 7.5,
      signatureEnabled: true,
    };
    return { kind, template, accent, paper, draft, business: businessProfile, customer: SAMPLE_CUSTOMER, currency, formatDate, signature: businessProfile.signature ?? null, logo: documentLogo(businessProfile) };
    // numberFormat changes how money prints, so it refreshes the sample too
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, template, accent, paper, invoiceSettings, businessProfile, currency, formatDate, numberFormat]);

  function save() {
    saveInvoiceSettings({
      ...invoiceSettings,
      paperSize: paper,
      ...(kind === "INVOICE" ? { invoiceTemplate: template, invoiceColor: accent } : { estimateTemplate: template, estimateColor: accent }),
    });
    Alert.alert("Saved", `Your ${kind === "INVOICE" ? "invoices" : "estimates"} will print in this style.`);
    navigation.goBack();
  }

  return (
    <ScreenContainer>
      <ScreenHeader title={kind === "INVOICE" ? "Invoice Style & Color" : "Estimate Style & Color"} back />
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <DocumentPreview input={input} />
        <Text style={styles.section}>LAYOUT</Text>
        <View style={styles.row}>
          {(["standard", "compact"] as const).map((t) => (
            <Pressable key={t} onPress={() => setTemplate(t)} style={[styles.chip, template === t && styles.chipOn]} accessibilityRole="button" accessibilityState={{ selected: template === t }}>
              <Text style={[styles.chipText, template === t && styles.chipTextOn]}>{t === "standard" ? "Standard" : "Compact"}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.hint}>{template === "standard" ? "Colour header, shaded table and a bold total. Best for sending to clients." : "Thin lines and small type. Fits more on a page and saves ink."}</Text>
        <Text style={styles.section}>COLOUR</Text>
        <View style={styles.swatches}>
          {ACCENTS.map((a) => (
            <Pressable key={a.id} onPress={() => setAccent(a.hex)} accessibilityRole="button" accessibilityLabel={a.name} accessibilityState={{ selected: accent === a.hex }} style={[styles.swatchRing, accent === a.hex && { borderColor: a.hex }]}>
              <View style={[styles.swatch, { backgroundColor: a.hex }]}>{accent === a.hex ? <Ionicons name="checkmark" size={20} color="#fff" /> : null}</View>
            </Pressable>
          ))}
        </View>
        <Text style={styles.section}>PAPER SIZE</Text>
        <View style={styles.row}>
          {(["a4", "letter"] as const).map((p) => (
            <Pressable key={p} onPress={() => setPaper(p)} style={[styles.chip, paper === p && styles.chipOn]} accessibilityRole="button" accessibilityState={{ selected: paper === p }}>
              <Text style={[styles.chipText, paper === p && styles.chipTextOn]}>{PAPER[p].label}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.section}>SIGNATURE</Text>
        <View style={styles.sigCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sigTitle}>{businessProfile.signature ? "Your signature is saved" : "No signature yet"}</Text>
            <Text style={styles.hint}>Draw it once with your finger. It prints on documents where you switch the signature on.</Text>
          </View>
          <Pressable style={styles.sigBtn} onPress={() => setPadOpen(true)} accessibilityRole="button"><Ionicons name="pencil" size={16} color="#fff" /><Text style={styles.sigBtnText}>{businessProfile.signature ? "Redraw" : "Draw"}</Text></Pressable>
        </View>
        {businessProfile.signature ? <Pressable onPress={() => saveBusinessProfile({ ...businessProfile, signature: null })}><Text style={styles.remove}>Remove saved signature</Text></Pressable> : null}
        <Text style={styles.hint}>The preview uses sample customer details and your currency ({currency}). It shows the same page as the PDF you share.</Text>
      </ScrollView>
      <SafeActionFooter><AppButton label="Save style" onPress={save} /></SafeActionFooter>
      <SignaturePad visible={padOpen} onClose={() => setPadOpen(false)} onSave={(ink) => { saveBusinessProfile({ ...businessProfile, signature: ink }); setPadOpen(false); }} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  page: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  section: { color: colors.gray500, fontSize: uiType.caption, fontWeight: "800", letterSpacing: 0.6, marginTop: spacing.xl, marginBottom: spacing.sm },
  row: { flexDirection: "row", gap: spacing.sm },
  chip: { paddingHorizontal: spacing.xl, minHeight: 44, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", backgroundColor: colors.gray100, borderWidth: 1, borderColor: "transparent" },
  chipOn: { backgroundColor: colors.mintSoft, borderColor: colors.primary },
  chipText: { color: colors.textPrimary, fontSize: uiType.body, fontWeight: "700" },
  chipTextOn: { color: colors.primary },
  hint: { color: colors.gray500, fontSize: uiType.caption, lineHeight: 17, marginTop: spacing.sm },
  swatches: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  swatchRing: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: "transparent", alignItems: "center", justifyContent: "center" },
  swatch: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  sigCard: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, borderRadius: radius.medium, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  sigTitle: { color: colors.textPrimary, fontSize: uiType.body, fontWeight: "700" },
  sigBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: spacing.lg, minHeight: 42, borderRadius: radius.medium, backgroundColor: colors.primary },
  sigBtnText: { color: "#fff", fontWeight: "800" },
  remove: { color: colors.rose600, fontWeight: "700", marginTop: spacing.sm },
});
