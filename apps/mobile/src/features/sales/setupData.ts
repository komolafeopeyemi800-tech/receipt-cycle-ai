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
};

export type InvoiceSettings = {
  currency: string;
  dateFormat: string;
  invoicePrefix: string;
  defaultTaxRate: string;
  taxLabel: string;
  paymentTerms: string;
  defaultNotes: string;
};

export type SalesSetupState = {
  customers: SalesCustomer[];
  items: CatalogItem[];
  businessProfile: BusinessProfile;
  invoiceSettings: InvoiceSettings;
};

export const defaultSalesSetupState: SalesSetupState = {
  customers: [
    { id: "customer-acme", name: "Acme Corp", businessName: "Acme Corporation", email: "acme@corp.com", phone: "(415) 555-0101", billingAddress: "123 Market Street\nSan Francisco, CA 94103", taxId: "12-3456789", notes: "", status: "active", createdAt: "2024-01-15" },
    { id: "customer-xyz", name: "XYZ Media", businessName: "XYZ Media", email: "hello@xyzmedia.com", phone: "(628) 555-0142", billingAddress: "500 Howard Street\nSan Francisco, CA 94105", taxId: "", notes: "", status: "active", createdAt: "2024-08-06" },
    { id: "customer-bright", name: "Bright Co", businessName: "Bright Company", email: "team@brightco.com", phone: "(650) 555-0188", billingAddress: "80 Bay Road\nSan Mateo, CA 94401", taxId: "", notes: "", status: "active", createdAt: "2025-02-18" },
    { id: "customer-abc", name: "ABC Consulting", businessName: "ABC Consulting", email: "info@abcconsulting.com", phone: "(415) 555-0123", billingAddress: "44 Mission Street\nSan Francisco, CA 94105", taxId: "", notes: "", status: "active", createdAt: "2025-05-11" },
    { id: "customer-global", name: "Global Tech", businessName: "Global Tech", email: "contact@globaltech.com", phone: "(669) 555-0167", billingAddress: "12 Innovation Drive\nSan Jose, CA 95110", taxId: "", notes: "", status: "prospect", createdAt: "2026-07-22" },
    { id: "customer-walk-in", name: "Walk-In Customer", businessName: "", email: "", phone: "", billingAddress: "", taxId: "", notes: "Used for one-time counter sales.", status: "active", createdAt: "2024-01-01" },
  ],
  items: [
    { id: "item-consulting", kind: "service", name: "Consulting Services", description: "Business consulting and advisory", unitPrice: 150, taxRate: "Default", category: "Consulting", isDefault: true, active: true },
    { id: "item-design", kind: "service", name: "Design Work", description: "Graphic design and branding", unitPrice: 100, taxRate: "Default", category: "Design", isDefault: false, active: true },
    { id: "item-web", kind: "service", name: "Web Development", description: "Website development and maintenance", unitPrice: 135, taxRate: "Default", category: "Development", isDefault: false, active: true },
    { id: "item-marketing", kind: "service", name: "Marketing", description: "Digital marketing services", unitPrice: 120, taxRate: "Default", category: "Marketing", isDefault: false, active: true },
    { id: "item-project", kind: "service", name: "Project Management", description: "Project planning and management", unitPrice: 100, taxRate: "Default", category: "Management", isDefault: false, active: true },
    { id: "item-misc", kind: "service", name: "Miscellaneous", description: "Other services and expenses", unitPrice: 50, taxRate: "No tax", category: "Other", isDefault: false, active: true },
  ],
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
};

export function cloneDefaultSalesSetupState(): SalesSetupState {
  return JSON.parse(JSON.stringify(defaultSalesSetupState)) as SalesSetupState;
}
