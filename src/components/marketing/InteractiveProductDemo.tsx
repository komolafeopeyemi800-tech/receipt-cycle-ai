import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { homeWorkflowDemo, homeWorkflowStages } from "@/data/homeWorkflowDemo";
import "./InteractiveProductDemo.css";

type SceneId = "capture" | "transactions" | "billing" | "budgeting" | "payments";

const SCENES: Array<{ id: SceneId; label: string; title: string; description: string; icon: string; phases: number }> = [
  { id: "capture", label: "Capture", title: "Turn receipts into usable records", description: "Upload a receipt, review the extracted details, and save it with its source attached.", icon: "fa-wand-magic-sparkles", phases: 3 },
  { id: "transactions", label: "Transactions", title: "Keep every purchase in context", description: "Filter the ledger, open a transaction, and inspect its receipt and extracted details together.", icon: "fa-arrow-right-arrow-left", phases: 3 },
  { id: "billing", label: "Invoices & estimates", title: "Create documents your way", description: "Switch document type, layout, colour, and settings while the preview updates instantly.", icon: "fa-file-invoice-dollar", phases: 4 },
  { id: "budgeting", label: "Budgets", title: "Know where the plan stands", description: "See a new expense update its category, then inspect every budget in more detail.", icon: "fa-bullseye", phases: 2 },
  { id: "payments", label: "Payments & reminders", title: "Follow every balance and next step", description: "Filter by status, open a client, and review invoice, payment, and reminder activity.", icon: "fa-bell", phases: 3 },
];

const RECEIPT = { ...homeWorkflowDemo.receipt, account: homeWorkflowDemo.receipt.paymentMethod };

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}

function ProductSidebar({ scene, onNavigate }: { scene: SceneId; onNavigate: (scene: SceneId) => void }) {
  const nav = [
    ["capture", "fa-camera", "Capture"],
    ["transactions", "fa-arrow-right-arrow-left", "Transactions"],
    ["billing", "fa-file-invoice", "Invoices & estimates"],
    ["budgeting", "fa-bullseye", "Budgets"],
    ["payments", "fa-bell", "Payments & reminders"],
  ] as const;
  return <aside className="rc-demo-sidebar" aria-label="Demo workspace navigation">
    <div className="rc-demo-sidebar-brand"><img src="/icon-512.png" alt="" /><span>Receipt Cycle</span></div>
    <nav>{nav.map(([id, icon, label]) => <button key={id} type="button" className={`rc-demo-nav-item ${scene === id ? "is-active" : ""}`} onClick={() => onNavigate(id)} aria-current={scene === id ? "page" : undefined}><i className={`fas ${icon}`} aria-hidden="true" /><span>{label}</span></button>)}</nav>
    <div className="rc-demo-sidebar-footer"><i className="fas fa-gear" /><span>Settings</span></div>
  </aside>;
}

function DemoTopbar({ title }: { title: string }) {
  return <div className="rc-demo-topbar"><div><p>Demo workspace</p><strong>{title}</strong></div><div className="rc-demo-topbar-actions" aria-hidden="true"><span><i className="fas fa-magnifying-glass" /></span><span><i className="far fa-bell" /></span><span className="rc-demo-avatar">AM</span></div></div>;
}

function CaptureScene({ phase, reducedMotion, onSaved }: { phase: number; reducedMotion: boolean; onSaved: () => void }) {
  const processing = phase === 1 && !reducedMotion;
  const complete = phase >= 2 || reducedMotion;
  return <div className="rc-demo-scene rc-demo-capture">
    <div className="rc-demo-scene-heading"><div><span>Capture</span><h3>Review receipt</h3></div><span className={`rc-demo-status ${complete ? "is-complete" : ""}`}><i className={`fas ${complete ? "fa-circle-check" : "fa-wand-magic-sparkles"}`} />{complete ? "Ready to review" : processing ? "Extracting details" : "Receipt uploaded"}</span></div>
    <div className="rc-demo-capture-grid"><div className={`rc-demo-receipt-stage ${processing ? "is-scanning" : ""}`}><span className="rc-demo-file-chip"><i className="far fa-image" /> oak-street-grill.jpg</span><img className="rc-demo-receipt" src={RECEIPT.asset} width="520" height="940" alt="Fictional Oak Street Grill receipt showing a $21.70 total" />{processing ? <span className="rc-demo-scan-line" aria-hidden="true" /> : null}<span className="rc-demo-source-note"><i className="fas fa-paperclip" /> Source attached</span></div>
      <div className={`rc-demo-extract-card ${complete ? "is-complete" : ""}`}><div className="rc-demo-panel-title"><div><span className="rc-demo-icon"><i className="fas fa-wand-magic-sparkles" /></span><div><strong>Extracted details</strong><small>Check before saving</small></div></div><span>{complete ? "5 fields" : "Reading"}</span></div>{[["Merchant", RECEIPT.merchant], ["Date", RECEIPT.displayDate], ["Total", money(RECEIPT.total)], ["Category", RECEIPT.category], ["Account", RECEIPT.account]].map(([label, value], index) => <div key={label} className="rc-demo-field" style={{ transitionDelay: complete ? `${index * 70}ms` : "0ms" }}><span>{label}</span><strong>{complete ? value : ""}</strong></div>)}<button type="button" className="rc-demo-save-button" onClick={onSaved} disabled={!complete}><i className="fas fa-circle-check" /> Save transaction</button></div>
    </div>
  </div>;
}

