/**
 * Every notification message from the build spec, as data. The admin dashboard edits these rows; nothing about the copy,
 * timing or audience is fixed in the sending code. `seedTemplates` fills the table the first time, and never overwrites an
 * admin's edits.
 */

export type TemplateKind = "sequence" | "pool" | "event" | "quota" | "campaign";
export type Toggle =
  | "dailyReminder" | "invoiceReminders" | "overdueReminders" | "paymentConfirmations" | "budgetAlerts" | "weeklyReports" | "marketingUpdates" | "none";

export type TemplateSeed = {
  key: string;
  name: string;
  kind: TemplateKind;
  /** Frequency-cap bucket: lifecycle, daily, invoice, overdue, payment, budget, weekly, marketing, campaign, service. */
  category: string;
  toggle: Toggle;
  title: string;
  body: string;
  bodyWebMention?: string;
  /** App screen. Mapped to a real screen / web page by the apps. */
  route: string;
  /** Who may get it, or (for event messages) which situation it fits. */
  audience?: string;
  weight?: number;
  cooldownDays?: number;
  sequenceDay?: number;
  windowStart?: number;
  windowEnd?: number;
  delayMinutes?: number;
  channels?: string;
};

/** The longest realistic value of each merge field. Used to check a message can never exceed 40 / 100 characters. */
export const MERGE_FIELDS: Record<string, number> = {
  first_name: 12, customer_name: 20, invoice_number: 12, amount: 11, amount_paid: 11, balance: 11, due_date: 12, days_overdue: 3,
  overdue_count: 3, overdue_total: 11, budget_name: 16, percent_used: 4, amount_left: 11, income_total: 11, expense_total: 11, transaction_count: 5,
  // named fields used by campaign templates (limits from the spec)
  feature_name: 28, feature_blurb: 70, offer_title: 30, offer_details: 75, offer_end: 12, tip_title: 30, tip_body: 90, notice_text: 100,
  notice_date: 12, winback_line: 90,
};

export const TITLE_MAX = 40;
export const BODY_MAX = 100;

const T = (s: TemplateSeed): TemplateSeed => s;

// ---- Section 4: the 7-day trial sequence -------------------------------------------------------------------------------
const SEQUENCE: TemplateSeed[] = [
  T({ key: "trial_day1", name: "Trial day 1: scan a receipt", kind: "sequence", category: "lifecycle", toggle: "dailyReminder", title: "Welcome, {{first_name}}", body: "Got a receipt in your bag? Snap it and watch ReceiptCycle fill in the details.", route: "scan", sequenceDay: 1, windowStart: 10, windowEnd: 20, delayMinutes: 180 }),
  T({ key: "trial_day2", name: "Trial day 2: voice entry", kind: "sequence", category: "lifecycle", toggle: "dailyReminder", title: "Talk it in, skip the typing", body: "Paid for something? Say it out loud and ReceiptCycle drafts the entry for you.", route: "voice", sequenceDay: 2, windowStart: 10, windowEnd: 19 }),
  T({ key: "trial_day3", name: "Trial day 3: first invoice", kind: "sequence", category: "lifecycle", toggle: "dailyReminder", title: "Ready for your first invoice?", body: "Add a customer, pick the items and send it. Simple as that.", route: "invoice_new", sequenceDay: 3, windowStart: 10, windowEnd: 19 }),
  T({ key: "trial_day4", name: "Trial day 4: set a budget", kind: "sequence", category: "lifecycle", toggle: "dailyReminder", title: "Set one budget today", body: "Pick a category and a limit. We'll tell you when you're getting close.", route: "budget_new", sequenceDay: 4, windowStart: 10, windowEnd: 19 }),
  T({ key: "trial_day5", name: "Trial day 5: money leaks", kind: "sequence", category: "lifecycle", toggle: "dailyReminder", title: "Where is your money leaking?", body: "Have a look at your money-leak insights, or ask the AI finance coach.", route: "insights", sequenceDay: 5, windowStart: 10, windowEnd: 19 }),
  T({ key: "trial_day6_entries", name: "Trial day 6: has entries", kind: "sequence", category: "lifecycle", toggle: "dailyReminder", title: "Your numbers so far", body: "{{transaction_count}} entries logged. Open Reports to see where it all went.", route: "reports", audience: "has_entries", sequenceDay: 6, windowStart: 10, windowEnd: 19 }),
  T({ key: "trial_day6_empty", name: "Trial day 6: no entries yet", kind: "sequence", category: "lifecycle", toggle: "dailyReminder", title: "Still time to try it", body: "Your trial has a day or two left. Scan one receipt and see how it feels.", route: "scan", audience: "no_entries", sequenceDay: 6, windowStart: 10, windowEnd: 19 }),
  T({ key: "trial_day7", name: "Trial day 7: trial ends soon", kind: "sequence", category: "lifecycle", toggle: "marketingUpdates", title: "Your trial ends soon, {{first_name}}", body: "Your trial wraps up soon. Pro features pause after it ends, and your data stays viewable.", bodyWebMention: "Your trial wraps up soon. Pro features stay available on the ReceiptCycle web version.", route: "home", sequenceDay: 7, windowStart: 14, windowEnd: 19 }),
];

