import type { ScannedExtracted } from "../types/transaction";

export type EntrySource = "camera" | "upload" | "manual";
/** `receiptUri` is where the photo is on this device; it is uploaded to private storage when the transaction is saved. */
export type ScanReviewParams = { scannedData: ScannedExtracted; source: Exclude<EntrySource, "manual">; receiptUri?: string };

export type MainTabParamList = {
  Records: undefined;
  Analysis: undefined;
  Sales: undefined;
  More: undefined;
};

export type MoreStackParamList = {
  MoreHome: undefined;
  Budgets: undefined;
  Accounts: undefined;
  Categories: undefined;
};

export type SalesStackParamList = {
  SalesHome: undefined;
  SalesInvoices: undefined;
  SalesEstimates: undefined;
  SalesPayments: undefined;
  SalesReports: undefined;
  SalesCustomers: undefined;
  SalesItems: undefined;
};

export type RootStackParamList = {
  Main: { screen?: keyof MainTabParamList; params?: { screen?: keyof MoreStackParamList | keyof SalesStackParamList } } | undefined;
  AddTransaction: { scannedData?: ScannedExtracted; receiptUri?: string; transactionId?: string; source?: EntrySource; initialType?: "expense" | "income"; initialMode?: "ai" } | undefined;
  RecordsFilters: undefined;
  TransactionDetail: { transactionId: string };
  CategoryBreakdown: { category: string };
  AccountDetail: { accountId: string };
  BudgetSet: { category: string; month: string; kind: "expense" | "income" };
  BudgetDetail: { category: string; month: string; kind: "expense" | "income" };
  AccountForm: { accountId?: string } | undefined;
  CategoryEditor: { categoryId?: string; initialKind?: "expense" | "income" } | undefined;
  SalesCustomerDetail: { customerId: string };
  SalesCustomerForm: { customerId?: string } | undefined;
  SalesItemForm: { itemId?: string } | undefined;
  BusinessProfile: undefined;
  InvoiceSettings: undefined;
  InvoiceCreate: undefined;
  InvoiceLineItem: undefined;
  InvoiceDiscountTax: undefined;
  InvoiceExtras: undefined;
  InvoicePreview: undefined;
  InvoiceSend: undefined;
  EstimateCreate: undefined;
  EstimateItems: undefined;
  EstimateTotals: undefined;
  EstimateExtras: undefined;
  EstimatePreview: undefined;
  EstimateDetail: { estimateNumber: string };
  EstimateConvert: { estimateNumber: string; invoiceNumber: string };
  PaymentCreate: undefined;
  PaymentMethod: undefined;
  PaymentInvoiceDetail: { invoiceNumber: string };
  PaymentConfirmation: { paymentId: string };
  ReceiptPreview: { paymentId: string };
  ReceiptShare: { paymentId: string };
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
  FinanceCoach: undefined;
  CashFlowReport: undefined;
  OverdueInvoicesReport: undefined;
};