type DocumentKind = "receipt" | "invoice" | "statement";
type TransactionLine = { label: string; amount: number };
type Transaction = {
  id: string;
  merchant: string;
  category: string;
  date: string;
  amount: number;
  account: string;
  kind: DocumentKind;
  filename: string;
  address: string;
  subtotal: number;
  tax: number;
  tip?: number;
  mark: string;
  tone: string;
  /** Official brand logo (see public/brand-logos). Brands without one fall back to an initials tile. */
  logo?: string;
  logoName?: string;
  lineItems: TransactionLine[];
};

const TRANSACTIONS: Transaction[] = [
  { id: "oak", merchant: RECEIPT.merchant, category: RECEIPT.category, date: "Oct 17, 2026 · 12:42 PM", amount: RECEIPT.total, account: "Visa •••• 2841", kind: "receipt", filename: "oak-street-grill.jpg", address: "118 Oak Street, Fairview, USA 10018", subtotal: RECEIPT.subtotal, tax: RECEIPT.tax, tip: RECEIPT.tip, mark: "OG", tone: "#8b4513", lineItems: RECEIPT.lineItems.map(item => ({ label: item.label, amount: item.amount })) },
  { id: "fedex", merchant: "FedEx", category: "Shipping", date: "Oct 16, 2026 · 2:35 PM", amount: 20.3, account: "Business card •••• 0614", kind: "receipt", filename: "fedex-shipping.jpg", address: "Ship center, Fairview, USA 10018", subtotal: 20.3, tax: 0, mark: "FX", tone: "#4d148c", logo: "/brand-logos/fedex.svg", logoName: "FedEx", lineItems: [{ label: "Ground shipping · 2 lb", amount: 18.45 }, { label: "Fuel surcharge", amount: 1.85 }] },
  { id: "shell", merchant: "Shell", category: "Transport", date: "Oct 16, 2026 · 8:18 AM", amount: 54.2, account: "Business card •••• 0614", kind: "receipt", filename: "shell-fuel.jpg", address: "72 Northway Drive, Fairview, USA 10018", subtotal: 50.65, tax: 3.55, mark: "SH", tone: "#dd1d21", logo: "/brand-logos/shell.svg", logoName: "Shell", lineItems: [{ label: "Regular fuel · 12.91 gal", amount: 50.65 }] },
  { id: "brightgrid", merchant: "BrightGrid Electric", category: "Utilities", date: "Oct 15, 2026", amount: 118.64, account: "Bank •••• 9082", kind: "receipt", filename: "brightgrid-electric.pdf", address: "Service: 24 Sample Avenue, Portland, OR", subtotal: 110.78, tax: 7.86, mark: "BG", tone: "#8a5d00", lineItems: [{ label: "Electric service · Sep 15–Oct 14", amount: 96.4 }, { label: "Grid delivery", amount: 14.38 }] },
  { id: "target", merchant: "Target", category: "Groceries", date: "Oct 14, 2026 · 6:06 PM", amount: 86.35, account: "Visa •••• 2841", kind: "receipt", filename: "target-groceries.jpg", address: "405 Garden Lane, Fairview, USA 10018", subtotal: 80.46, tax: 5.89, mark: "TG", tone: "#cc0000", logo: "/brand-logos/target.svg", logoName: "Target", lineItems: [{ label: "Fresh produce", amount: 29.82 }, { label: "Pantry items", amount: 28.64 }, { label: "Household supplies", amount: 22 }] },
  { id: "starbucks", merchant: "Starbucks", category: "Meals", date: "Oct 14, 2026 · 8:52 AM", amount: 10.17, account: "Visa •••• 2841", kind: "receipt", filename: "starbucks-coffee.jpg", address: "19 Main Street, Fairview, USA 10018", subtotal: 9.4, tax: 0.77, mark: "SB", tone: "#006241", logo: "/brand-logos/starbucks.svg", logoName: "Starbucks", lineItems: [{ label: "Caffè latte · Grande", amount: 5.45 }, { label: "Butter croissant", amount: 3.95 }] },
  { id: "staples", merchant: "Staples", category: "Office supplies", date: "Oct 13, 2026 · 11:20 AM", amount: 40.57, account: "Business card •••• 0614", kind: "receipt", filename: "staples-office.jpg", address: "230 Commerce Road, Fairview, USA 10018", subtotal: 37.48, tax: 3.09, mark: "ST", tone: "#cc0000", logo: "/brand-logos/staples.svg", logoName: "Staples", lineItems: [{ label: "Copy paper · 5 ream case", amount: 24.99 }, { label: "Gel pens · 12 pack", amount: 12.49 }] },
  { id: "cloudnest", merchant: "CloudNest Workspace", category: "Software", date: "Oct 12, 2026", amount: 32, account: "Visa •••• 2841", kind: "invoice", filename: "cloudnest-invoice-1048.pdf", address: "CloudNest Software · 88 Market Square, Austin, TX", subtotal: 30, tax: 2, mark: "CN", tone: "#6555d8", lineItems: [{ label: "Workspace Pro · monthly plan", amount: 30 }] },
  { id: "horizon", merchant: "Horizon Community Bank", category: "Banking", date: "Oct 1–17, 2026", amount: 4385.62, account: "Business checking •••• 9082", kind: "statement", filename: "horizon-bank-statement-oct.pdf", address: "100 Harbor Plaza, Fairview, USA 10018", subtotal: 4210.82, tax: 0, mark: "HB", tone: "#17689a", lineItems: [{ label: "Opening balance", amount: 4210.82 }, { label: "Deposits", amount: 2400 }, { label: "Withdrawals", amount: -2225.2 }] },
];