// ---- Section 4: quota messages (sent once, when the count is reached) ------------------------------------------------------
const QUOTA: TemplateSeed[] = [
  T({ key: "quota_20", name: "20 of 25 free entries used", kind: "quota", category: "marketing", toggle: "marketingUpdates", title: "5 free entries left", body: "You've used 20 of your 25 free entries. Your data always stays viewable.", route: "home" }),
  T({ key: "quota_25", name: "25 of 25 free entries used", kind: "quota", category: "marketing", toggle: "marketingUpdates", title: "Free entry limit reached", body: "You've used all 25 entries. Your data stays viewable. Adding more needs Pro access.", bodyWebMention: "You've used all 25 entries. Pro features are available on the ReceiptCycle web version.", route: "home" }),
];

// ---- Section 5: the daily reminder pool --------------------------------------------------------------------------------------
const pool = (key: string, audience: string, title: string, body: string, route: string, extra: Partial<TemplateSeed> = {}): TemplateSeed =>
  T({ key: `daily_${key}`, name: `Daily ${key.toUpperCase()}`, kind: "pool", category: "daily", toggle: "dailyReminder", title, body, route, audience, weight: 1, windowStart: 10, windowEnd: 19, ...extra });

const POOL: TemplateSeed[] = [
  pool("a1", "all", "Quick check-in", "Anything you spent on today? Log it while you remember.", "add"),
  pool("a2", "all", "Don't let receipts pile up", "Snap today's receipts now and future-you will say thanks.", "scan"),
  pool("a3", "all", "Your records, up to date?", "A minute now saves a long evening at month end.", "home"),
  pool("a4", "all", "Voice entry, anyone?", "Tell ReceiptCycle what you bought and it drafts the entry.", "voice"),
  pool("a5", "all", "Small purchases add up", "The little ones are easy to forget. Add them before bed.", "add"),
  pool("a6", "all", "How was today?", "Sales in, money out. Capture it before the day ends.", "add"),
  pool("a7", "all", "Have you sent that invoice?", "If you did a job this week, send the invoice while it's fresh.", "invoices"),
  pool("a8", "all", "Any customer still owing you?", "Open Invoices and see who's overdue.", "invoices"),
  pool("a9", "all", "Peek at your reports", "See where your money went this week.", "reports"),
  pool("a10", "all", "Budget check", "Open Budgets and see how much is left this month.", "budgets"),
  pool("a11", "all", "Ask the finance coach", "Curious about your spending? Ask the AI coach a question.", "coach"),
  pool("a12", "all", "Keep the habit going", "Daily records make tax time a lot lighter.", "home"),
  pool("a13", "all", "A receipt in your pocket?", "Scan it now before the ink fades.", "scan"),
  pool("a14", "all", "Stay on top of your cash", "Log today's money in and out.", "add"),
  pool("a15", "all", "End-of-day habit", "Log today's money in and out before you close.", "add"),
  pool("a16", "all", "Money-leak insights", "See which spending categories are growing fastest.", "insights"),
  pool("a17", "all", "Tidy up your entries", "Check today's entries have the right category.", "transactions"),
  pool("a18", "all", "Your future self says thanks", "Tidy books now, easier decisions later.", "home"),
  pool("b1", "has_overdue", "{{overdue_count}} overdue invoice(s)", "{{overdue_total}} is waiting to be collected. Send a reminder today.", "invoices", { weight: 3 }),
  pool("b2", "has_overdue", "Time to follow up", "Some customers still owe you. A polite nudge often does the job.", "invoices", { weight: 3 }),
  pool("c1", "voice_unused", "Try voice entry", "Say what you spent and let ReceiptCycle fill in the details.", "voice", { weight: 2 }),
  pool("c2", "voice_unused", "Hands full? Just speak", "Dictate your entry instead of typing it.", "voice", { weight: 2 }),
  pool("d1", "paid", "Export your records", "Download your entries as CSV for your accountant or spreadsheet.", "export"),
  pool("d2", "paid", "Month-end soon", "Review your entries and export your CSV before the month closes.", "export"),
  pool("e1", "expired_free", "Your data is still here", "Everything you recorded is still viewable. Adding or exporting needs Pro access.", "home", { toggle: "marketingUpdates", category: "marketing" }),
  pool("e2", "expired_free", "Pro access needed", "Adding, editing and exporting entries need Pro access. Your records stay safe.", "home", { toggle: "marketingUpdates", category: "marketing", cooldownDays: 14, bodyWebMention: "Adding and exporting need Pro access, which is available on the ReceiptCycle web version." }),
  pool("e3", "expired_free", "See what you built", "Open Reports to review the entries you logged during your trial.", "reports", { toggle: "marketingUpdates", category: "marketing" }),
];

