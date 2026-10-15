export type CustomerStatus = "active" | "prospect" | "inactive";

export type SalesCustomer = {
  id: string;
  name: string;
  businessName: string;
  email: string;
  phone: string;
  billingAddress: string;
  taxId: string;
  notes: string;
  status: CustomerStatus;
  createdAt: string;
};

export type CatalogItemKind = "service" | "product";

export type CatalogItem = {
  id: string;
  kind: CatalogItemKind;
  name: string;
  description: string;
  unitPrice: number;
  taxRate: string;
  category: string;
  isDefault: boolean;
  active: boolean;
};

export type BusinessProfile = {
  logoUri: string | null;
  businessName: string;
  email: string;
  phone: string;
  address: string;
  taxId: string;
  website: string;
  /** A signature drawn on the phone: strokes of points (0..1) and the pad ratio. Printed on documents that ask for one. */
  signature?: { strokes: number[][][]; aspect: number } | null;
};

export type InvoiceSettings = {
  currency: string;
  dateFormat: string;
  invoicePrefix: string;
  defaultTaxRate: string;
  taxLabel: string;
  paymentTerms: string;
  defaultNotes: string;
  /** How printed invoices / estimates look. Missing values fall back to Standard, Teal and A4. */
  invoiceTemplate?: "standard" | "compact";
  invoiceColor?: string;
  estimateTemplate?: "standard" | "compact";
  estimateColor?: string;
  paperSize?: "a4" | "letter";
};

export type SalesSetupState = {
  customers: SalesCustomer[];
  items: CatalogItem[];
  businessProfile: BusinessProfile;
  invoiceSettings: InvoiceSettings;
  reminders: NotificationPreferences;
};

export type NotificationPreferences = {
  invoiceReminders: boolean;
  overdueReminders: boolean;
  paymentConfirmations: boolean;
  budgetAlerts: boolean;
  weeklyReports: boolean;
  marketingUpdates: boolean;
};

export const defaultSalesSetupState: SalesSetupState = {
  customers: [],
  items: [],
  businessProfile: {
    logoUri: null,
    businessName: "",
    email: "",
    phone: "",
    address: "",
    taxId: "",
    website: "",
  },
  invoiceSettings: {
    currency: "USD",
    dateFormat: "MM/DD/YYYY",
    invoicePrefix: "INV",
    defaultTaxRate: "8.25%",
    taxLabel: "Sales Tax",
    paymentTerms: "Net 30",
    defaultNotes: "Thank you for your business!",
  },
  reminders: { invoiceReminders: true, overdueReminders: true, paymentConfirmations: true, budgetAlerts: true, weeklyReports: false, marketingUpdates: true },
};

export function cloneDefaultSalesSetupState(): SalesSetupState {
  return JSON.parse(JSON.stringify(defaultSalesSetupState)) as SalesSetupState;
}
