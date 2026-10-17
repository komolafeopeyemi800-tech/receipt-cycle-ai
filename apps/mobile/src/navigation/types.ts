import type { ScannedExtracted } from "../types/transaction";

export type EntrySource = "camera" | "upload" | "manual";
/** `receiptUri` is where the photo is on this device; it is uploaded to private storage when the transaction is saved. */
export type ScanReviewParams = {
  scannedData: ScannedExtracted;
  source: Exclude<EntrySource, "manual">;
  receiptUri?: string;
  /** The original is already stored (documents API); the saved transaction links to this key. */
  receiptKey?: string;
};

export type MainTabParamList = {
  Home: undefined;
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
  BackupExport: undefined;
  DocumentStyle: { kind: "INVOICE" | "ESTIMATE" };
  Main:
    | {
        screen?: keyof MainTabParamList;
        params?: {
          screen?: keyof MoreStackParamList | keyof SalesStackParamList;
        };
      }
    | undefined;
  AddTransaction:
    | {
        scannedData?: ScannedExtracted;
        receiptUri?: string;
        receiptKey?: string;
        transactionId?: string;
        source?: EntrySource;
        initialType?: "expense" | "income";
        initialMode?: "ai";
        initialAiMode?: "Voice" | "Quick Text";
        initialAiText?: string;
      }
    | undefined;
  RecordsFilters: undefined;
  TransactionDetail: { transactionId: string };
  CategoryBreakdown: { category: string };
  AccountDetail: { accountId: string };
  BudgetSet: { category: string; month: string; kind: "expense" | "income" };
  BudgetDetail: { category: string; month: string; kind: "expense" | "income" };
  AccountForm: { accountId?: string } | undefined;
  CategoryEditor:
    | { categoryId?: string; initialKind?: "expense" | "income" }
    | undefined;
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
  EstimateSend: undefined;
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
  AllFeatures: undefined;
  PersonalProfile: undefined;
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
  CashFlowReport: undefined;
  OverdueInvoicesReport: undefined;
};