const transactionFilters: Array<{ label: string; value: "all" | DocumentKind }> = [
  { label: "All", value: "all" },
  { label: "Receipts", value: "receipt" },
  { label: "Invoices", value: "invoice" },
  { label: "Statements", value: "statement" },
];

function DocumentBrand({ transaction }: { transaction: Transaction }) {
  if (transaction.logo) return <span className="rc-demo-document-brand has-logo"><img src={transaction.logo} alt={`${transaction.logoName ?? transaction.merchant} logo`} loading="lazy" decoding="async" width="29" height="29" /></span>;
  return <span className="rc-demo-document-brand" style={{ "--brand-tone": transaction.tone } as CSSProperties} aria-hidden="true">{transaction.mark}</span>;
}

type StatementEntry = { date: string; description: string; deposit?: number; withdrawal?: number };
const STATEMENT_OPENING = 4210.82;
const STATEMENT_ENTRIES: StatementEntry[] = [
  { date: "10/02", description: "Deposit · Sample Client LLC INV-2026-014", deposit: 1400 },
  { date: "10/03", description: "ACH debit · Fairview Studio Lease", withdrawal: 1200 },
  { date: "10/08", description: "Wire transfer in · Northline Studio", deposit: 1000 },
  { date: "10/10", description: "Card payment · Visa Business ending 2841", withdrawal: 874.56 },
  { date: "10/12", description: "Recurring card · CloudNest Workspace", withdrawal: 32 },
  { date: "10/15", description: "ACH debit · BrightGrid Electric", withdrawal: 118.64 },
];
const cents = (value: number) => Math.round(value * 100);
const STATEMENT_DEPOSITS = STATEMENT_ENTRIES.reduce((sum, entry) => sum + cents(entry.deposit ?? 0), 0) / 100;
const STATEMENT_WITHDRAWALS = STATEMENT_ENTRIES.reduce((sum, entry) => sum + cents(entry.withdrawal ?? 0), 0) / 100;
const STATEMENT_CLOSING = (cents(STATEMENT_OPENING) + cents(STATEMENT_DEPOSITS) - cents(STATEMENT_WITHDRAWALS)) / 100;

function StatementDocument() {
  let running = cents(STATEMENT_OPENING);
  const lines = STATEMENT_ENTRIES.map(entry => { running += cents(entry.deposit ?? 0) - cents(entry.withdrawal ?? 0); return { ...entry, balance: running / 100 }; });
  return <div className="rc-doc-wrap"><div className="rc-doc rc-doc-statement" role="img" aria-label={`Fictional Horizon Community Bank business checking statement. Opening balance ${money(STATEMENT_OPENING)}, deposits ${money(STATEMENT_DEPOSITS)}, withdrawals ${money(STATEMENT_WITHDRAWALS)}, closing balance ${money(STATEMENT_CLOSING)}`}>
    <div className="rc-doc-bankhead"><div className="rc-doc-bankname"><span className="rc-doc-bankmark">H</span><strong>Horizon<br />Community Bank</strong></div><div className="rc-doc-bankmeta"><b>Business Checking Statement</b><span>October 1, 2026 through October 17, 2026</span><span>Page 1 of 2</span></div></div>
    <div className="rc-doc-addressrow"><address>SAMPLE STUDIO LLC<br />24 SAMPLE AVENUE<br />PORTLAND OR 97201</address><dl><div><dt>Account number</dt><dd>XXXXXX9082</dd></div><div><dt>Customer service</dt><dd>1-800-555-0142</dd></div></dl></div>
    <div className="rc-doc-summarybox"><h6>Account summary</h6><dl><div><dt>Beginning balance on October 1</dt><dd>{money(STATEMENT_OPENING)}</dd></div><div><dt>Deposits and other credits</dt><dd>{money(STATEMENT_DEPOSITS)}</dd></div><div><dt>Withdrawals and other debits</dt><dd>-{money(STATEMENT_WITHDRAWALS)}</dd></div><div><dt>Service fees</dt><dd>{money(0)}</dd></div><div className="rc-doc-summarytotal"><dt>Ending balance on October 17</dt><dd>{money(STATEMENT_CLOSING)}</dd></div></dl></div>
    <h6 className="rc-doc-sectionhead">Transaction detail</h6>
    <table><thead><tr><th>Date</th><th>Description</th><th>Deposits</th><th>Withdrawals</th><th>Balance</th></tr></thead><tbody><tr><td>10/01</td><td>Beginning balance</td><td /><td /><td>{money(STATEMENT_OPENING)}</td></tr>{lines.map(line => <tr key={line.date + line.description}><td>{line.date}</td><td>{line.description}</td><td>{line.deposit ? money(line.deposit) : ""}</td><td>{line.withdrawal ? money(line.withdrawal) : ""}</td><td>{money(line.balance)}</td></tr>)}<tr className="rc-doc-totalrow"><td /><td>Totals</td><td>{money(STATEMENT_DEPOSITS)}</td><td>{money(STATEMENT_WITHDRAWALS)}</td><td>{money(STATEMENT_CLOSING)}</td></tr></tbody></table>
    <p className="rc-doc-fineprint">Please review this statement and report any errors within 30 days. Member FDIC. Fictional sample created for demonstration only.</p>
  </div></div>;
}