// ---- Section 6: event messages ------------------------------------------------------------------------------------------------
const ev = (key: string, name: string, category: string, toggle: Toggle, title: string, body: string, route: string, audience = "any", extra: Partial<TemplateSeed> = {}): TemplateSeed =>
  T({ key, name, kind: "event", category, toggle, title, body, route, audience, windowStart: 9, windowEnd: 12, ...extra });

const EVENTS: TemplateSeed[] = [
  ev("due_1", "Invoice due soon 1", "invoice", "invoiceReminders", "Invoice {{invoice_number}} is due soon", "{{customer_name}} owes {{amount}}, due {{due_date}}.", "invoices"),
  ev("due_2", "Invoice due soon 2", "invoice", "invoiceReminders", "A payment is coming up", "{{amount}} from {{customer_name}} is due {{due_date}}.", "invoices"),
  ev("due_3", "Invoice due soon 3", "invoice", "invoiceReminders", "Heads up on {{invoice_number}}", "Due {{due_date}}. A friendly reminder to the customer can help.", "invoices"),
  ev("due_4", "Invoice due tomorrow", "invoice", "invoiceReminders", "Due tomorrow", "{{customer_name}}'s invoice for {{amount}} is due tomorrow.", "invoices", "days_1"),
  ev("due_5", "Invoice due today", "invoice", "invoiceReminders", "Due today", "Invoice {{invoice_number}} for {{amount}} is due today.", "invoices", "days_0"),
  ev("overdue_1", "Invoice overdue 1", "overdue", "overdueReminders", "Invoice {{invoice_number}} is overdue", "{{customer_name}} is {{days_overdue}} days late on {{amount}}.", "invoices"),
  ev("overdue_2", "Invoice overdue 2", "overdue", "overdueReminders", "Time to follow up", "{{amount}} from {{customer_name}} is overdue. Send a polite reminder.", "invoices"),
  ev("overdue_3", "Invoice overdue 3", "overdue", "overdueReminders", "Still unpaid", "{{invoice_number}} is {{days_overdue}} days past due.", "invoices"),
  ev("overdue_4", "Invoice overdue 4", "overdue", "overdueReminders", "A gentle nudge may help", "{{customer_name}} may have forgotten. Remind them in one tap.", "invoices"),
  ev("overdue_5", "Invoice overdue 5", "overdue", "overdueReminders", "Overdue: {{amount}}", "Open {{invoice_number}} to resend it.", "invoices"),
  ev("overdue_digest", "Overdue digest (3+ invoices)", "overdue", "overdueReminders", "{{overdue_count}} invoices overdue", "{{overdue_total}} is waiting to be collected.", "invoices", "digest"),
  ev("paid_1", "Payment received 1", "payment", "paymentConfirmations", "Payment received", "{{customer_name}} paid {{amount_paid}} on {{invoice_number}}.", "invoices", "any", { windowStart: undefined, windowEnd: undefined }),
  ev("paid_2", "Payment received 2", "payment", "paymentConfirmations", "Money in", "{{amount_paid}} received from {{customer_name}}.", "invoices", "any", { windowStart: undefined, windowEnd: undefined }),
  ev("paid_3", "Paid in full 1", "payment", "paymentConfirmations", "Invoice {{invoice_number}} paid in full", "Thanks to {{customer_name}}. Nothing left to collect.", "invoices", "full", { windowStart: undefined, windowEnd: undefined }),
  ev("paid_4", "Part-payment received", "payment", "paymentConfirmations", "Part-payment received", "{{customer_name}} paid {{amount_paid}}. Balance: {{balance}}.", "invoices", "partial", { windowStart: undefined, windowEnd: undefined }),
  ev("paid_5", "Paid in full 2", "payment", "paymentConfirmations", "Cha-ching", "{{amount_paid}} just landed from {{customer_name}}.", "invoices", "full", { windowStart: undefined, windowEnd: undefined }),
  ev("budget_80a", "Budget 80% (a)", "budget", "budgetAlerts", "{{budget_name}} at 80%", "You've used {{percent_used}} of this budget. {{amount_left}} left.", "budgets", "level_80", { windowStart: undefined, windowEnd: undefined }),
  ev("budget_80b", "Budget 80% (b)", "budget", "budgetAlerts", "Budget heads up", "{{budget_name}} is getting close. {{amount_left}} remaining.", "budgets", "level_80", { windowStart: undefined, windowEnd: undefined }),
  ev("budget_95a", "Budget 95% (a)", "budget", "budgetAlerts", "{{budget_name}} almost used up", "Only {{amount_left}} left in this budget.", "budgets", "level_95", { windowStart: undefined, windowEnd: undefined }),
  ev("budget_95b", "Budget 95% (b)", "budget", "budgetAlerts", "Nearly there", "{{budget_name}} is at {{percent_used}}. Spend with care.", "budgets", "level_95", { windowStart: undefined, windowEnd: undefined }),
  ev("budget_100a", "Budget 100% (a)", "budget", "budgetAlerts", "{{budget_name}} limit reached", "You've used your full budget for this period.", "budgets", "level_100", { windowStart: undefined, windowEnd: undefined }),
  ev("budget_100b", "Budget 100% (b)", "budget", "budgetAlerts", "Budget used up", "{{budget_name}} has reached its limit. Review your spending.", "budgets", "level_100", { windowStart: undefined, windowEnd: undefined }),
  ev("weekly_1", "Weekly report 1", "weekly", "weeklyReports", "Your week in numbers", "In: {{income_total}}. Out: {{expense_total}}. Tap for the full report.", "reports", "any", { windowStart: 8, windowEnd: 10 }),
  ev("weekly_2", "Weekly report 2", "weekly", "weeklyReports", "Last week's summary", "{{transaction_count}} entries logged. See where the money went.", "reports", "any", { windowStart: 8, windowEnd: 10 }),
  ev("weekly_3", "Weekly report 3", "weekly", "weeklyReports", "Weekly report is ready", "Income {{income_total}}, expenses {{expense_total}}.", "reports", "any", { windowStart: 8, windowEnd: 10 }),
  ev("weekly_4", "Weekly report 4", "weekly", "weeklyReports", "Monday money check", "Review last week and plan this one.", "reports", "any", { windowStart: 8, windowEnd: 10 }),
  ev("weekly_5", "Weekly report 5", "weekly", "weeklyReports", "Here's your week", "{{transaction_count}} entries, {{income_total}} in, {{expense_total}} out.", "reports", "any", { windowStart: 8, windowEnd: 10 }),
];

