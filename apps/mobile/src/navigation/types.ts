import type { ScannedExtracted } from "../types/transaction";

export type EntrySource = "camera" | "upload" | "manual";
export type ScanReviewParams = { scannedData: ScannedExtracted; source: Exclude<EntrySource, "manual"> };

export type MainTabParamList = {
  Records: undefined;
  Analysis: undefined;
  Budgets: undefined;
  Accounts: undefined;
  Categories: undefined;
};

export type RootStackParamList = {
  Main: { screen?: keyof MainTabParamList } | undefined;
  AddTransaction: { scannedData?: ScannedExtracted; transactionId?: string; source?: EntrySource } | undefined;
  TransactionDetail: { transactionId: string };
  CategoryBreakdown: { category: string };
  AccountDetail: { accountId: string };
  Notifications: undefined;
  ScanReceipt: undefined;
  UploadStatement: undefined;
  ScanReview: ScanReviewParams;
  Settings: undefined;
  GoogleDriveBackup: undefined;
  RegionalPreferences: undefined;
  MerchantsVendors: undefined;
  SavedLocations: undefined;
  AccountSettings: undefined;
  Pricing: undefined;
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token?: string } | undefined;
};
