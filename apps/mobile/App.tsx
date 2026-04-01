import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import { StatusBar } from "expo-status-bar";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexProvider } from "convex/react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { convex } from "./src/lib/convex";
import { ReceiptCycleTabBar } from "./src/components/ReceiptCycleTabBar";
import { TransactionsListScreen } from "./src/screens/TransactionsListScreen";
import { InsightsScreen } from "./src/screens/InsightsScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { GoogleDriveBackupScreen } from "./src/screens/GoogleDriveBackupScreen";
import { DriveBackupAppListener } from "./src/components/DriveBackupAppListener";
import { AccountSettingsScreen } from "./src/screens/AccountSettingsScreen";
import { PricingScreen } from "./src/screens/PricingScreen";
import { AddTransactionScreen } from "./src/screens/AddTransactionScreen";
import { NotificationsScreen } from "./src/screens/NotificationsScreen";
import { WorkspaceProvider } from "./src/contexts/WorkspaceContext";
import { PreferencesProvider } from "./src/contexts/PreferencesContext";
import { RegionalPreferencesScreen } from "./src/screens/RegionalPreferencesScreen";
import { MerchantsVendorsScreen } from "./src/screens/MerchantsVendorsScreen";
import { SavedLocationsScreen } from "./src/screens/SavedLocationsScreen";
import { BudgetsScreen } from "./src/screens/BudgetsScreen";
import { AccountsScreen } from "./src/screens/AccountsScreen";
import { CategoriesScreen } from "./src/screens/CategoriesScreen";
import { ScanReceiptScreen } from "./src/screens/ScanReceiptScreen";
import { ScanReviewScreen } from "./src/screens/ScanReviewScreen";
import { UploadStatementScreen } from "./src/screens/UploadStatementScreen";
import { TransactionDetailScreen } from "./src/screens/TransactionDetailScreen";
import { CategoryBreakdownScreen } from "./src/screens/CategoryBreakdownScreen";
import { AccountDetailScreen } from "./src/screens/AccountDetailScreen";
import { AuthProvider, useAuth } from "./src/contexts/AuthContext";
import { SignInScreen } from "./src/screens/SignInScreen";
import { SignUpScreen } from "./src/screens/SignUpScreen";
import { ForgotPasswordScreen } from "./src/screens/ForgotPasswordScreen";
import { ResetPasswordScreen } from "./src/screens/ResetPasswordScreen";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { colors } from "./src/theme/tokens";
import type { RootStackParamList } from "./src/navigation/types";

/** v2: 7-step flow aligned with web onboarding */
const ONBOARDING_KEY = "receiptcycle_onboarding_v2";
/** Legacy: first mobile onboarding flag — migrate so existing users aren’t forced through v2 again */
const ONBOARDING_LEGACY = "receiptcycle_onboarding_v1";

const queryClient = new QueryClient();
const Stack = createNativeStackNavigator();
const AuthNav = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

function extractResetTokenFromUrl(url: string): string | null {
  if (!url.includes("reset-password")) return null;
  try {
    const q = url.indexOf("?");
    const search = q >= 0 ? url.slice(q + 1) : "";
    const token = new URLSearchParams(search).get("token");
    return token && token.length >= 8 ? token : null;
  } catch {
    return null;
  }
}

function navigateToResetIfNeeded(url: string | null) {
  if (!url) return;
  const token = extractResetTokenFromUrl(url);
  if (!token || !navigationRef.isReady()) return;
  navigationRef.navigate("ResetPassword", { token });
}

function PasswordResetDeepLinks() {
  const { user, loading } = useAuth();
  /** Wait until auth resolved and guest stack is mounted before handling cold-start links. */
  useEffect(() => {
    if (loading || user) return;
    void Linking.getInitialURL().then((url) => navigateToResetIfNeeded(url));
  }, [loading, user]);

  useEffect(() => {
    if (user) return;
    const sub = Linking.addEventListener("url", (e) => navigateToResetIfNeeded(e.url));
    return () => sub.remove();
  }, [user]);
  return null;
}

