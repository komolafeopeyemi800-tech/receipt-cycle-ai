import { useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useActionSheet } from "@expo/react-native-action-sheet";
import * as ImagePicker from "expo-image-picker";
import { Directory, File, Paths } from "expo-file-system";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScreenHeader } from "../components/ScreenHeader";
import { AppButton, FormField, ScreenContainer, SelectField } from "../components/ui/FinanceUI";
import { usePreferences } from "../contexts/PreferencesContext";
import { useSalesSetup } from "../contexts/SalesSetupContext";
import type { BusinessProfile, InvoiceSettings } from "../features/sales/setupData";
import type { RootStackParamList } from "../navigation/types";
import { colors, radius, spacing, uiType } from "../theme/tokens";
import type { DateFormatId } from "../lib/preferences";

type RootNav = NativeStackNavigationProp<RootStackParamList>;

function useOptionPicker() {
  const { showActionSheetWithOptions } = useActionSheet();
  return (title: string, options: string[], onSelect: (value: string) => void) => {
    const labels = [...options, "Cancel"];
    showActionSheetWithOptions({ title, options: labels, cancelButtonIndex: labels.length - 1 }, (index) => {
      if (index === undefined || index === labels.length - 1) return;
      const value = options[index];
      if (value) onSelect(value);
    });
  };
}

export function BusinessProfileScreen() {
  const navigation = useNavigation<RootNav>();
  const { businessProfile, saveBusinessProfile } = useSalesSetup();
  const [profile, setProfile] = useState<BusinessProfile>(businessProfile);

  function change<K extends keyof BusinessProfile>(key: K, value: BusinessProfile[K]) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  async function pickLogo() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { Alert.alert("Photo access needed", "Allow photo-library access to choose your business logo."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.9 });
    if (!result.canceled && result.assets[0]?.uri) {
      if (result.assets[0].fileSize && result.assets[0].fileSize > 2 * 1024 * 1024) {
        Alert.alert("Logo is too large", "Choose a JPG or PNG smaller than 2MB.");
        return;
      }
      try {
        const directory = new Directory(Paths.document, "ReceiptCycle", "Branding");
        directory.create({ idempotent: true, intermediates: true });
        const source = new File(result.assets[0].uri);
        const extension = source.extension || ".jpg";
        const destination = new File(directory, `business-logo-${Date.now()}${extension}`);
        source.copy(destination);
        change("logoUri", destination.uri);
      } catch {
        Alert.alert("Logo unavailable", "The selected image could not be saved. Please choose another image.");
      }
    }
  }

  function onSave() {
    if (!profile.businessName.trim()) { Alert.alert("Business name required", "Enter the name that should appear on your invoices."); return; }
    saveBusinessProfile({ ...profile, businessName: profile.businessName.trim(), email: profile.email.trim(), phone: profile.phone.trim(), address: profile.address.trim(), taxId: profile.taxId.trim(), website: profile.website.trim() });
    navigation.goBack();
  }

  return <ScreenContainer>
    <ScreenHeader title="Business Profile" back />
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Pressable onPress={() => void pickLogo()} style={({ pressed }) => [styles.logoCard, pressed && { opacity: 0.75 }]} accessibilityRole="button" accessibilityLabel="Upload business logo">
        {profile.logoUri ? <Image source={{ uri: profile.logoUri }} style={styles.logoImage} /> : <View style={styles.logoPlaceholder}><Ionicons name="leaf-outline" size={30} color="#fff" /></View>}
        <Text style={styles.logoTitle}>{profile.logoUri ? "Change Logo" : "Upload Logo"}</Text>
        <Text style={styles.logoMeta}>JPG or PNG up to 2MB</Text>
      </Pressable>
      <FormField label="Business Name" icon="business-outline" value={profile.businessName} onChangeText={(value) => change("businessName", value)} placeholder="Your Business Name" required />
      <FormField label="Email Address" icon="mail-outline" value={profile.email} onChangeText={(value) => change("email", value)} placeholder="business@yourcompany.com" keyboardType="email-address" autoCapitalize="none" />
      <FormField label="Phone Number" icon="call-outline" value={profile.phone} onChangeText={(value) => change("phone", value)} placeholder="(415) 555-0101" keyboardType="phone-pad" />
      <FormField label="Business Address" icon="location-outline" value={profile.address} onChangeText={(value) => change("address", value)} placeholder={'123 Market Street\nSan Francisco, CA 94103'} multiline />
      <FormField label="Tax ID (EIN)" icon="lock-closed-outline" value={profile.taxId} onChangeText={(value) => change("taxId", value)} placeholder="12-3456789" />
      <FormField label="Website" icon="globe-outline" value={profile.website} onChangeText={(value) => change("website", value)} placeholder="https://www.yourbusiness.com" keyboardType="url" autoCapitalize="none" />
      <AppButton label="Save changes" onPress={onSave} style={styles.button} />
    </ScrollView>
  </ScreenContainer>;
}