// ---- Section 8: campaign library ---------------------------------------------------------------------------------------------
const camp = (key: string, name: string, title: string, body: string, route = "home", extra: Partial<TemplateSeed> = {}): TemplateSeed =>
  T({ key: `campaign_${key}`, name, kind: "campaign", category: "campaign", toggle: "marketingUpdates", title, body, route, audience: "all", ...extra });

const CAMPAIGNS: TemplateSeed[] = [
  // blank templates the admin fills in
  camp("blank_launch", "Blank: product launch", "New: {{feature_name}}", "{{feature_blurb}}"),
  camp("blank_offer", "Blank: special offer (web only)", "{{offer_title}}", "{{offer_details}} Ends {{offer_end}}.", "home", { channels: "web" }),
  camp("blank_offer_last", "Blank: last chance offer (web only)", "Last day: {{offer_title}}", "Ends {{offer_end}}. {{offer_details}}", "home", { channels: "web" }),
  camp("blank_tip", "Blank: tip of the week", "{{tip_title}}", "{{tip_body}}"),
  camp("blank_notice", "Blank: service notice", "Quick update", "{{notice_text}}", "home", { category: "service", toggle: "none" }),
  camp("blank_winback", "Blank: win-back", "We miss you, {{first_name}}", "{{winback_line}}"),
  // ready to send: product launch
  camp("launch_voice", "Launch: voice entry", "New: Voice entry", "Just say what you spent. ReceiptCycle drafts the entry for you.", "voice"),
  camp("launch_coach", "Launch: AI finance coach", "New: AI finance coach", "Ask questions about your spending and get plain answers.", "coach"),
  camp("launch_leaks", "Launch: money-leak insights", "New: Money-leak insights", "See which categories are eating your cash.", "insights"),
  camp("launch_csv", "Launch: CSV export", "New: CSV export", "Download your entries for your accountant. Needs Pro access.", "export", { audience: "paid" }),
  camp("launch_update", "Launch: update is live", "Update is live", "We've made ReceiptCycle faster. Update the app to get it."),
  // special offers: web only, no prices
  camp("offer_thanks", "Offer: special thank-you", "A special thank-you", "Something new is waiting for you. Ends {{offer_end}}.", "home", { channels: "web" }),
  camp("offer_loyal", "Offer: gift for loyal users", "A gift for loyal users", "{{offer_details}}", "home", { channels: "web" }),
  camp("offer_founder", "Offer: founder offer", "Founder offer", "{{offer_details}} Ends {{offer_end}}.", "home", { channels: "web" }),
  camp("offer_last", "Offer: last chance", "Last chance", "Our offer ends {{offer_end}}. Don't miss it.", "home", { channels: "web" }),
  camp("offer_thankyou", "Offer: thank you", "Thank you offer", "Thanks for being here. {{offer_details}}", "home", { channels: "web" }),
  // referrals (only when the feature exists)
  camp("referral_share", "Referral: know a business owner", "Know a business owner?", "Share ReceiptCycle with a friend who still keeps receipts in a drawer."),
  camp("referral_invite", "Referral: invite a friend", "Invite a friend", "{{offer_details}} when a friend joins.", "home", { channels: "web" }),
  // re-engagement by days inactive (audience carries the number)
  camp("react_3", "Re-engage: 3 days inactive", "Quick check-in", "Anything to record from the last few days?", "add", { audience: "inactive_3" }),
  camp("react_7", "Re-engage: 7 days inactive", "We saved your spot", "Your records are right where you left them.", "home", { audience: "inactive_7" }),
  camp("react_14", "Re-engage: 14 days inactive", "Still keeping track?", "A few minutes now beats a long catch-up later.", "add", { audience: "inactive_14" }),
  camp("react_30", "Re-engage: 30 days inactive", "It's been a while", "Your data is safe. Come back whenever you're ready.", "home", { audience: "inactive_30" }),
  // trial ending and win-back
  camp("trial_ending", "Trial ending soon", "Your trial ends soon", "Pro features pause after it ends. Your data stays viewable.", "home", { audience: "trial", bodyWebMention: "Pro features stay available on the ReceiptCycle web version after your trial." }),
  camp("expired_free", "Expired free users", "Your data is still here", "Adding and exporting need Pro access. Your data stays viewable.", "home", { audience: "expired_free" }),
  camp("cancelled_paid", "Cancelled paid users", "Come back anytime", "Your records are safe and still viewable.", "home", { audience: "cancelled" }),
  // seasonal (check tax dates per country before sending)
  camp("season_tax", "Seasonal: tax season", "Tax season is coming", "Get your receipts and invoices in order early.", "home"),
  camp("season_newyear", "Seasonal: new year", "New year, tidy books", "Start the year with clean records.", "home"),
  camp("season_monthend", "Seasonal: month end", "Month-end reminder", "Close the month with your entries up to date.", "transactions"),
  // tips
  camp("tip_voice", "Tip: voice entry", "Tip: voice entry", "Tap the mic and say what you bought.", "voice"),
  camp("tip_invoice", "Tip: invoice templates", "Tip: invoice templates", "Reuse items so invoices take less time.", "invoice_new"),
  camp("tip_budgets", "Tip: budgets", "Tip: budgets", "Set a limit per category and get alerts as you near it.", "budgets"),
  // milestones and reviews
  camp("milestone_100", "Milestone: 100 entries", "100 entries logged", "Nice work, {{first_name}}. Your records are growing.", "home"),
  camp("review_ask", "Review request (needs a rating link)", "Enjoying ReceiptCycle?", "A quick rating helps other business owners find us.", "home"),
  // service notices go to everyone with a device
  camp("service_maintenance", "Service: short maintenance", "Short maintenance", "ReceiptCycle will be unavailable briefly on {{notice_date}}.", "home", { category: "service", toggle: "none" }),
  camp("service_back", "Service: back to normal", "Back to normal", "We fixed the issue. Thanks for your patience.", "home", { category: "service", toggle: "none" }),
];

