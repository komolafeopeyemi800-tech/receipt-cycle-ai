/** Shapes returned by the Receipt Cycle API Worker (workers/api). Shared by web and mobile. */

/** Row ids are plain strings now (they were Convex `Id<"table">`). */
export type Id<_Table extends string = string> = string;

export type AuthUser = { id: string; email: string; name: string | null };
export type AuthResult = { token: string; user: AuthUser; isNewRegistration?: boolean };

/** Session arguments the old Convex calls carried; the client now sends its own bearer token. */
export type SessionArgs = { token?: string; sessionToken?: string; userId?: string };

export type EntrySource = "camera" | "upload" | "manual";

export type Transaction = {
  id: string;
  workspace: string;
  amount: number;
  type: string;
  category: string;
  merchant: string | null;
  date: string;
  description: string | null;
  payment_method: string | null;
  accountId: string | null;
  tags: string[] | null;
  is_recurring: boolean | null;
  receipt_url: string | null;
  receipt_data: unknown;
  created_at: string;
  updated_at: string;
};

export type TransactionFields = {
  workspace: string;
  amount: number;
  type: string;
  category: string;
  merchant?: string | null;
  date: string;
  description?: string | null;
  payment_method?: string | null;
  accountId?: string | null;
  tags?: string[] | null;
  is_recurring?: boolean | null;
  receipt_data?: unknown;
};

export type BulkRow = {
  amount: number;
  type: string;
  category: string;
  date: string;
  merchant?: string | null;
  description?: string | null;
  payment_method?: string | null;
};

export type Account = { id: string; name: string; balance: number; iconKey: string };
export type Category = { id: string; name: string; kind: "expense" | "income"; color: string };
export type Budget = { id: string; category: string; month: string; limitAmount: number };
export type WorkspaceSummary = { id: string; name: string; sub: "INDIVIDUAL" | "TEAM" };

export type DateFormat = "iso" | "us" | "eu";
export type Preferences = {
  userId?: string;
  currency: string;
  dateFormat: DateFormat;
  merchants: string[];
  locations: { id: string; label: string; address: string }[];
  reimbursements?: boolean | null;
  txnNumber?: boolean | null;
  scanPayment?: boolean | null;
  requirePay?: boolean | null;
  requireNotes?: boolean | null;
  voiceInputLanguage?: string | null;
};

export type SubscriptionState = {
  userId: string;
  pro: boolean;
  trialEndsAt: number;
  trialTimeActive: boolean;
  trialAddsUsed: number;
  trialAddsLimit: number;
  trialAddsRemaining: number;
  canCreateTransaction: boolean;
  canUseAiFeatures: boolean;
  canExportCsv: boolean;
  canEditOrDeleteTransaction: boolean;
  canMutateBudgets: boolean;
  viewOnlyLocked: boolean;
  phase: "pro" | "trial" | "trial_exhausted" | "expired";
  blockReason: string | null;
};

export type PublicConfig = {
  maintenanceMode: boolean;
  scannerEnabled: boolean;
  uploadEnabled: boolean;
  manualAddEnabled: boolean;
  exportEnabled: boolean;
  webDashboardEnabled: boolean;
  webTransactionsEnabled: boolean;
  webUploadEnabled: boolean;
  webSettingsEnabled: boolean;
  mobileScanPageEnabled: boolean;
  mobileUploadPageEnabled: boolean;
  mobileAddPageEnabled: boolean;
  adminManagedPreferences: boolean;
  prefReimbursements: boolean | null;
  prefTxnNumber: boolean | null;
  prefScanPayment: boolean | null;
  prefRequirePay: boolean | null;
  prefRequireNotes: boolean | null;
  freeCameraLimit: number;
  freeUploadLimit: number;
  freeManualLimit: number;
  updatedAt: number | null;
  updatedBy: string | null;
};

export type ConfigPatch = Partial<
  Omit<PublicConfig, "updatedAt" | "updatedBy" | "prefReimbursements" | "prefTxnNumber" | "prefScanPayment" | "prefRequirePay" | "prefRequireNotes">
> &
  Partial<{
    prefReimbursements: boolean;
    prefTxnNumber: boolean;
    prefScanPayment: boolean;
    prefRequirePay: boolean;
    prefRequireNotes: boolean;
  }>;

/** Admin calls need the dashboard secret (sent as a header); `adminEmail` is now taken from the session. */
export type AdminArgs = { secret: string; adminEmail?: string; actor?: string };

export type AdminStats = {
  totals: { users: number; transactions: number; whopUsers: number };
  growth: {
    users30: number;
    usersPrev30: number;
    userGrowthPct: number;
    activeUsers30: number;
    activeUsersPrev30: number;
    activeGrowthPct: number;
    tx30: number;
    txPrev30: number;
    txGrowthPct: number;
  };
  monthly: { month: string; users: number; transactions: number }[];
};

export type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  createdAt: number;
  googleLinked: boolean;
  whopLinked: boolean;
  plan: string;
  proSubscriptionActive: boolean;
  status: string;
  role: string;
  concurrentJobs: number;
};

export type AuditLog = { id: string; action: string; actor: string; details: string | null; createdAt: number };

// ---- AI --------------------------------------------------------------------

export type ScanExtracted = {
  merchant_name?: string;
  total_amount?: number;
  subtotal?: number | null;
  tax_amount?: number | null;
  date?: string;
  time?: string;
  payment_method?: string;
  category?: string;
  currency?: string;
  items?: { name?: string; quantity?: number; price?: number }[];
  document_type?: string;
  detected_languages?: string[];
  tags?: string[];
  formatted_receipt_text?: string;
  ocr_confidence?: string;
};

export type ScanResult = {
  success: boolean;
  extracted_data: ScanExtracted | null;
  error?: string;
  pipeline?: string;
  raw_data?: { warnings?: string[] };
};

export type LedgerRow = {
  date: string;
  amount: number;
  type: string;
  category: string;
  merchant?: string | null;
  description?: string | null;
};

export type VoiceHints = {
  expenseCategories?: string[];
  incomeCategories?: string[];
  accountNames?: string[];
};

export type TxDraft = {
  intent: "transaction" | "budget";
  amount: number | null;
  type: "expense" | "income";
  category: string;
  merchant: string | null;
  date: string | null;
  description: string | null;
  payment_method: string | null;
  confidence: "high" | "medium" | "low";
  budgetCategory: string | null;
  budgetLimit: number | null;
  budgetMonth: string | null;
};

export type Finding = { title: string; detail: string; severity: "low" | "medium" | "high" };

// ---- Uploads and receipts --------------------------------------------------

/** A file to upload: a Blob/File in the browser, or the `{ uri, name, type }` object React Native uses. */
export type UploadFile = Blob | { uri: string; name: string; type: string };

export type StatementRow = {
  date: string;
  amount: number;
  type: "expense" | "income";
  category: string;
  merchant?: string;
  description?: string;
  payment_method?: string;
};

export type StatementParseResult = {
  status: "ok" | "needs_ocr" | "unreadable" | "unsupported" | "too_large";
  fileType: string | null;
  rows: StatementRow[];
  totalRows: number;
  truncated: boolean;
  /** "heuristic" means no AI was used. */
  source: "heuristic" | "ai";
  aiCalls: number;
  warnings: string[];
  message?: string;
  needsOcr?: { pages: number[]; pageCount: number };
  sheets?: { name: string; rows: number }[];
  fileHash: string;
  fileName: string;
  /** True when this exact file was read before and the saved result was returned. */
  cached: boolean;
};

export type StoredReceipt = { key: string; size: number; contentType: string };