const dateFormatIds: Record<string, DateFormatId> = { "MM/DD/YYYY": "us", "DD/MM/YYYY": "eu", "YYYY-MM-DD": "iso" };

export function InvoiceSettingsScreen() {
  const navigation = useNavigation<RootNav>();
  const { invoiceSettings, saveInvoiceSettings } = useSalesSetup();
  const { setCurrency, setDateFormat } = usePreferences();
  const pick = useOptionPicker();
  const [settings, setSettings] = useState<InvoiceSettings>(invoiceSettings);
  const [saving, setSaving] = useState(false);

  function change<K extends keyof InvoiceSettings>(key: K, value: InvoiceSettings[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  async function onSave() {
    if (!settings.invoicePrefix.trim()) { Alert.alert("Prefix required", "Enter an invoice number prefix."); return; }
    setSaving(true);
    try {
      const normalized = { ...settings, invoicePrefix: settings.invoicePrefix.trim().toUpperCase(), taxLabel: settings.taxLabel.trim(), defaultNotes: settings.defaultNotes.trim() };
      saveInvoiceSettings(normalized);
      await Promise.all([setCurrency(normalized.currency), setDateFormat(dateFormatIds[normalized.dateFormat] ?? "iso")]);
      navigation.goBack();
    } finally { setSaving(false); }
  }

  return <ScreenContainer>
    <ScreenHeader title="Invoice Settings" back />
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <SelectField label="Default Currency" icon="cash-outline" value={`${settings.currency} — ${settings.currency === "USD" ? "US Dollar ($)" : settings.currency}`} onPress={() => pick("Default currency", ["USD", "EUR", "GBP", "CAD", "NGN"], (value) => change("currency", value))} />
      <SelectField label="Date Format" icon="calendar-outline" value={`${settings.dateFormat} (Sep 14, 2026)`} onPress={() => pick("Date format", ["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"], (value) => change("dateFormat", value))} />
      <FormField label="Invoice Number Prefix" icon="document-text-outline" value={settings.invoicePrefix} onChangeText={(value) => change("invoicePrefix", value)} placeholder="INV" />
      <Text style={styles.helper}>New invoices will be numbered like {settings.invoicePrefix.trim().toUpperCase() || "INV"}-2026-001.</Text>
      <SelectField label="Default Tax Rate" icon="receipt-outline" value={settings.defaultTaxRate} onPress={() => pick("Default tax rate", ["No tax", "5.00%", "8.25%", "10.00%"], (value) => change("defaultTaxRate", value))} />
      <FormField label="Tax Label" icon="pricetag-outline" value={settings.taxLabel} onChangeText={(value) => change("taxLabel", value)} placeholder="Sales Tax" />
      <SelectField label="Payment Terms" icon="time-outline" value={settings.paymentTerms} onPress={() => pick("Payment terms", ["Due on receipt", "Net 7", "Net 15", "Net 30", "Net 60"], (value) => change("paymentTerms", value))} />
      <FormField label="Notes for Invoices" icon="chatbox-ellipses-outline" value={settings.defaultNotes} onChangeText={(value) => change("defaultNotes", value)} placeholder="Thank you for your business!" multiline />
      <Text style={styles.helper}>This note will appear on all invoices by default.</Text>
      <AppButton label={saving ? "Saving..." : "Save settings"} disabled={saving} onPress={() => void onSave()} style={styles.button} />
    </ScrollView>
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  logoCard: { minHeight: 122, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.large, alignItems: "center", justifyContent: "center", marginBottom: spacing.xl },
  logoPlaceholder: { width: 52, height: 52, borderRadius: radius.medium, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginBottom: spacing.sm },
  logoImage: { width: 58, height: 58, borderRadius: radius.medium, marginBottom: spacing.sm },
  logoTitle: { color: colors.textPrimary, fontSize: uiType.secondary, fontWeight: "800" },
  logoMeta: { color: colors.gray500, fontSize: uiType.caption, marginTop: 3 },
  helper: { color: colors.gray500, fontSize: uiType.caption, lineHeight: 16, marginTop: -spacing.sm, marginBottom: spacing.md, paddingHorizontal: spacing.xs },
  button: { marginTop: spacing.md },
});