const INVOICE_LINES = [{ description: "Workspace Pro · monthly plan", detail: "Oct 12, 2026 to Nov 11, 2026", quantity: 1, unitPrice: 30 }];
const INVOICE_TAX = 2;

function SourceInvoiceDocument() {
  const subtotal = INVOICE_LINES.reduce((sum, line) => sum + cents(line.unitPrice) * line.quantity, 0) / 100;
  const total = (cents(subtotal) + cents(INVOICE_TAX)) / 100;
  return <div className="rc-doc-wrap"><div className="rc-doc rc-doc-invoice" role="img" aria-label={`Fictional CloudNest Workspace PDF invoice CN-1048, total ${money(total)}, paid`}>
    <div className="rc-doc-invhead"><div><h6>Invoice</h6><dl><div><dt>Invoice number</dt><dd>CN-1048</dd></div><div><dt>Date of issue</dt><dd>October 12, 2026</dd></div><div><dt>Date paid</dt><dd>October 12, 2026</dd></div></dl></div><span className="rc-doc-invmark">CN</span></div>
    <div className="rc-doc-parties"><address><b>CloudNest Software, Inc.</b><br />88 Market Square<br />Austin, TX 78701<br />billing@cloudnest.example</address><address><b>Bill to</b><br />Sample Studio LLC<br />24 Sample Avenue<br />Portland, OR 97201</address></div>
    <p className="rc-doc-paidline"><b>{money(total)}</b> paid on October 12, 2026</p>
    <table><thead><tr><th>Description</th><th>Qty</th><th>Unit price</th><th>Amount</th></tr></thead><tbody>{INVOICE_LINES.map(line => <tr key={line.description}><td>{line.description}<small>{line.detail}</small></td><td>{line.quantity}</td><td>{money(line.unitPrice)}</td><td>{money(line.unitPrice * line.quantity)}</td></tr>)}</tbody></table>
    <dl className="rc-doc-invtotals"><div><dt>Subtotal</dt><dd>{money(subtotal)}</dd></div><div><dt>Sales tax</dt><dd>{money(INVOICE_TAX)}</dd></div><div><dt>Total</dt><dd>{money(total)}</dd></div><div className="rc-doc-invdue"><dt>Amount paid</dt><dd>{money(total)}</dd></div></dl>
    <p className="rc-doc-fineprint">Paid by Visa ending 2841. Payment terms: due on receipt. Questions about this invoice? Contact billing@cloudnest.example. Fictional sample for demonstration only.</p>
  </div></div>;
}

function DocumentPreview({ transaction }: { transaction: Transaction }) {
  if (transaction.id === "oak") return <img src={RECEIPT.asset} alt="Oak Street Grill source receipt" className="rc-demo-detail-receipt" />;
  if (transaction.kind === "statement") return <StatementDocument />;
  if (transaction.kind === "invoice") return <SourceInvoiceDocument />;
  return <div className="rc-demo-paper-mini" aria-label={`${transaction.merchant} source receipt`}><DocumentBrand transaction={transaction} /><strong>{transaction.merchant.toUpperCase()}</strong><span>{transaction.date}</span><i />{transaction.lineItems.map(item => <p key={item.label}><span>{item.label}</span><b>{money(item.amount)}</b></p>)}<i /><p>Subtotal <b>{money(transaction.subtotal)}</b></p><p>Tax <b>{money(transaction.tax)}</b></p><h5>Total <b>{money(transaction.amount)}</b></h5><small>Sample receipt</small></div>;
}