export const ALL_SEEDS: TemplateSeed[] = [...SEQUENCE, ...QUOTA, ...POOL, ...EVENTS, ...CAMPAIGNS];

// ---- validation (Sections 4, 7 and 11) -------------------------------------------------------------------------------------
const BANNED = ["buy", "purchase", "subscribe", "upgrade", "checkout", "pay", "plan", "pricing", "discount"];

/** Replace every {{field}} with its worst-case text so we know the real length can never be longer. */
export function worstCase(text: string): string {
  return text.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (_m, f: string) => "x".repeat(MERGE_FIELDS[f] ?? 0));
}

export function unknownFields(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(/\{\{\s*([a-z_]+)\s*\}\}/g)) if (!(m[1] in MERGE_FIELDS)) out.push(m[1]);
  return [...new Set(out)];
}

export function renderTemplate(text: string, values: Record<string, string | number>): string {
  return text.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (_m, f: string) => (f in values ? String(values[f]) : ""));
}

/** Kinds whose wording is about trials, access or offers: no prices, links or payment words. Event messages are exempt. */
export function policyApplies(kind: string, category: string): boolean {
  if (category === "service") return false;
  return ["sequence", "pool", "quota", "campaign"].includes(kind);
}

export function policyProblems(text: string): string[] {
  const t = text.toLowerCase();
  const out: string[] = [];
  if (/https?:\/\/|www\.|[a-z0-9-]+\.(com|net|org|io|app|co)\b/i.test(t)) out.push("contains a link or web address");
  if (/[$€£₦]\s?\d|\d\s?(usd|eur|gbp|ngn)\b|\d\s?%\s?off|per (month|year)|free month/i.test(t)) out.push("contains a price, discount or billing period");
  const hit = BANNED.filter((w) => new RegExp(`\\b${w}\\b`, "i").test(t));
  if (hit.length) out.push(`uses restricted wording (${hit.join(", ")})`);
  return out;
}

export type ValidatableTemplate = { title: string; body: string; bodyWebMention?: string | null; kind: string; category: string };

export function templateProblems(t: ValidatableTemplate): string[] {
  const problems: string[] = [];
  const bodies = [t.body, ...(t.bodyWebMention ? [t.bodyWebMention] : [])];
  for (const field of [t.title, ...bodies]) {
    const bad = unknownFields(field);
    if (bad.length) problems.push(`Unknown merge field: ${bad.map((b) => `{{${b}}}`).join(", ")}`);
  }
  if (worstCase(t.title).length > TITLE_MAX) problems.push(`Title is too long (${worstCase(t.title).length} of ${TITLE_MAX} characters, counting the longest values).`);
  for (const b of bodies) if (worstCase(b).length > BODY_MAX) problems.push(`Message is too long (${worstCase(b).length} of ${BODY_MAX} characters, counting the longest values).`);
  if (policyApplies(t.kind, t.category)) {
    // Named campaign fields are validated again when the campaign is created, with the real values.
    for (const text of [t.title, ...bodies]) for (const p of policyProblems(text.replace(/\{\{[^}]+\}\}/g, ""))) problems.push(`Not allowed: ${p}.`);
  }
  return [...new Set(problems)];
}
