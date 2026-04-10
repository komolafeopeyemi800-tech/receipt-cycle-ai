import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Accelerometer } from "expo-sensors";
import * as ImagePicker from "expo-image-picker";
import { useAction, useQuery } from "convex/react";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../../convex/_generated/api";
import { colors, type as typeScale } from "../theme/tokens";
import type { RootStackParamList } from "../navigation/types";
import { useAuth } from "../contexts/AuthContext";
import { useSubscriptionState } from "../hooks/useSubscriptionState";
import type { ScannedExtracted } from "../types/transaction";
import { userFacingError, userFacingErrorFromUnknown } from "../lib/userFacingErrors";

const bannerBlue = "rgba(37, 99, 235, 0.88)";
const DIM = "rgba(0,0,0,0.58)";
const FRAME_BORDER = "#facc15";
const FRAME_FILL = "rgba(250, 204, 21, 0.14)";
/** Movement between accelerometer samples; above = not steady */
const JERK_THRESHOLD = 0.13;
/** Hold still this long (ms) before auto shutter */
const STEADY_MS = 980;
/** After auto capture, wait before next (ms) */
const AUTO_COOLDOWN_MS = 3200;
/** Show “Hold steady” after this much still time */
const STEADY_HINT_MS = 380;

type GuidePhase = "align" | "steady" | "capturing";

