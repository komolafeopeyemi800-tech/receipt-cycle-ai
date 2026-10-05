import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScreenHeader } from "../components/ScreenHeader";
import { AppButton, AppCard, FormField, ScreenContainer, SectionHeader } from "../components/ui/FinanceUI";
import { DocumentProgress } from "../components/ui/SalesDocumentUI";
import { useInvoiceFlow } from "../contexts/InvoiceFlowContext";
import { usePreferences } from "../contexts/PreferencesContext";
import { useSalesSetup } from "../contexts/SalesSetupContext";
import type { CatalogItem } from "../features/sales/setupData";
import type { RootStackParamList } from "../navigation/types";
import { colors, spacing, uiType } from "../theme/tokens";

export function InvoiceLineItemScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { draft, addLineItem, removeLineItem } = useInvoiceFlow();
  const { items } = useSalesSetup();
  const { currency, formatMoney } = usePreferences();
  const [catalogItemId, setCatalogItemId] = useState<string | undefined>();
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [rate, setRate] = useState("");
  const [description, setDescription] = useState("");

  function prefill(item: CatalogItem) {
    setCatalogItemId(item.id);
    setName(item.name);
    setRate(String(item.unitPrice));
    setDescription(item.description);
  }

  function add() {
    const parsedQuantity = Number(quantity);
    const parsedRate = Number(rate.replace(/,/g, ""));
    if (!name.trim()) { Alert.alert("Item name required", "Enter a service or product name."); return; }
    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) { Alert.alert("Valid quantity required", "Quantity must be greater than zero."); return; }
    if (!Number.isFinite(parsedRate) || parsedRate < 0) { Alert.alert("Valid rate required", "Rate must be zero or more."); return; }
    addLineItem({ id: `line-${Date.now()}`, catalogItemId, name: name.trim(), description: description.trim(), quantity: parsedQuantity, rate: parsedRate });
    setCatalogItemId(undefined); setName(""); setQuantity("1"); setRate(""); setDescription("");
  }

  function continueFlow() {
    if (!draft.items.length) { Alert.alert("Add an item", "Add at least one line item before continuing."); return; }
    navigation.navigate("InvoiceDiscountTax");
  }

  return <ScreenContainer>
    <ScreenHeader title="Add Line Item" back />
    <DocumentProgress active={2} />
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      {draft.items.length ? <AppCard style={styles.selectedCard}><View style={styles.selectedHead}><Text style={styles.selectedTitle}>Invoice items ({draft.items.length})</Text><Text style={styles.selectedTotal}>{formatMoney(draft.items.reduce((sum, item) => sum + item.quantity * item.rate, 0))}</Text></View>{draft.items.map((item, index) => <View key={item.id} style={[styles.selectedRow, index !== draft.items.length - 1 && styles.divider]}><View style={{ flex: 1 }}><Text style={styles.itemName}>{item.name}</Text><Text style={styles.itemMeta}>{item.quantity} × {formatMoney(item.rate)}</Text></View><Pressable onPress={() => removeLineItem(item.id)} accessibilityLabel={`Remove ${item.name}`} hitSlop={8}><Ionicons name="trash-outline" size={19} color={colors.rose600} /></Pressable></View>)}</AppCard> : null}
      <FormField label="Service or Product Name" icon="cube-outline" value={name} onChangeText={setName} placeholder="Website Design" required />
      <View style={styles.twoColumns}><View style={{ flex: 1 }}><FormField label="Quantity" icon="layers-outline" value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad" required /></View><View style={{ flex: 1 }}><FormField label={`Rate (${currency})`} icon="cash-outline" value={rate} onChangeText={setRate} placeholder="0.00" keyboardType="decimal-pad" required /></View></View>
      <FormField label="Description" icon="document-text-outline" value={description} onChangeText={setDescription} placeholder="Describe the work or product..." multiline />
      <AppButton label="Add Item" icon="bag-add-outline" onPress={add} />
      <View style={styles.recentSection}><SectionHeader title="Recent Items" actionLabel="Add to catalog" onAction={() => navigation.navigate("SalesItemForm")} />
        <AppCard style={styles.recentCard}>{items.filter((item) => item.active).slice(0, 5).map((item, index) => <Pressable key={item.id} onPress={() => prefill(item)} style={[styles.recentRow, index !== Math.min(4, items.filter((row) => row.active).length - 1) && styles.divider]}><View style={{ flex: 1 }}><Text style={styles.itemName}>{item.name}</Text><Text style={styles.itemMeta}>{formatMoney(item.unitPrice)} / {item.kind === "service" ? "hour" : "unit"}</Text></View><View style={styles.addSmall}><Ionicons name="add" size={18} color={colors.primary} /></View></Pressable>)}</AppCard>
      </View>
    </ScrollView>
    <View style={styles.footer}><AppButton label="Continue to Discount & Tax" icon="arrow-forward" onPress={continueFlow} disabled={!draft.items.length} /></View>
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  selectedCard: { paddingVertical: 0, marginBottom: spacing.lg },
  selectedHead: { flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider },
  selectedTitle: { color: colors.textPrimary, fontSize: uiType.secondary, fontWeight: "800" },
  selectedTotal: { color: colors.primary, fontSize: uiType.secondary, fontWeight: "800" },
  selectedRow: { minHeight: 54, flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  twoColumns: { flexDirection: "row", gap: spacing.sm },
  recentSection: { marginTop: spacing.xl },
  recentCard: { paddingVertical: 0 },
  recentRow: { minHeight: 54, flexDirection: "row", alignItems: "center", paddingVertical: spacing.sm },
  itemName: { color: colors.textPrimary, fontSize: uiType.secondary, fontWeight: "700" },
  itemMeta: { color: colors.gray500, fontSize: uiType.caption, marginTop: 3 },
  addSmall: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.mintSoft, alignItems: "center", justifyContent: "center" },
  footer: { backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.divider, padding: spacing.lg },
});
