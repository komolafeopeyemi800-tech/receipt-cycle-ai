import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../contexts/AuthContext";
import { api, useMutation } from "../lib/api";
import type { RootStackParamList } from "../navigation/types";
import { colors, gradients, radius, spacing, uiType } from "../theme/tokens";

type ProfileDraft = { fullName: string; gender: string; dateOfBirth: string; phone: string; address: string };
const blank: ProfileDraft = { fullName: "", gender: "", dateOfBirth: "", phone: "", address: "" };

export function PersonalProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, token } = useAuth();
  const uploadAvatar = useMutation(api.auth.uploadAvatar);
  const removeAvatar = useMutation(api.auth.removeAvatar);
  const updateProfile = useMutation(api.auth.updateProfile);
  const storageKey = `receiptcycle_personal_profile_${user?.id ?? "guest"}`;
  const [draft, setDraft] = useState<ProfileDraft>({ ...blank, fullName: user?.name ?? "" });
  const [photoBusy, setPhotoBusy] = useState(false);

  useEffect(() => {
    void AsyncStorage.getItem(storageKey).then((raw) => {
      if (!raw) return;
      try { setDraft({ ...blank, ...JSON.parse(raw) }); } catch { /* ignore invalid local data */ }
    });
  }, [storageKey]);

  const update = (key: keyof ProfileDraft, value: string) => setDraft((current) => ({ ...current, [key]: value }));
  const choosePhoto = async () => {
    if (!token) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { Alert.alert("Photo access needed", "Allow photo access to choose a profile picture."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.72 });
    if (result.canceled || !result.assets[0]) return;
    setPhotoBusy(true);
    try {
      const asset = result.assets[0];
      const blob = await (await fetch(asset.uri)).blob();
      if (blob.size > 1024 * 1024) throw new Error("Choose a picture smaller than 1 MB.");
      await uploadAvatar({ token, file: blob });
      Alert.alert("Picture updated", "Your new profile picture is now shown across Receipt Cycle.");
    } catch (error) {
      Alert.alert("Could not update picture", error instanceof Error ? error.message : "Please try another image.");
    } finally { setPhotoBusy(false); }
  };
  const deletePhoto = async () => {
    if (!token) return;
    setPhotoBusy(true);
    try { await removeAvatar({ token }); } catch { Alert.alert("Could not remove picture", "Please try again."); } finally { setPhotoBusy(false); }
  };
  const save = async () => {
    await AsyncStorage.setItem(storageKey, JSON.stringify(draft));
    if (token && draft.fullName.trim() && draft.fullName.trim() !== user?.name) await updateProfile({ token, name: draft.fullName.trim() });
    Alert.alert("Profile saved", "Your profile details have been updated.");
  };

  return <LinearGradient colors={[...gradients.page]} style={styles.flex}><KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}><View style={styles.header}><Pressable onPress={() => navigation.goBack()} hitSlop={12}><Ionicons name="chevron-back" size={24} color={colors.textPrimary} /></Pressable><Text style={styles.title}>Personal profile</Text><View style={{ width: 24 }} /></View><ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled"><Pressable style={styles.avatar} onPress={() => void choosePhoto()} accessibilityLabel="Change profile picture">{user?.image ? <Image source={{ uri: user.image }} style={styles.avatarImage} /> : <LinearGradient colors={[colors.primary, colors.blue600]} style={styles.defaultAvatar}><Ionicons name="person" size={38} color="#fff" /></LinearGradient>}{photoBusy ? <View style={styles.photoBusy}><ActivityIndicator color="#fff" /></View> : <View style={styles.cameraBadge}><Ionicons name="camera" size={15} color="#fff" /></View>}</Pressable><View style={styles.photoActions}><Pressable onPress={() => void choosePhoto()} disabled={photoBusy}><Text style={styles.photoAction}>Change picture</Text></Pressable>{user?.image ? <Pressable onPress={() => void deletePhoto()} disabled={photoBusy}><Text style={styles.removeAction}>Remove</Text></Pressable> : null}</View><Text style={styles.email}>{user?.email}</Text><Text style={styles.note}>Keep your personal contact and identity details together. Business information shown on invoices is managed separately under Business Profile.</Text><Field label="Full name" value={draft.fullName} onChangeText={(value) => update("fullName", value)} placeholder="Your full name" /><Field label="Gender" value={draft.gender} onChangeText={(value) => update("gender", value)} placeholder="Optional" /><Field label="Date of birth" value={draft.dateOfBirth} onChangeText={(value) => update("dateOfBirth", value)} placeholder="DD/MM/YYYY" keyboardType="numbers-and-punctuation" /><Field label="Phone number" value={draft.phone} onChangeText={(value) => update("phone", value)} placeholder="Optional" keyboardType="phone-pad" /><Field label="Address" value={draft.address} onChangeText={(value) => update("address", value)} placeholder="Street, city, state, country" multiline /><Pressable style={styles.save} onPress={() => void save()}><Text style={styles.saveText}>Save profile</Text></Pressable></ScrollView></KeyboardAvoidingView></LinearGradient>;
}

function Field(props: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; multiline?: boolean; keyboardType?: "default" | "phone-pad" | "numbers-and-punctuation" }) {
  return <View style={styles.field}><Text style={styles.label}>{props.label}</Text><TextInput {...props} keyboardType={props.keyboardType ?? "default"} placeholderTextColor={colors.gray400} style={[styles.input, props.multiline && styles.multiline]} /></View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, header: { paddingHorizontal: spacing.lg, paddingTop: 52, paddingBottom: spacing.md, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, title: { color: colors.textPrimary, fontSize: uiType.screenTitle, fontWeight: "800" }, page: { padding: spacing.lg, paddingBottom: spacing.xxxl }, avatar: { width: 88, height: 88, borderRadius: 44, alignSelf: "center" }, avatarImage: { width: 88, height: 88, borderRadius: 44 }, defaultAvatar: { width: 88, height: 88, borderRadius: 44, alignItems: "center", justifyContent: "center" }, cameraBadge: { position: "absolute", right: -1, bottom: 1, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primaryDark, borderWidth: 2, borderColor: "#fff", alignItems: "center", justifyContent: "center" }, photoBusy: { ...StyleSheet.absoluteFillObject, borderRadius: 44, backgroundColor: "rgba(15,23,42,.45)", alignItems: "center", justifyContent: "center" }, photoActions: { flexDirection: "row", justifyContent: "center", gap: spacing.lg, marginTop: spacing.md }, photoAction: { color: colors.primary, fontSize: uiType.secondary, fontWeight: "800" }, removeAction: { color: colors.danger, fontSize: uiType.secondary, fontWeight: "700" }, email: { textAlign: "center", color: colors.textSecondary, fontSize: uiType.secondary, marginTop: spacing.sm }, note: { color: colors.textSecondary, fontSize: uiType.secondary, lineHeight: 19, textAlign: "center", marginVertical: spacing.xl }, field: { marginBottom: spacing.md }, label: { color: colors.textPrimary, fontSize: uiType.secondary, fontWeight: "700", marginBottom: 6 }, input: { minHeight: 48, borderWidth: 1, borderColor: colors.border, borderRadius: radius.medium, backgroundColor: colors.surface, paddingHorizontal: spacing.md, color: colors.textPrimary, fontSize: uiType.body }, multiline: { minHeight: 92, paddingTop: spacing.md, textAlignVertical: "top" }, save: { minHeight: 50, borderRadius: radius.medium, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginTop: spacing.md }, saveText: { color: "#fff", fontSize: uiType.body, fontWeight: "800" },
});
