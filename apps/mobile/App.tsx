import { useEffect, useState } from "react";
import { ActivityIndicator, AppState, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import { StatusBar } from "expo-status-bar";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { QueryClient, QueryClientProvider, focusManager } from "@tanstack/react-query";
import { ApiProvider } from "./src/lib/api";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { apiClient } from "./src/lib/apiClient";
import { ReceiptCycleTabBar } from "./src/components/ReceiptCycleTabBar";
import { TransactionsListScreen } from "./src/screens/TransactionsListScreen";
import { RecordsFiltersScreen } from "./src/screens/RecordsFiltersScreen";
import { RecordsFilterProvider } from "./src/contexts/RecordsFilterContext";
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
import { MoneyAppearanceProvider } from "./src/contexts/MoneyAppearanceContext";
import { SalesSetupProvider } from "./src/contexts/SalesSetupContext";
import { InvoiceFlowProvider } from "./src/contexts/InvoiceFlowContext";
import { EstimateFlowProvider } from "./src/contexts/EstimateFlowContext";
import { PaymentFlowProvider } from "./src/contexts/PaymentFlowContext";
import { RegionalPreferencesScreen } from "./src/screens/RegionalPreferencesScreen";
import { MerchantsVendorsScreen } from "./src/screens/MerchantsVendorsScreen";
import { SavedLocationsScreen } from "./src/screens/SavedLocationsScreen";
import { BudgetsScreen } from "./src/screens/BudgetsScreen";
import { AccountsScreen } from "./src/screens/AccountsScreen";
import { CategoriesScreen } from "./src/screens/CategoriesScreen";
import { BudgetSetScreen } from "./src/screens/BudgetSetScreen";
import { BudgetDetailScreen } from "./src/screens/BudgetDetailScreen";
import { AccountFormScreen } from "./src/screens/AccountFormScreen";
import { CategoryEditorScreen } from "./src/screens/CategoryEditorScreen";
import { SalesHubScreen } from "./src/screens/SalesScreens";
import { EstimateListScreen } from "./src/screens/EstimateListScreen";
import { EstimateBasicScreen, EstimateExtrasScreen, EstimateItemsScreen, EstimateTotalsScreen } from "./src/screens/EstimateBuilderScreens";
import { EstimateConvertScreen, EstimateDetailScreen, EstimatePreviewScreen } from "./src/screens/EstimateReviewScreens";
import { PaymentListScreen } from "./src/screens/PaymentListScreen";
import { PaymentCreateScreen, PaymentMethodScreen } from "./src/screens/PaymentEntryScreens";
import { PaymentConfirmationScreen, PaymentInvoiceDetailScreen, ReceiptPreviewScreen, ReceiptShareScreen } from "./src/screens/PaymentReviewScreens";
import { InvoiceListScreen } from "./src/screens/InvoiceListScreen";
import { InvoiceBasicScreen } from "./src/screens/InvoiceBasicScreen";
import { InvoiceLineItemScreen } from "./src/screens/InvoiceLineItemScreen";
import { InvoiceDiscountTaxScreen, InvoiceExtrasScreen } from "./src/screens/InvoiceDetailsScreens";
import { InvoicePreviewScreen, InvoiceSendScreen } from "./src/screens/InvoiceReviewScreens";
import { CustomerDetailScreen, CustomerFormScreen, CustomersScreen } from "./src/screens/CustomerScreens";
import { ItemServiceFormScreen, ItemsServicesScreen } from "./src/screens/CatalogScreens";
import { BusinessProfileScreen, InvoiceSettingsScreen } from "./src/screens/BusinessSetupScreens";
import { MoreHubScreen } from "./src/screens/MoreHubScreen";
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
import { FinanceCoachScreen } from "./src/screens/FinanceCoachScreen";
import { CashFlowReportScreen, OverdueInvoicesReportScreen, ReportsHomeScreen } from "./src/screens/ReportsScreens";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { colors } from "./src/theme/tokens";
import type { RootStackParamList } from "./src/navigation/types";

/** v2: 7-step flow aligned with web onboarding */
const ONBOARDING_KEY = "receiptcycle_onboarding_v2";
/** Legacy: first mobile onboarding flag — migrate so existing users aren’t forced through v2 again */
const ONBOARDING_LEGACY = "receiptcycle_onboarding_v1";

const queryClient = new QueryClient();

// Refetch when the app returns to the foreground (React Native has no window focus event).
focusManager.setEventListener((handleFocus) => {
  const sub = AppState.addEventListener("change", (state) => handleFocus(state === "active"));
  return () => sub.remove();
});
const Stack = createNativeStackNavigator();
const AuthNav = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const SalesStack = createNativeStackNavigator();
const MoreStack = createNativeStackNavigator();

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

type CheckoutTarget = "Records" | "Analysis" | "Budgets" | "Accounts" | "Categories";

function extractCheckoutTargetFromUrl(url: string): CheckoutTarget | null {
  if (!url.includes("post-checkout") && !url.includes("dashboard")) return null;
  try {
    const q = url.indexOf("?");
    const search = q >= 0 ? url.slice(q + 1) : "";
    const screen = new URLSearchParams(search).get("screen");
    if (screen === "Analysis" || screen === "Budgets" || screen === "Accounts" || screen === "Categories") {
      return screen;
    }
    return "Records";
  } catch {
    return "Records";
  }
}

function navigateToResetIfNeeded(url: string | null) {
  if (!url) return;
  const token = extractResetTokenFromUrl(url);
  if (!token || !navigationRef.isReady()) return;
  navigationRef.navigate("ResetPassword", { token });
}

function navigateAfterCheckoutIfNeeded(url: string | null) {
  if (!url || !navigationRef.isReady()) return;
  const target = extractCheckoutTargetFromUrl(url);
  if (!target) return;
  if (target === "Budgets" || target === "Accounts" || target === "Categories") {
    navigationRef.navigate("Main", { screen: "More", params: { screen: target } });
  } else {
    navigationRef.navigate("Main", { screen: target });
  }
}

function PasswordResetDeepLinks() {
  const { user, loading } = useAuth();
  /** Post-checkout deep links must run even when signed in; password reset only on the guest stack. */
  useEffect(() => {
    if (loading) return;
    void Linking.getInitialURL().then((url) => {
      if (!url) return;
      navigateAfterCheckoutIfNeeded(url);
      if (!user) navigateToResetIfNeeded(url);
    });
  }, [loading, user]);

  useEffect(() => {
    const sub = Linking.addEventListener("url", (e) => {
      navigateAfterCheckoutIfNeeded(e.url);
      if (!user) navigateToResetIfNeeded(e.url);
    });
    return () => sub.remove();
  }, [user]);
  return null;
}

function SalesNavigator() {
  return <SalesStack.Navigator screenOptions={{ headerShown: false }}>
    <SalesStack.Screen name="SalesHome" component={SalesHubScreen} />
    <SalesStack.Screen name="SalesInvoices" component={InvoiceListScreen} />
    <SalesStack.Screen name="SalesEstimates" component={EstimateListScreen} />
    <SalesStack.Screen name="SalesPayments" component={PaymentListScreen} />
    <SalesStack.Screen name="SalesReports" component={ReportsHomeScreen} />
    <SalesStack.Screen name="SalesCustomers" component={CustomersScreen} />
    <SalesStack.Screen name="SalesItems" component={ItemsServicesScreen} />
  </SalesStack.Navigator>;
}

function MoreNavigator() {
  return <MoreStack.Navigator screenOptions={{ headerShown: false }}>
    <MoreStack.Screen name="MoreHome" component={MoreHubScreen} />
    <MoreStack.Screen name="Budgets" component={BudgetsScreen} />
    <MoreStack.Screen name="Accounts" component={AccountsScreen} />
    <MoreStack.Screen name="Categories" component={CategoriesScreen} />
  </MoreStack.Navigator>;
}

function MainTabs() {
  return (
    <Tab.Navigator tabBar={(props) => <ReceiptCycleTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Records" component={TransactionsListScreen} options={{ tabBarLabel: "Records" }} />
      <Tab.Screen name="Analysis" component={InsightsScreen} options={{ tabBarLabel: "Analysis" }} />
      <Tab.Screen name="Sales" component={SalesNavigator} />
      <Tab.Screen name="More" component={MoreNavigator} />
    </Tab.Navigator>
  );
}

function MainStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="AddTransaction" component={AddTransactionScreen} options={{ presentation: "modal" }} />
      <Stack.Screen name="RecordsFilters" component={RecordsFiltersScreen} options={{ presentation: "card" }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="ScanReceipt" component={ScanReceiptScreen} options={{ animation: "fade" }} />
      <Stack.Screen name="ScanReview" component={ScanReviewScreen} options={{ presentation: "card" }} />
      <Stack.Screen name="UploadStatement" component={UploadStatementScreen} options={{ presentation: "modal" }} />
      <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} options={{ presentation: "card" }} />
      <Stack.Screen name="CategoryBreakdown" component={CategoryBreakdownScreen} options={{ presentation: "card" }} />
      <Stack.Screen name="AccountDetail" component={AccountDetailScreen} options={{ presentation: "card" }} />
      <Stack.Screen name="BudgetSet" component={BudgetSetScreen} options={{ presentation: "card" }} />
      <Stack.Screen name="BudgetDetail" component={BudgetDetailScreen} options={{ presentation: "card" }} />
      <Stack.Screen name="AccountForm" component={AccountFormScreen} options={{ presentation: "card" }} />
      <Stack.Screen name="CategoryEditor" component={CategoryEditorScreen} options={{ presentation: "card" }} />
      <Stack.Screen name="SalesCustomerDetail" component={CustomerDetailScreen} options={{ presentation: "card" }} />
      <Stack.Screen name="SalesCustomerForm" component={CustomerFormScreen} options={{ presentation: "card" }} />
      <Stack.Screen name="SalesItemForm" component={ItemServiceFormScreen} options={{ presentation: "card" }} />
      <Stack.Screen name="BusinessProfile" component={BusinessProfileScreen} options={{ presentation: "card" }} />
      <Stack.Screen name="InvoiceSettings" component={InvoiceSettingsScreen} options={{ presentation: "card" }} />
      <Stack.Screen name="InvoiceCreate" component={InvoiceBasicScreen} options={{ presentation: "card" }} />
      <Stack.Screen name="InvoiceLineItem" component={InvoiceLineItemScreen} options={{ presentation: "card" }} />
      <Stack.Screen name="InvoiceDiscountTax" component={InvoiceDiscountTaxScreen} options={{ presentation: "card" }} />
      <Stack.Screen name="InvoiceExtras" component={InvoiceExtrasScreen} options={{ presentation: "card" }} />
      <Stack.Screen name="InvoicePreview" component={InvoicePreviewScreen} options={{ presentation: "card" }} />
      <Stack.Screen name="InvoiceSend" component={InvoiceSendScreen} options={{ presentation: "card" }} />
      <Stack.Screen name="EstimateCreate" component={EstimateBasicScreen} options={{ presentation: "card" }} />
      <Stack.Screen name="EstimateItems" component={EstimateItemsScreen} options={{ presentation: "card" }} />
      <Stack.Screen name="EstimateTotals" component={EstimateTotalsScreen} options={{ presentation: "card" }} />
      <Stack.Screen name="EstimateExtras" component={EstimateExtrasScreen} options={{ presentation: "card" }} />
      <Stack.Screen name="EstimatePreview" component={EstimatePreviewScreen} options={{ presentation: "card" }} />
      <Stack.Screen name="EstimateDetail" component={EstimateDetailScreen} options={{ presentation: "card" }} />
      <Stack.Screen name="EstimateConvert" component={EstimateConvertScreen} options={{ presentation: "card" }} />
      <Stack.Screen name="PaymentCreate" component={PaymentCreateScreen} options={{ presentation: "card" }} />
      <Stack.Screen name="PaymentMethod" component={PaymentMethodScreen} options={{ presentation: "card" }} />
      <Stack.Screen name="PaymentInvoiceDetail" component={PaymentInvoiceDetailScreen} options={{ presentation: "card" }} />
      <Stack.Screen name="PaymentConfirmation" component={PaymentConfirmationScreen} options={{ presentation: "card" }} />
      <Stack.Screen name="ReceiptPreview" component={ReceiptPreviewScreen} options={{ presentation: "card" }} />
      <Stack.Screen name="ReceiptShare" component={ReceiptShareScreen} options={{ presentation: "card" }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ presentation: "card" }} />
      <Stack.Screen name="GoogleDriveBackup" component={GoogleDriveBackupScreen} options={{ presentation: "card" }} />
      <Stack.Screen name="RegionalPreferences" component={RegionalPreferencesScreen} options={{ presentation: "card" }} />
      <Stack.Screen name="MerchantsVendors" component={MerchantsVendorsScreen} options={{ presentation: "card" }} />
      <Stack.Screen name="SavedLocations" component={SavedLocationsScreen} options={{ presentation: "card" }} />
      <Stack.Screen name="AccountSettings" component={AccountSettingsScreen} options={{ presentation: "card" }} />
      <Stack.Screen name="Pricing" component={PricingScreen} options={{ presentation: "card" }} />
      <Stack.Screen name="FinanceCoach" component={FinanceCoachScreen} options={{ presentation: "card" }} />
      <Stack.Screen name="CashFlowReport" component={CashFlowReportScreen} options={{ presentation: "card" }} />
      <Stack.Screen name="OverdueInvoicesReport" component={OverdueInvoicesReportScreen} options={{ presentation: "card" }} />
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
      <QueryClientProvider client={queryClient}>
        <ApiProvider client={apiClient}>
          <AuthProvider>
          <WorkspaceProvider>
            <PreferencesProvider>
              <MoneyAppearanceProvider>
                <SalesSetupProvider>
                  <InvoiceFlowProvider>
                    <EstimateFlowProvider>
                      <PaymentFlowProvider>
                        <RecordsFilterProvider>
                          <ActionSheetProvider>
                            <NavigationContainer ref={navigationRef}>
                              <PasswordResetDeepLinks />
                              <DriveBackupAppListener />
                              <RootGate />
                              <StatusBar style="dark" />
                            </NavigationContainer>
                          </ActionSheetProvider>
                        </RecordsFilterProvider>
                      </PaymentFlowProvider>
                    </EstimateFlowProvider>
                  </InvoiceFlowProvider>
                </SalesSetupProvider>
              </MoneyAppearanceProvider>
            </PreferencesProvider>
          </WorkspaceProvider>
          </AuthProvider>
        </ApiProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