function TransactionsScene({ phase, reducedMotion }: { phase: number; reducedMotion: boolean }) {
  const [filter, setFilter] = useState<"all" | DocumentKind>("all");
  const [selectedId, setSelectedId] = useState("oak");
  const [zoomed, setZoomed] = useState(false);
  const [scanning, setScanning] = useState(false);
  useEffect(() => {
    if (!zoomed) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setZoomed(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomed]);
  const updated = phase >= 1 || reducedMotion;
  const openDetails = phase >= 2 || reducedMotion;
  const available = updated ? TRANSACTIONS : TRANSACTIONS.slice(1);
  const rows = available.filter(row => filter === "all" || row.kind === filter);
  const selected = TRANSACTIONS.find(row => row.id === selectedId) ?? TRANSACTIONS[0];
  // Every time a document is opened it is "scanned" first, and the extracted record appears when the scan ends.
  useEffect(() => {
    if (!openDetails || reducedMotion) { setScanning(false); return; }
    setScanning(true);
    const timer = window.setTimeout(() => setScanning(false), 1700);
    return () => window.clearTimeout(timer);
  }, [selectedId, openDetails, reducedMotion]);
  const selectFilter = (value: "all" | DocumentKind) => {
    setFilter(value);
    const firstMatch = available.find(row => value === "all" || row.kind === value);
    if (firstMatch) setSelectedId(firstMatch.id);
  };
  return <div className="rc-demo-scene rc-demo-transactions"><div className="rc-demo-scene-heading"><div><span>Transactions</span><h3>Records and documents</h3></div><div className="rc-demo-filter-group" aria-label="Filter records">{transactionFilters.map(item => <button type="button" key={item.value} className={filter === item.value ? "is-active" : ""} aria-pressed={filter === item.value} onClick={() => selectFilter(item.value)}>{item.label}</button>)}</div></div>
    <div className="rc-demo-transactions-grid is-detail-view"><div className="rc-demo-table-card"><div className="rc-demo-panel-heading"><strong>Recent records</strong><span>{rows.length} records</span></div><div className="rc-demo-record-list">{rows.map(row => <button type="button" className={`rc-demo-transaction-row ${row.id === "oak" && updated ? "is-new" : ""} ${selected.id === row.id && openDetails ? "is-selected" : ""}`} key={row.id} aria-pressed={selected.id === row.id} onClick={() => setSelectedId(row.id)}><DocumentBrand transaction={row} /><div><strong>{row.merchant}</strong><small>{row.filename}</small></div><span className="rc-demo-category">{row.kind === "statement" ? "Statement" : row.kind === "invoice" ? "PDF invoice" : row.category}</span><strong className={row.kind === "statement" ? "rc-demo-neutral" : "rc-demo-negative"}>{row.kind === "statement" ? money(row.amount) : `-${money(row.amount)}`}</strong></button>)}{rows.length === 0 ? <p className="rc-demo-empty">No matching records</p> : null}</div></div>
      <div className={`rc-demo-transaction-detail ${openDetails ? "is-visible" : ""} ${selected.kind === "receipt" ? "" : "has-wide-document"}`}><div className="rc-demo-detail-source"><span className="rc-demo-source-filename">{selected.filename}</span><button type="button" className="rc-demo-zoomable" onClick={() => setZoomed(true)} aria-label={`Enlarge ${selected.merchant} source document`}><span className={`rc-demo-scanframe ${scanning ? "is-scanning" : ""}`}><DocumentPreview transaction={selected} />{scanning ? <><span className="rc-demo-scan-tint" aria-hidden="true" /><span className="rc-demo-scan-beam" aria-hidden="true" /></> : null}</span><span className="rc-demo-zoom-hint">{scanning ? "Scanning document" : "Click to enlarge"}</span></button></div><div key={selected.id} className={`rc-demo-detail-fields ${scanning ? "is-reading" : "is-read"}`}><div className="rc-demo-detail-heading"><span>Selected record</span><em>{scanning ? "Reading" : selected.kind}</em></div><div className="rc-demo-reading-note" role="status" aria-live="polite"><b><i className="fas fa-wand-magic-sparkles" /> Extracting details from the document</b><i /><i /><i /><i /></div><h4>{selected.merchant}</h4><dl><div><dt>Address</dt><dd>{selected.address}</dd></div><div><dt>Date</dt><dd>{selected.date}</dd></div><div><dt>Category</dt><dd>{selected.category}</dd></div><div><dt>Account</dt><dd>{selected.account}</dd></div></dl><div className="rc-demo-extracted-items"><span>Extracted items</span>{selected.lineItems.map(item => <div key={item.label}><span>{item.label}</span><strong>{item.amount < 0 ? `-${money(Math.abs(item.amount))}` : money(item.amount)}</strong></div>)}</div><dl className="rc-demo-totals"><div><dt>{selected.kind === "statement" ? "Opening balance" : "Subtotal"}</dt><dd>{money(selected.subtotal)}</dd></div>{selected.kind !== "statement" ? <div><dt>Tax</dt><dd>{money(selected.tax)}</dd></div> : null}{selected.tip ? <div><dt>Tip</dt><dd>{money(selected.tip)}</dd></div> : null}<div><dt>{selected.kind === "statement" ? "Closing balance" : "Total"}</dt><dd>{money(selected.amount)}</dd></div></dl></div></div>
    </div>
    {zoomed && typeof document !== "undefined" ? createPortal(<div className="rc-demo-zoom" role="dialog" aria-modal="true" aria-label={`${selected.merchant} source document`} onClick={() => setZoomed(false)}><div className="rc-demo-zoom-card" onClick={e => e.stopPropagation()}><button type="button" className="rc-demo-zoom-close" onClick={() => setZoomed(false)} aria-label="Close">Close</button><DocumentPreview transaction={selected} /></div></div>, document.body) : null}
    <p className="rc-demo-brand-note">Brand names and logos belong to their owners and are shown only as examples of receipts Receipt Cycle can read. No endorsement is implied. Other businesses, people, and account details are fictional.</p>
  </div>;
}

function Switch({ on, label, onChange }: { on: boolean; label: string; onChange: () => void }) {
  return <button type="button" className="rc-demo-switch-row" onClick={onChange} aria-pressed={on}><span>{label}</span><span className={`rc-demo-switch ${on ? "is-on" : ""}`} aria-hidden="true"><i /></span></button>;
}

function BillingScene({ phase, reducedMotion }: { phase: number; reducedMotion: boolean }) {
  const [kind, setKind] = useState<"estimate" | "invoice">(phase >= 3 || reducedMotion ? "invoice" : "estimate");
  const [layout, setLayout] = useState<"standard" | "compact">(phase >= 1 && phase < 3 ? "compact" : "standard");
  const [accent, setAccent] = useState(phase >= 1 && phase < 3 ? "#0f766e" : "#087fdb");
  const [settings, setSettings] = useState({ logo: true, notes: phase >= 2 || reducedMotion, terms: true, tax: true, footer: false });
  const [showMore, setShowMore] = useState(false);
  const document = kind === "invoice" ? homeWorkflowDemo.invoice : homeWorkflowDemo.estimate;
  const setSetting = (key: keyof typeof settings) => setSettings(current => ({ ...current, [key]: !current[key] }));
  useEffect(() => {
    if (reducedMotion) return;
    if (phase === 1) { setLayout("compact"); setAccent("#0f766e"); }
    if (phase === 2) setSettings(value => ({ ...value, notes: true }));
    if (phase >= 3) setKind("invoice");
  }, [phase, reducedMotion]);
  return <div className="rc-demo-scene rc-demo-billing"><div className="rc-demo-scene-heading"><div><span>Invoices & estimates</span><h3>Live document preview</h3></div><span className="rc-demo-status"><i className="fas fa-pen" />{document.number} · Editing</span></div><div className="rc-demo-billing-grid"><div className="rc-demo-controls-card"><p className="rc-demo-control-label">Document</p><div className="rc-demo-segmented">{(["estimate", "invoice"] as const).map(value => <button type="button" key={value} className={kind === value ? "is-active" : ""} aria-pressed={kind === value} onClick={() => setKind(value)}>{value === "estimate" ? "Estimate" : "Invoice"}</button>)}</div><p className="rc-demo-control-label">Layout</p><div className="rc-demo-segmented">{(["standard", "compact"] as const).map(value => <button type="button" key={value} className={layout === value ? "is-active" : ""} aria-pressed={layout === value} onClick={() => setLayout(value)}>{value === "standard" ? "Standard" : "Compact"}</button>)}</div><p className="rc-demo-control-label">Colour</p><div className="rc-demo-colours">{[{ name: "Teal", value: "#0f766e" }, { name: "Blue", value: "#087fdb" }, { name: "Purple", value: "#7c3aed" }, { name: "Rose", value: "#e11d48" }].map(color => <button type="button" key={color.value} aria-label={`Use ${color.name} document colour`} aria-pressed={accent === color.value} style={{ background: color.value }} className={accent === color.value ? "is-active" : ""} onClick={() => setAccent(color.value)} />)}</div><Switch label="My logo" on={settings.logo} onChange={() => setSetting("logo")} /><Switch label="Notes" on={settings.notes} onChange={() => setSetting("notes")} /><Switch label="Payment terms" on={settings.terms} onChange={() => setSetting("terms")} /><button type="button" className="rc-demo-more-settings" aria-expanded={showMore} onClick={() => setShowMore(value => !value)}>More settings <i className={`fas fa-chevron-${showMore ? "up" : "down"}`} /></button>{showMore ? <div className="rc-demo-more-settings-panel"><Switch label="Tax summary" on={settings.tax} onChange={() => setSetting("tax")} /><Switch label="Footer message" on={settings.footer} onChange={() => setSetting("footer")} /></div> : null}</div>
      <div className={`rc-demo-document ${layout === "compact" ? "is-compact" : ""}`} style={{ "--document-accent": accent } as CSSProperties}><div className="rc-demo-document-band"><div>{settings.logo ? <img src="/icon-512.png" alt="Receipt Cycle" /> : null}<span>Receipt Cycle Studio</span><small>hello@receiptcycle.example</small></div><strong>{kind.toUpperCase()}</strong></div><div className="rc-demo-document-meta"><div><span>BILL TO</span><strong>{document.customer}</strong><small>24 Sample Avenue<br />Portland, OR</small></div><div><span>{document.number}</span><strong>{document.issueDate}</strong><small>{settings.terms ? document.dueLabel : ""}</small></div></div><div className="rc-demo-document-table"><div><span>Description</span><span>Amount</span></div>{document.lineItems.map(item => <div key={item.label}><span>{item.label}</span><span>{money(item.amount * item.quantity)}</span></div>)}{settings.tax ? <div><span>Tax</span><span>{money(document.tax)}</span></div> : null}</div><div className="rc-demo-document-total"><span>Total</span><strong>{money(document.total)}</strong></div>{settings.notes ? <p className="rc-demo-document-note">Thank you for choosing Receipt Cycle Studio. Please reference {document.number} with your payment.</p> : null}{settings.footer ? <div className="rc-demo-document-footer">Created and tracked with Receipt Cycle</div> : null}{!settings.logo ? <span className="rc-demo-preview-hint">Logo hidden</span> : null}</div>
    </div></div>;
}

const BUDGETS = [
  { label: "Meals", amount: 188.47, before: 166.77, limit: 300, color: "#ef4444", note: "14 purchases this month" },
  { label: "Groceries", amount: 412, before: 412, limit: 650, color: "#14b8a6", note: "9 purchases this month" },
  { label: "Transport", amount: 116, before: 116, limit: 220, color: "#3b82f6", note: "6 purchases this month" },
  { label: "Utilities", amount: 242, before: 242, limit: 300, color: "#f59e0b", note: "3 bills this month" },
] as const;

function BudgetingScene({ phase, reducedMotion }: { phase: number; reducedMotion: boolean }) {
  const updated = phase >= 1 || reducedMotion;
  const [selected, setSelected] = useState("Meals");
  const budget = BUDGETS.find(item => item.label === selected) ?? BUDGETS[0];
  const shown = budget.label === "Meals" && !updated ? budget.before : budget.amount;
  const percent = Math.round((shown / budget.limit) * 100);
  return <div className="rc-demo-scene rc-demo-budgeting"><div className="rc-demo-scene-heading"><div><span>Budgets</span><h3>October plan</h3></div><span className="rc-demo-filter"><i className="far fa-calendar" /> October 2026</span></div><div className="rc-demo-budget-grid"><div className="rc-demo-budget-summary"><span>{budget.label} budget</span><strong>{money(budget.limit)}</strong><div className="rc-demo-budget-ring" style={{ "--progress": `${percent}%`, "--budget-color": budget.color } as CSSProperties}><span>{percent}%<small>used</small></span></div><p><strong>{money(shown)}</strong> spent<br />{money(budget.limit - shown)} remaining</p><small className="rc-demo-budget-note">{budget.note}</small></div><div className="rc-demo-budget-list">{updated ? <div className="rc-demo-budget-event is-visible"><span><i className="fas fa-receipt" /> {RECEIPT.merchant}</span><strong>+{money(RECEIPT.total)} to Meals</strong></div> : null}{BUDGETS.map(item => { const amount = item.label === "Meals" && !updated ? item.before : item.amount; return <button type="button" key={item.label} className={`rc-demo-budget-row ${selected === item.label ? "is-selected" : ""}`} aria-pressed={selected === item.label} onClick={() => setSelected(item.label)}><div><span>{item.label}</span><strong>{money(amount)} <small>of {money(item.limit)}</small></strong></div><div className="rc-demo-progress"><span style={{ width: `${Math.min(100, (amount / item.limit) * 100)}%`, background: item.color }} /></div><small>{money(item.limit - amount)} remaining</small></button>; })}</div></div></div>;
}

type InvoiceRow = { number: string; customer: string; due: string; total: number; balance: number; status: "Overdue" | "Partially paid" | "Paid"; tone: string; activity: string[] };
const INVOICES: InvoiceRow[] = [
  { number: homeWorkflowDemo.invoice.number, customer: homeWorkflowDemo.invoice.customer, due: homeWorkflowDemo.invoice.dueLabel, total: homeWorkflowDemo.invoice.total, balance: homeWorkflowDemo.invoice.balance ?? 0, status: "Partially paid", tone: "amber", activity: ["Invoice sent · Oct 17", "Payment recorded · $800.00", "Balance remaining · $852.40"] },
  { number: "INV-2026-011", customer: "Northstar Creative", due: "4 days late", total: 1240, balance: 1240, status: "Overdue", tone: "rose", activity: ["Invoice sent · Sep 14", "Due date passed · Oct 14", "Reminder ready for review"] },
  { number: "INV-2026-008", customer: "Riverbend Works", due: "Part payment recorded", total: 625, balance: 225, status: "Partially paid", tone: "amber", activity: ["Invoice sent · Sep 2", "Payment recorded · $400.00", "Balance remaining · $225.00"] },
  { number: "INV-2026-004", customer: "Cedar Lane Studio", due: "Completed Oct 12", total: 480, balance: 0, status: "Paid", tone: "teal", activity: ["Invoice sent · Aug 28", "Payment recorded · $480.00", "Invoice marked paid"] },
];

function PaymentsScene({ phase, reducedMotion }: { phase: number; reducedMotion: boolean }) {
  const [filter, setFilter] = useState<"All" | InvoiceRow["status"]>("All");
  const [selectedNumber, setSelectedNumber] = useState(INVOICES[0].number);
  const [reminders, setReminders] = useState({ invoice: true, overdue: phase >= 2 || reducedMotion, confirmation: true });
  const focused = phase >= 1 || reducedMotion;
  const rows = INVOICES.filter(item => filter === "All" || item.status === filter);
  const selected = INVOICES.find(item => item.number === selectedNumber) ?? INVOICES[0];
  useEffect(() => { if (phase >= 2 && !reducedMotion) setReminders(value => ({ ...value, overdue: true })); }, [phase, reducedMotion]);
  return <div className="rc-demo-scene rc-demo-payments"><div className="rc-demo-scene-heading"><div><span>Payments & reminders</span><h3>Invoice activity</h3></div><div className="rc-demo-filter-group" aria-label="Filter invoices">{(["All", "Overdue", "Partially paid", "Paid"] as const).map(item => <button type="button" key={item} className={filter === item ? "is-active" : ""} aria-pressed={filter === item} onClick={() => setFilter(item)}>{item}</button>)}</div></div><div className="rc-demo-payment-grid"><div className="rc-demo-invoice-list">{rows.map(invoice => <button type="button" className={`rc-demo-invoice-row ${focused && selected.number === invoice.number ? "is-focused" : ""}`} key={invoice.number} aria-pressed={selected.number === invoice.number} onClick={() => setSelectedNumber(invoice.number)}><span className="rc-demo-row-icon"><i className="fas fa-file-invoice" /></span><div><strong>{invoice.customer}</strong><small>{invoice.number} · {invoice.due}</small></div><span className={`rc-demo-pill ${invoice.tone}`}>{invoice.status}</span><strong>{money(invoice.balance)}</strong></button>)}</div><div className="rc-demo-activity-card"><div className="rc-demo-activity-head"><span>{selected.status}</span><h4>{selected.customer}</h4><small>{selected.number} · {money(selected.total)}</small></div><div className="rc-demo-mini-invoice"><div><img src="/icon-512.png" alt="" /><strong>INVOICE</strong></div><span>Bill to {selected.customer}</span><dl><div><dt>Invoice total</dt><dd>{money(selected.total)}</dd></div><div><dt>Open balance</dt><dd>{money(selected.balance)}</dd></div></dl></div><div className="rc-demo-activity-timeline">{selected.activity.map((activity, index) => <div key={activity}><i className={`fas ${index === selected.activity.length - 1 ? "fa-circle-check" : "fa-circle"}`} /><span>{activity}</span></div>)}</div><p>Reminder settings</p><Switch label="Invoice reminders" on={reminders.invoice} onChange={() => setReminders(value => ({ ...value, invoice: !value.invoice }))} /><Switch label="Overdue reminders" on={reminders.overdue} onChange={() => setReminders(value => ({ ...value, overdue: !value.overdue }))} /><Switch label="Payment confirmations" on={reminders.confirmation} onChange={() => setReminders(value => ({ ...value, confirmation: !value.confirmation }))} /></div></div></div>;
}

function DemoScreen({ scene, phase, runKey, reducedMotion, onNavigate }: { scene: SceneId; phase: number; runKey: number; reducedMotion: boolean; onNavigate: (scene: SceneId) => void }) {
  const current = SCENES.find(item => item.id === scene) ?? SCENES[0];
  return <div className="rc-demo-device" data-dashboard-capture-slot="receipt-cycle-product-demo"><div className="rc-demo-device-bezel"><div className="rc-demo-camera" /><div className="rc-demo-app"><ProductSidebar scene={scene} onNavigate={onNavigate} /><div className="rc-demo-app-main"><DemoTopbar title={current.label} /><div className="rc-demo-stage" key={`${scene}-${runKey}`}>{scene === "capture" ? <CaptureScene phase={phase} reducedMotion={reducedMotion} onSaved={() => onNavigate("transactions")} /> : null}{scene === "transactions" ? <TransactionsScene phase={phase} reducedMotion={reducedMotion} /> : null}{scene === "billing" ? <BillingScene phase={phase} reducedMotion={reducedMotion} /> : null}{scene === "budgeting" ? <BudgetingScene phase={phase} reducedMotion={reducedMotion} /> : null}{scene === "payments" ? <PaymentsScene phase={phase} reducedMotion={reducedMotion} /> : null}</div></div></div></div><div className="rc-demo-device-lip"><span /></div></div>;
}

export function InteractiveProductDemo() {
  const [scene, setScene] = useState<SceneId>("capture");
  const [phase, setPhase] = useState(0);
  const [runKey, setRunKey] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(() => document.visibilityState !== "hidden");
  const rootRef = useRef<HTMLElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const currentScene = SCENES.find(item => item.id === scene) ?? SCENES[0];

  useEffect(() => {
    const target = rootRef.current;
    if (!target) return;
    if (typeof IntersectionObserver === "undefined") { setIsVisible(true); return; }
    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting && entry.intersectionRatio >= 0.25), { threshold: [0, 0.25, 0.65] });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const update = () => setIsPageVisible(document.visibilityState !== "hidden");
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  useEffect(() => {
    if (!isVisible || !isPageVisible || reducedMotion || phase >= currentScene.phases - 1) return;
    const timer = window.setTimeout(() => setPhase(value => value + 1), phase === 0 ? 900 : 1250);
    return () => window.clearTimeout(timer);
  }, [currentScene.phases, isPageVisible, isVisible, phase, reducedMotion, runKey]);

  const selectScene = (next: SceneId) => { setScene(next); setPhase(reducedMotion ? (SCENES.find(item => item.id === next)?.phases ?? 1) - 1 : 0); setRunKey(value => value + 1); };
  const onTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % SCENES.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index - 1 + SCENES.length) % SCENES.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = SCENES.length - 1;
    else return;
    event.preventDefault(); selectScene(SCENES[next].id); document.getElementById(`product-demo-tab-${SCENES[next].id}`)?.focus();
  };

  return <section ref={rootRef} className="rc-product-demo" aria-labelledby="product-demo-heading"><div className="rc-product-demo-ambient rc-product-demo-ambient-one" aria-hidden="true" /><div className="rc-product-demo-ambient rc-product-demo-ambient-two" aria-hidden="true" /><div className="rc-product-demo-inner"><div className="rc-product-demo-copy"><h2 id="product-demo-heading">See Receipt Cycle in action</h2><p>From scanned receipts to paid invoices, explore how your everyday financial work stays connected in one clear workspace.</p></div><div className="rc-product-demo-tabs" role="tablist" aria-label="Receipt Cycle product workflows">{SCENES.map((item, index) => { const selected = item.id === scene; return <button key={item.id} id={`product-demo-tab-${item.id}`} type="button" role="tab" aria-selected={selected} aria-controls="product-demo-panel" tabIndex={selected ? 0 : -1} onClick={() => selectScene(item.id)} onKeyDown={event => onTabKeyDown(event, index)}><span>{item.label}</span></button>; })}</div><div id="product-demo-panel" role="tabpanel" aria-labelledby={`product-demo-tab-${scene}`} className="rc-product-demo-panel"><div className="rc-product-demo-mobile-copy"><i className={`fas ${currentScene.icon}`} aria-hidden="true" /><div><strong>{currentScene.title}</strong><span>{currentScene.description}</span></div></div><DemoScreen scene={scene} phase={reducedMotion ? currentScene.phases - 1 : phase} runKey={runKey} reducedMotion={reducedMotion} onNavigate={selectScene} /></div><p className="sr-only" aria-live="polite">Viewing {currentScene.label}. {currentScene.description}</p><p className="sr-only">This interactive demonstration follows the {homeWorkflowStages.map(stage => stage.label).join(", ")} stages. Use the tabs or workspace navigation to explore receipt capture, transactions, invoices and estimates, budgets, payments, and reminders.</p></div></section>;
}