function MainTabs() {
  return (
    <Tab.Navigator tabBar={(props) => <ReceiptCycleTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Records" component={TransactionsListScreen} options={{ tabBarLabel: "Records" }} />
      <Tab.Screen name="Analysis" component={InsightsScreen} options={{ tabBarLabel: "Analysis" }} />
      <Tab.Screen name="Budgets" component={BudgetsScreen} />
      <Tab.Screen name="Accounts" component={AccountsScreen} />
      <Tab.Screen name="Categories" component={CategoriesScreen} />
    </Tab.Navigator>
  );
}

function MainStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="AddTransaction" component={AddTransactionScreen} options={{ presentation: "modal" }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="ScanReceipt" component={ScanReceiptScreen} options={{ animation: "fade" }} />
      <Stack.Screen name="ScanReview" component={ScanReviewScreen} options={{ presentation: "card" }} />
      <Stack.Screen name="UploadStatement" component={UploadStatementScreen} options={{ presentation: "modal" }} />
      <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} options={{ presentation: "card" }} />
      <Stack.Screen name="CategoryBreakdown" component={CategoryBreakdownScreen} options={{ presentation: "card" }} />
      <Stack.Screen name="AccountDetail" component={AccountDetailScreen} options={{ presentation: "card" }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ presentation: "card" }} />
      <Stack.Screen name="GoogleDriveBackup" component={GoogleDriveBackupScreen} options={{ presentation: "card" }} />
      <Stack.Screen name="RegionalPreferences" component={RegionalPreferencesScreen} options={{ presentation: "card" }} />
      <Stack.Screen name="MerchantsVendors" component={MerchantsVendorsScreen} options={{ presentation: "card" }} />
      <Stack.Screen name="SavedLocations" component={SavedLocationsScreen} options={{ presentation: "card" }} />
      <Stack.Screen name="AccountSettings" component={AccountSettingsScreen} options={{ presentation: "card" }} />
      <Stack.Screen name="Pricing" component={PricingScreen} options={{ presentation: "card" }} />
    </Stack.Navigator>
  );
}

function AuthStackNavigator() {
  return (
    <AuthNav.Navigator screenOptions={{ headerShown: false }} initialRouteName="SignIn">
      <AuthNav.Screen name="SignIn" component={SignInScreen} />
      <AuthNav.Screen name="SignUp" component={SignUpScreen} />
      <AuthNav.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <AuthNav.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </AuthNav.Navigator>
  );
}

function onboardingUserKey(userId: string) {
  return `receiptcycle_onboarding_user_${userId}`;
}

function RootGate() {
  const { loading, user } = useAuth();
  const [gateReady, setGateReady] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setNeedsOnboarding(false);
      setGateReady(true);
      return;
    }
    setGateReady(false);
    void (async () => {
      try {
        const userKey = onboardingUserKey(user.id);
        let done = await AsyncStorage.getItem(userKey);
        if (done !== "1") {
          let v2 = await AsyncStorage.getItem(ONBOARDING_KEY);
          const legacy = await AsyncStorage.getItem(ONBOARDING_LEGACY);
          if (v2 !== "1" && legacy === "1") {
            await AsyncStorage.setItem(ONBOARDING_KEY, "1");
            v2 = "1";
          }
          if (v2 === "1") {
            await AsyncStorage.setItem(userKey, "1");
            done = "1";
          }
        }
        setNeedsOnboarding(done !== "1");
      } catch {
        setNeedsOnboarding(true);
      } finally {
        setGateReady(true);
      }
    })();
  }, [loading, user?.id]);

  if (loading || !gateReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return <AuthStackNavigator />;
  }

  if (needsOnboarding) {
    return (
      <OnboardingScreen
        onDone={async () => {
          try {
            await AsyncStorage.setItem(onboardingUserKey(user.id), "1");
            await AsyncStorage.setItem(ONBOARDING_KEY, "1");
          } catch {
            /* ignore */
          }
          setNeedsOnboarding(false);
        }}
      />
    );
  }

  return <MainStackNavigator />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ConvexProvider client={convex}>
        <AuthProvider>
          <WorkspaceProvider>
            <PreferencesProvider>
            <QueryClientProvider client={queryClient}>
              <ActionSheetProvider>
                <NavigationContainer ref={navigationRef}>
                  <PasswordResetDeepLinks />
                  <DriveBackupAppListener />
                  <RootGate />
                  <StatusBar style="dark" />
                </NavigationContainer>
              </ActionSheetProvider>
            </QueryClientProvider>
            </PreferencesProvider>
          </WorkspaceProvider>
        </AuthProvider>
      </ConvexProvider>
    </SafeAreaProvider>
  );
}
