import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScreenHeader } from "../components/ScreenHeader";
import { AppButton, AppCard, FormField, ScreenContainer, SectionHeader } from "../components/ui/FinanceUI";
import { DocumentProgress } from "../components/ui/SalesDocumentUI";
import { SafeActionFooter } from "../components/ui/SafeActionFooter";
import { useInvoiceFlow } from "../contexts/InvoiceFlowContext";
import { usePreferences } from "../contexts/PreferencesContext";
import { useSalesSetup } from "../contexts/SalesSetupContext";
import type { CatalogItem } from "../features/sales/setupData";
import { inferCatalogKind, normalizedCatalogName } from "../features/sales/catalogInference";
import type { RootStackParamList } from "../navigation/types";
import { colors, spacing, uiType } from "../theme/tokens";

export function InvoiceLineItemScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { draft, addLineItem, removeLineItem, updateDraft } = useInvoiceFlow();
  const { items, saveItem } = useSalesSetup();
  const { currency, formatMoney } = usePreferences();
  const [catalogItemId, setCatalogItemId] = useState<string | undefined>();
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [rate, setRate] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

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
    const cleanName = name.trim();
    const cleanDescription = description.trim();
    const existingCatalog = items.find((item) => normalizedCatalogName(item.name) === normalizedCatalogName(cleanName));
    const savedCatalogId = existingCatalog?.id ?? saveItem({ kind: inferCatalogKind(cleanName, cleanDescription), name: cleanName, description: cleanDescription, unitPrice: parsedRate, taxRate: "0%", category: "Uncategorized", isDefault: false, active: true });
    const line = { id: editingId ?? `line-${Date.now()}`, catalogItemId: catalogItemId ?? savedCatalogId, name: cleanName, description: cleanDescription, quantity: parsedQuantity, rate: parsedRate };
    if (editingId) updateDraft({ items: draft.items.map((item) => item.id === editingId ? line : item) });
    else addLineItem(line);
    setEditingId(null); setCatalogItemId(undefined); setName(""); setQuantity("1"); setRate(""); setDescription("");
  }

  function editLine(id: string) {
    const item = draft.items.find((row) => row.id === id);
    if (!item) return;
    setEditingId(id); setCatalogItemId(item.catalogItemId); setName(item.name); setDescription(item.description); setQuantity(String(item.quantity)); setRate(String(item.rate));
  }

  function continueFlow() {
    if (!draft.items.length) { Alert.alert("Add an item", "Add at least one line item before continuing."); return; }
    navigation.navigate("InvoiceDiscountTax");
  }

  return <ScreenContainer>
    <ScreenHeader title="Add Line Item" back />
    <DocumentProgress active={2} />
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      {draft.items.length ? <AppCard style={styles.selectedCard}><View style={styles.selectedHead}><Text style={styles.selectedTitle}>Invoice items ({draft.items.length})</Text><Text style={styles.selectedTotal}>{formatMoney(draft.items.reduce((sum, item) => sum + item.quantity * item.rate, 0))}</Text></View>{draft.items.map((item, index) => <View key={item.id} style={[styles.selectedRow, index !== draft.items.length - 1 && styles.divider]}><Pressable style={{ flex: 1 }} onPress={() => editLine(item.id)} accessibilityLabel={`Edit ${item.name}`}><Text style={styles.itemName}>{item.name}</Text><Text style={styles.itemMeta}>{item.quantity} × {formatMoney(item.rate)}</Text></Pressable><Pressable onPress={() => editLine(item.id)} accessibilityLabel={`Edit ${item.name}`} hitSlop={8}><Ionicons name="pencil-outline" size={19} color={colors.primary} /></Pressable><Pressable onPress={() => removeLineItem(item.id)} accessibilityLabel={`Remove ${item.name}`} hitSlop={8}><Ionicons name="trash-outline" size={19} color={colors.rose600} /></Pressable></View>)}</AppCard> : null}
      <FormField label="Service or Product Name" icon="cube-outline" value={name} onChangeText={setName} placeholder="Website Design" required />
      <View style={styles.twoColumns}><View style={{ flex: 1 }}><FormField label="Quantity" icon="layers-outline" value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad" required /></View><View style={{ flex: 1 }}><FormField label={`Rate (${currency})`} icon="cash-outline" value={rate} onChangeText={setRate} placeholder="0.00" keyboardType="decimal-pad" required /></View></View>
      <FormField label="Description" icon="document-text-outline" value={description} onChangeText={setDescription} placeholder="Describe the work or product..." multiline />
      <AppButton label={editingId ? "Save Item Changes" : "Add Item"} icon={editingId ? "checkmark" : "bag-add-outline"} onPress={add} />
      <View style={styles.recentSection}><SectionHeader title="Recent Items" actionLabel="Add to catalog" onAction={() => navigation.navigate("SalesItemForm")} />
        <AppCard style={styles.recentCard}>{items.filter((item) => item.active).slice(0, 5).map((item, index) => <Pressable key={item.id} onPress={() => prefill(item)} style={[styles.recentRow, index !== Math.min(4, items.filter((row) => row.active).length - 1) && styles.divider]}><View style={{ flex: 1 }}><Text style={styles.itemName}>{item.name}</Text><Text style={styles.itemMeta}>{formatMoney(item.unitPrice)} / {item.kind === "service" ? "hour" : "unit"}</Text></View><View style={styles.addSmall}><Ionicons name="add" size={18} color={colors.primary} /></View></Pressable>)}</AppCard>
      </View>
    </ScrollView>
    <SafeActionFooter><AppButton label="Continue to Discount & Tax" icon="arrow-forward" onPress={continueFlow} disabled={!draft.items.length} /></SafeActionFooter>
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
  addSmall: { width: 30, height: 30, borderRadius: 6, backgroundColor: colors.mintSoft, alignItems: "center", justifyContent: "center" },
});