export function ScanReceiptScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const { width: winW, height: winH } = useWindowDimensions();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const scan = useAction(api.scanReceipt.scanFromBase64);
  const runtime = useQuery(api.admin.publicConfig, {});
  const { token } = useAuth();
  const subscriptionState = useSubscriptionState();
  const scanBlocked = !token || Boolean(subscriptionState && !subscriptionState.canUseAiFeatures);
  const [torch, setTorch] = useState(false);
  const [autoCapture, setAutoCapture] = useState(true);
  const [busy, setBusy] = useState(false);
  const [guidePhase, setGuidePhase] = useState<GuidePhase>("align");

  const busyRef = useRef(false);
  busyRef.current = busy;

  const steadyMsRef = useRef(0);
  const lastAccelRef = useRef({ x: 0, y: 0, z: 0 });
  const cooldownUntilRef = useRef(0);
  const captureFromCameraRef = useRef<() => Promise<void>>(async () => {});
  /** Smoothed vertical offset so the guide frame subtly follows tilt (focus cue). */
  const frameNudgeSmoothRef = useRef(0);
  const [frameNudgeY, setFrameNudgeY] = useState(0);

  /** Reserve space for close/sync row + bottom shutter bar — center the guide in the remaining area */
  const topBarH = insets.top + 44;
  const bottomReserved = 108 + Math.max(insets.bottom, 12);
  const availH = winH - topBarH - bottomReserved;
  const frameW = winW * 0.88;
  const frameH = Math.min(frameW * 1.38, Math.max(200, availH * 0.68));
  const frameLeft = (winW - frameW) / 2;
  const frameTopBase = topBarH + Math.max(6, (availH - frameH) / 2);
  const frameTop = frameTopBase + frameNudgeY;
  const frameBottom = frameTop + frameH;
  const bottomDimH = Math.max(0, winH - frameBottom - bottomReserved);
  /** Yellow frame only when device is steady (best shot) or capturing — not while searching for alignment */
  const showFocusFrame = guidePhase !== "align";

  const guideText =
    guidePhase === "capturing"
      ? "Scanning — hold steady"
      : guidePhase === "steady"
        ? "Hold steady"
        : "Center the receipt";

  const processBase64 = useCallback(
    async (base64: string, mime: string) => {
      try {
        if (!token) {
          Alert.alert("Sign in", "Sign in to scan receipts.");
          return;
        }
        const result = await scan({ imageBase64: base64, mimeType: mime, sessionToken: token });
        const r = result as {
          success?: boolean;
          extracted_data?: Record<string, unknown> | null;
          error?: string;
        };
        let extracted = r.extracted_data;
        if (extracted && typeof extracted === "object" && "data" in extracted && (extracted as { data?: unknown }).data) {
          extracted = (extracted as { data: Record<string, unknown> }).data;
        }
        if (r.error || extracted == null || (typeof extracted === "object" && Object.keys(extracted).length === 0)) {
          Alert.alert(
            "Couldn't read document",
            userFacingError(
              r.error ??
                "No data returned. Check Convex OPENAI_API_KEY (or OpenRouter/Gemini) and EXPO_PUBLIC_CONVEX_URL. Stay on Wi‑Fi and try again.",
            ),
          );
          return;
        }
        navigation.navigate("ScanReview", { scannedData: extracted as ScannedExtracted, source: "camera" });
      } catch (e) {
        Alert.alert("Scan failed", userFacingErrorFromUnknown(e));
      }
    },
    [navigation, scan, token],
  );

  const captureFromCamera = useCallback(async () => {
    if (!cameraRef.current || busyRef.current) return;
    if (!token || (subscriptionState && !subscriptionState.canUseAiFeatures)) {
      Alert.alert(
        "Scanner unavailable",
        !token ? "Sign in to scan receipts." : subscriptionState?.blockReason ?? "Upgrade to use Pro or an active trial slot.",
      );
      return;
    }
    busyRef.current = true;
    setBusy(true);
    setGuidePhase("capturing");
    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.78,
        skipProcessing: Platform.OS === "android",
      });
      if (!photo?.base64) {
        Alert.alert("Camera", "Could not capture image.");
        return;
      }
      await processBase64(photo.base64, "image/jpeg");
    } catch (e) {
      Alert.alert("Camera", userFacingErrorFromUnknown(e));
    } finally {
      busyRef.current = false;
      setBusy(false);
      setGuidePhase("align");
      steadyMsRef.current = 0;
    }
  }, [processBase64, token, subscriptionState]);

  captureFromCameraRef.current = captureFromCamera;

  /** Accelerometer: frame nudge always; auto-capture only when enabled and not busy. */
  useEffect(() => {
    if (Platform.OS === "web" || !isFocused || !permission?.granted) {
      try {
        Accelerometer.removeAllListeners();
      } catch {
        /* noop */
      }
      return;
    }

    let alive = true;
    steadyMsRef.current = 0;
    lastAccelRef.current = { x: 0, y: 0, z: 0 };
    frameNudgeSmoothRef.current = 0;

    Accelerometer.setUpdateInterval(100);
    const sub = Accelerometer.addListener((a) => {
      if (!alive) return;

      const target = Math.max(-22, Math.min(22, a.y * 42));
      frameNudgeSmoothRef.current = frameNudgeSmoothRef.current * 0.82 + target * 0.18;
      setFrameNudgeY(frameNudgeSmoothRef.current);

      if (!autoCapture || busyRef.current || scanBlocked) return;
      if (Date.now() < cooldownUntilRef.current) return;

      const p = lastAccelRef.current;
      const jerk = Math.sqrt((a.x - p.x) ** 2 + (a.y - p.y) ** 2 + (a.z - p.z) ** 2);
      lastAccelRef.current = { x: a.x, y: a.y, z: a.z };

      if (jerk > JERK_THRESHOLD) {
        steadyMsRef.current = 0;
        setGuidePhase("align");
        return;
      }

      steadyMsRef.current += 100;
      if (steadyMsRef.current >= STEADY_HINT_MS && steadyMsRef.current < STEADY_MS) {
        setGuidePhase("steady");
      }
      if (steadyMsRef.current >= STEADY_MS) {
        steadyMsRef.current = 0;
        cooldownUntilRef.current = Date.now() + AUTO_COOLDOWN_MS;
        void captureFromCameraRef.current();
      }
    });

    return () => {
      alive = false;
      sub.remove();
    };
  }, [autoCapture, busy, permission?.granted, isFocused, scanBlocked]);

  const takePictureManual = useCallback(async () => {
    cooldownUntilRef.current = Date.now() + AUTO_COOLDOWN_MS;
    await captureFromCamera();
  }, [captureFromCamera]);

  const openGallery = useCallback(async () => {
    if (!token || (subscriptionState && !subscriptionState.canUseAiFeatures)) {
      Alert.alert(
        "Scanner unavailable",
        !token ? "Sign in to scan receipts." : subscriptionState?.blockReason ?? "Upgrade to use Pro or an active trial slot.",
      );
      return;
    }
    const lib = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.78,
    });
    if (lib.canceled || !lib.assets[0]) return;
    const uri = lib.assets[0].uri;
    const mime = lib.assets[0].mimeType ?? "image/jpeg";
    busyRef.current = true;
    setBusy(true);
    setGuidePhase("capturing");
    try {
      const res = await fetch(uri);
      const blob = await res.blob();
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const data = reader.result as string;
          resolve(data.includes(",") ? data.split(",")[1]! : data);
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });
      await processBase64(base64, mime);
    } finally {
      busyRef.current = false;
      setBusy(false);
      setGuidePhase("align");
    }
  }, [processBase64, token, subscriptionState]);

  if (Platform.OS === "web") {
    return (
      <View style={[styles.fallback, { paddingTop: insets.top }]}>
        <Text style={styles.fallbackTxt}>Receipt scanning runs on the mobile app.</Text>
        <Pressable style={styles.fallbackBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.fallbackBtnTxt}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  if (runtime?.maintenanceMode || runtime?.scannerEnabled === false || runtime?.mobileScanPageEnabled === false) {
    return (
      <View style={[styles.fallback, { paddingTop: insets.top }]}>
        <Ionicons name="warning-outline" size={44} color={colors.gray400} />
        <Text style={styles.permTitle}>Scanner unavailable</Text>
        <Text style={styles.permSub}>
          {runtime?.maintenanceMode
            ? "System is in maintenance mode."
            : runtime?.mobileScanPageEnabled === false
              ? "This page is currently disabled by admin."
              : "Scanner is currently disabled by admin."}
        </Text>
        <Pressable style={styles.fallbackBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.fallbackBtnTxt}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.fallback, { paddingTop: insets.top }]}>
        <Ionicons name="camera-outline" size={44} color={colors.gray400} />
        <Text style={styles.permTitle}>Camera access needed</Text>
        <Text style={styles.permSub}>Scan receipts by allowing camera access.</Text>
        <Pressable style={styles.fallbackBtn} onPress={requestPermission}>
          <Text style={styles.fallbackBtnTxt}>Allow camera</Text>
        </Pressable>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.link}>Cancel</Text>
        </Pressable>
      </View>
    );
  }

  const guidePillTop = showFocusFrame ? Math.max(insets.top + 6, frameTop - 40) : insets.top + 88;

  return (
    <View style={styles.root}>
      {scanBlocked ? (
        <View style={[styles.blockBanner, { top: topBarH }]}>
          <Text style={styles.blockBannerTxt}>
            {!token ? "Sign in to scan receipts." : subscriptionState?.blockReason ?? "Upgrade to use the scanner."}
          </Text>
        </View>
      ) : null}
      {isFocused ? (
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" enableTorch={torch} />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "#000" }]} />
      )}

      {showFocusFrame ? (
        <>
          <View style={[styles.dimStrip, { top: 0, height: frameTop, left: 0, right: 0 }]} pointerEvents="none" />
          <View
            style={[styles.dimStrip, { top: frameTop, left: 0, width: frameLeft, height: frameH }]}
            pointerEvents="none"
          />
          <View
            style={[
              styles.dimStrip,
              { top: frameTop, left: frameLeft + frameW, width: frameLeft, height: frameH },
            ]}
            pointerEvents="none"
          />
          <View
            style={[styles.dimStrip, { top: frameBottom, left: 0, right: 0, height: bottomDimH }]}
            pointerEvents="none"
          />
          <View
            style={[
              styles.frameBox,
              {
                left: frameLeft,
                top: frameTop,
                width: frameW,
                height: frameH,
                borderColor: FRAME_BORDER,
                backgroundColor: FRAME_FILL,
              },
            ]}
            pointerEvents="none"
          />
        </>
      ) : (
        <View style={styles.dimFull} pointerEvents="none" />
      )}

      <View style={[styles.guidePillWrap, { top: guidePillTop }]} pointerEvents="none">
        <View style={styles.guidePill}>
          <Text style={styles.guidePillTxt}>{guideText}</Text>
        </View>
      </View>

      <Pressable
        style={[styles.closeBtn, { top: insets.top + 8 }]}
        onPress={() => {
          if (navigation.canGoBack()) navigation.goBack();
          else navigation.navigate("Main" as never);
        }}
        hitSlop={16}
      >
        <Ionicons name="close" size={22} color="#111" />
      </Pressable>

      <View style={[styles.topRight, { top: insets.top + 8 }]}>
        <View style={styles.pillSynced}>
          <Ionicons name="cloud-done-outline" size={12} color={colors.green600} />
          <Text style={styles.pillSyncedTxt}>Synced</Text>
        </View>
        <Pressable style={styles.pillAuto} onPress={() => setAutoCapture((v) => !v)}>
          <Text style={styles.pillAutoTxt}>Auto Capture: {autoCapture ? "On" : "Off"}</Text>
        </Pressable>
      </View>

      {busy && (
        <View style={styles.busy}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.busyTxt}>Processing document…</Text>
        </View>
      )}

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Pressable style={styles.circleBtn} onPress={openGallery} disabled={busy || scanBlocked}>
          <Ionicons name="images-outline" size={20} color="#111" />
        </Pressable>
        <Pressable style={styles.shutterOuter} onPress={takePictureManual} disabled={busy || scanBlocked}>
          <View style={styles.shutterInner} />
        </Pressable>
        <Pressable style={styles.circleBtn} onPress={() => setTorch((t) => !t)} disabled={busy || scanBlocked}>
          <Ionicons name="flashlight-outline" size={20} color="#111" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  blockBanner: {
    position: "absolute",
    left: 12,
    right: 12,
    zIndex: 50,
    backgroundColor: "rgba(254, 243, 199, 0.95)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#fcd34d",
    padding: 10,
  },
  blockBannerTxt: { fontSize: 12, fontWeight: "600", color: "#78350f", textAlign: "center" },
  dimFull: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.48)",
    zIndex: 1,
  },
  dimStrip: {
    position: "absolute",
    backgroundColor: DIM,
    zIndex: 1,
  },
  frameBox: {
    position: "absolute",
    borderWidth: 2,
    borderRadius: 4,
    zIndex: 2,
  },
  guidePillWrap: {
    position: "absolute",
    left: 20,
    right: 20,
    alignItems: "center",
    zIndex: 3,
  },
  guidePill: {
    backgroundColor: bannerBlue,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    maxWidth: "100%",
  },
  guidePillTxt: {
    color: "#fff",
    fontSize: typeScale.xs,
    fontWeight: "700",
    textAlign: "center",
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#000" },
  closeBtn: {
    position: "absolute",
    left: 14,
    zIndex: 100,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 12,
  },
  topRight: {
    position: "absolute",
    right: 10,
    zIndex: 100,
    alignItems: "flex-end",
    gap: 6,
  },
  pillSynced: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#fff",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.green600,
  },
  pillSyncedTxt: { fontSize: typeScale.xs, fontWeight: "600", color: colors.green600 },
  pillAuto: {
    backgroundColor: "rgba(255,255,255,0.94)",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
  },
  pillAutoTxt: { fontSize: typeScale.xs, fontWeight: "700", color: colors.blue600 },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 36,
    paddingTop: 12,
    zIndex: 100,
  },
  circleBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  shutterOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.3)",
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: "#111",
    backgroundColor: "transparent",
  },
  busy: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
  busyTxt: { fontSize: typeScale.body, color: "#fff", marginTop: 12, fontWeight: "600" },
  fallback: { flex: 1, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", padding: 24, gap: 12 },
  fallbackTxt: { fontSize: typeScale.body, color: colors.gray600, textAlign: "center" },
  permTitle: { fontSize: typeScale.title, fontWeight: "700", color: colors.gray900 },
  permSub: { fontSize: typeScale.body, color: colors.gray500, textAlign: "center" },
  fallbackBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  fallbackBtnTxt: { color: "#fff", fontWeight: "700", fontSize: typeScale.body },
  link: { fontSize: typeScale.body, color: colors.primary, marginTop: 8 },
});
