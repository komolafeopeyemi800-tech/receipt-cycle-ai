import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import type { Id } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";
import { colors, gradients, type as typeScale } from "../theme/tokens";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { ScreenHeader } from "../components/ScreenHeader";
import { userFacingErrorFromUnknown } from "../lib/userFacingErrors";

const COLORS = ["#ef4444", "#2563eb", "#7c3aed", "#16a34a", "#f97316", "#db2777", "#0ea5e9", "#0f766e", "#64748b"];

type CatRow = { id: Id<"categories">; name: string; kind: "expense" | "income"; color: string };

export function CategoriesScreen() {
  const { workspace, ready } = useWorkspace();
  const ensure = useMutation(api.categories.ensureSeed);
  const createCat = useMutation(api.categories.create);
  const updateCat = useMutation(api.categories.update);
  const removeCat = useMutation(api.categories.remove);
  const list = useQuery(api.categories.list, ready ? { workspace } : "skip");

  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [kind, setKind] = useState<"expense" | "income">("expense");

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<CatRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState(COLORS[0]!);

  useEffect(() => {
    if (!ready) return;
    void ensure({ workspace });
  }, [ready, workspace, ensure]);

  const { income, expense } = useMemo(() => {
    const rows = (list ?? []) as CatRow[];
    return {
      income: rows.filter((c) => c.kind === "income"),
      expense: rows.filter((c) => c.kind === "expense"),
    };
  }, [list]);

  const loading = !ready || list === undefined;

  async function addCategory() {
    const n = newName.trim();
    if (n.length < 2) {
      Alert.alert("Category", "Enter at least 2 characters.");
      return;
    }
    const color = COLORS[Math.floor(Math.random() * COLORS.length)]!;
    try {
      await createCat({ workspace, name: n, kind, color });
      setNewName("");
      setAddOpen(false);
    } catch (e) {
      Alert.alert("Category", userFacingErrorFromUnknown(e));
    }
  }

  function openEdit(c: CatRow) {
    setEditing(c);
    setEditName(c.name);
    setEditColor(c.color);
    setEditOpen(true);
  }

  async function saveEdit() {
    if (!editing) return;
    const n = editName.trim();
    if (n.length < 2) {
      Alert.alert("Category", "Enter at least 2 characters.");
      return;
    }
    try {
      await updateCat({ id: editing.id, name: n, color: editColor });
      setEditOpen(false);
      setEditing(null);
    } catch (e) {
      Alert.alert("Category", userFacingErrorFromUnknown(e));
    }
  }

  function confirmDelete(c: CatRow) {
    Alert.alert("Delete category", `Remove “${c.name}”? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void (async () => {
            try {
              await removeCat({ id: c.id });
            } catch (e) {
              Alert.alert("Error", userFacingErrorFromUnknown(e));
            }
          })();
        },
      },
    ]);
  }

  return (
    <LinearGradient colors={[...gradients.page]} style={styles.flex}>
      <ScreenHeader title="Categories" />
      <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
        ) : (
          <>
            <View style={styles.rowActions}>
              <Pressable style={styles.primaryBtn} onPress={() => setAddOpen(true)}>
                <Ionicons name="add-circle-outline" size={20} color="#fff" />
                <Text style={styles.primaryBtnTxt}>Add category</Text>
              </Pressable>
            </View>

            <Text style={styles.section}>Income categories</Text>
            <View style={styles.grid}>
              {income.map((c) => (
                <View key={String(c.id)} style={styles.gridItem}>
                  <Pressable style={styles.gridTap} onPress={() => openEdit(c)}>
                    <View style={[styles.gridCircle, { backgroundColor: c.color }]}>
                      <Ionicons name="cash-outline" size={16} color="#fff" />
                    </View>
                    <Text style={styles.gridLbl} numberOfLines={2}>
                      {c.name}
                    </Text>
                  </Pressable>
                  <Pressable style={styles.gridTrash} onPress={() => confirmDelete(c)} hitSlop={10}>
                    <Ionicons name="trash-outline" size={16} color={colors.gray400} />
                  </Pressable>
                </View>
              ))}
            </View>

            <Text style={[styles.section, { marginTop: 14 }]}>Expense categories</Text>
            <View style={styles.grid}>
              {expense.map((c) => (
                <Pressable key={String(c.id)} style={styles.gridItem} onPress={() => openEdit(c)}>
                  <View style={[styles.gridCircle, { backgroundColor: c.color }]}>
                    <Ionicons name="pricetag-outline" size={16} color="#fff" />
                  </View>
                  <Text style={styles.gridLbl} numberOfLines={2}>
                    {c.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}
        <View style={{ height: 120 }} />
      </ScrollView>

      <Modal visible={addOpen} transparent animationType="fade" onRequestClose={() => setAddOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setAddOpen(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>New category</Text>
            <Text style={styles.modalLbl}>Type</Text>
            <View style={styles.kindRow}>
              <Pressable style={[styles.kindChip, kind === "expense" && styles.kindChipOn]} onPress={() => setKind("expense")}>
                <Text style={[styles.kindTxt, kind === "expense" && styles.kindTxtOn]}>Expense</Text>
              </Pressable>
              <Pressable style={[styles.kindChip, kind === "income" && styles.kindChipOn]} onPress={() => setKind("income")}>
                <Text style={[styles.kindTxt, kind === "income" && styles.kindTxtOn]}>Income</Text>
              </Pressable>
            </View>
            <Text style={styles.modalLbl}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Subscriptions"
              value={newName}
              onChangeText={setNewName}
              placeholderTextColor={colors.gray400}
            />
            <Pressable style={styles.modalPrimary} onPress={() => void addCategory()}>
              <Text style={styles.modalPrimaryTxt}>Save</Text>
            </Pressable>
            <Pressable style={styles.modalGhost} onPress={() => setAddOpen(false)}>
              <Text style={styles.modalGhostTxt}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={editOpen} transparent animationType="fade" onRequestClose={() => setEditOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setEditOpen(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Edit category</Text>
            <Text style={styles.modalLbl}>Name</Text>
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholderTextColor={colors.gray400}
            />
            <Text style={styles.modalLbl}>Color</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorRow}>
              {COLORS.map((hex) => (
                <Pressable
                  key={hex}
                  onPress={() => setEditColor(hex)}
                  style={[styles.colorDot, { backgroundColor: hex }, editColor === hex && styles.colorDotOn]}
                />
              ))}
            </ScrollView>
            <Pressable style={styles.modalPrimary} onPress={() => void saveEdit()}>
              <Text style={styles.modalPrimaryTxt}>Save changes</Text>
            </Pressable>
            <Pressable style={styles.modalGhost} onPress={() => setEditOpen(false)}>
              <Text style={styles.modalGhostTxt}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pad: { paddingHorizontal: 16, paddingTop: 8 },
  rowActions: { marginBottom: 16 },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryBtnTxt: { color: "#fff", fontWeight: "700", fontSize: typeScale.body },
  section: { fontSize: typeScale.md, fontWeight: "700", color: colors.gray700, marginBottom: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 12 },
  gridItem: { width: "30%", alignItems: "center", marginBottom: 12 },
  gridTap: { alignItems: "center", width: "100%" },
  gridTrash: { marginTop: 4, padding: 4 },
  gridCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  gridLbl: { fontSize: typeScale.sm, color: colors.gray800, textAlign: "center" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    maxHeight: "90%",
  },
  modalTitle: { fontSize: 17, fontWeight: "700", color: colors.gray900, marginBottom: 12 },
  modalLbl: { fontSize: 12, fontWeight: "600", color: colors.gray600, marginBottom: 6 },
  kindRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  kindChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.gray200,
    alignItems: "center",
  },
  kindChipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  kindTxt: { fontWeight: "700", color: colors.gray700 },
  kindTxtOn: { color: "#fff" },
  input: {
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  colorRow: { gap: 10, marginBottom: 12 },
  colorDot: { width: 36, height: 36, borderRadius: 18, marginRight: 8 },
  colorDotOn: { borderWidth: 3, borderColor: colors.gray900 },
  modalPrimary: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalPrimaryTxt: { color: "#fff", fontWeight: "700" },
  modalGhost: { paddingVertical: 12, alignItems: "center" },
  modalGhostTxt: { color: colors.gray600, fontWeight: "600" },
});
