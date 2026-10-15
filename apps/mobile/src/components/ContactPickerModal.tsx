import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Linking, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import * as Contacts from "expo-contacts";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, spacing, uiType } from "../theme/tokens";

export type PickedContact = { name: string; businessName: string; email: string; phone: string; address: string };

type Row = PickedContact & { id: string; search: string };

/**
 * Lets the person choose someone from their phone's address book. Contacts are only read after they allow it,
 * stay on the phone, and only the one they pick is copied into the form.
 */
export function ContactPickerModal({ visible, onClose, onPick }: { visible: boolean; onClose: () => void; onPick: (contact: PickedContact) => void }) {
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<"loading" | "denied" | "ready" | "error">("loading");
  const [rows, setRows] = useState<Row[]>([]);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setState("loading");
    try {
      const permission = await Contacts.requestPermissionsAsync();
      if (!permission.granted) { setState("denied"); return; }
      const { data } = await Contacts.getContactsAsync({ fields: [Contacts.Fields.Name, Contacts.Fields.Emails, Contacts.Fields.PhoneNumbers, Contacts.Fields.Company, Contacts.Fields.Addresses], sort: Contacts.SortTypes.FirstName });
      const list: Row[] = [];
      for (const c of data) {
        const name = (c.name || [c.firstName, c.lastName].filter(Boolean).join(" ") || c.company || "").trim();
        if (!name) continue;
        const email = c.emails?.[0]?.email?.trim() ?? "";
        const phone = c.phoneNumbers?.[0]?.number?.trim() ?? "";
        const a = c.addresses?.[0];
        const address = a ? [a.street, a.city, a.region, a.postalCode, a.country].filter(Boolean).join(", ") : "";
        list.push({ id: c.id ?? `${name}-${phone}`, name, businessName: (c.company ?? "").trim(), email, phone, address, search: `${name} ${email} ${phone} ${c.company ?? ""}`.toLowerCase() });
      }
      setRows(list);
      setState("ready");
    } catch {
      setState("error");
    }
  }, []);

  useEffect(() => { if (visible) { setQuery(""); void load(); } }, [visible, load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? rows.filter((r) => r.search.includes(q)) : rows;
  }, [rows, query]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={12}><Text style={styles.cancel}>Cancel</Text></Pressable>
          <Text style={styles.title}>Choose from contacts</Text>
          <View style={{ width: 56 }} />
        </View>
        {state === "loading" ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} /> : null}
        {state === "denied" ? (
          <View style={styles.center}>
            <Ionicons name="people-outline" size={40} color={colors.gray400} />
            <Text style={styles.msgTitle}>Contacts access is off</Text>
            <Text style={styles.msg}>Allow contacts so you can pick a customer from your phone. Receipt Cycle only copies the person you choose.</Text>
            <Pressable style={styles.btn} onPress={() => void Linking.openSettings()}><Text style={styles.btnText}>Open settings</Text></Pressable>
          </View>
        ) : null}
        {state === "error" ? <View style={styles.center}><Text style={styles.msg}>Could not read your contacts. Please try again.</Text><Pressable style={styles.btn} onPress={() => void load()}><Text style={styles.btnText}>Try again</Text></Pressable></View> : null}
        {state === "ready" ? (
          <>
            <TextInput style={styles.search} value={query} onChangeText={setQuery} placeholder="Search name, phone or email" placeholderTextColor={colors.gray400} autoCorrect={false} />
            <FlatList
              data={filtered}
              keyExtractor={(r) => r.id}
              keyboardShouldPersistTaps="handled"
              initialNumToRender={20}
              windowSize={9}
              ListEmptyComponent={<Text style={styles.empty}>{rows.length ? "No matches." : "No contacts found on this phone."}</Text>}
              renderItem={({ item }) => (
                <Pressable style={styles.row} onPress={() => onPick(item)} accessibilityRole="button">
                  <View style={styles.avatar}><Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.meta} numberOfLines={1}>{[item.phone, item.email].filter(Boolean).join("  ·  ") || "No phone or email"}</Text>
                  </View>
                </Pressable>
              )}
            />
          </>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  cancel: { width: 56, color: colors.primary, fontWeight: "600", fontSize: uiType.body },
  title: { color: colors.textPrimary, fontWeight: "800", fontSize: uiType.sectionTitle },
  search: { margin: 16, minHeight: 46, borderRadius: radius.medium, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, fontSize: 16, backgroundColor: "#fafafa" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.gray100 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.mintSoft, alignItems: "center", justifyContent: "center" },
  avatarText: { color: colors.primary, fontWeight: "800", fontSize: 16 },
  name: { color: colors.textPrimary, fontWeight: "700", fontSize: uiType.body },
  meta: { color: colors.gray500, fontSize: uiType.caption, marginTop: 2 },
  center: { alignItems: "center", paddingHorizontal: 32, marginTop: 60, gap: spacing.sm },
  msgTitle: { color: colors.textPrimary, fontWeight: "800", fontSize: uiType.sectionTitle },
  msg: { color: colors.gray500, textAlign: "center", lineHeight: 20 },
  btn: { marginTop: spacing.md, minHeight: 46, paddingHorizontal: spacing.xl, borderRadius: radius.medium, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  btnText: { color: "#fff", fontWeight: "800" },
  empty: { textAlign: "center", color: colors.gray500, marginTop: 30 },
});
