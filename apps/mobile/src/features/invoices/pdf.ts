import { Directory, File, Paths } from "expo-file-system";
import type { BusinessProfile, SalesCustomer } from "../sales/setupData";
import { calculateInvoiceTotals, type InvoiceDraft } from "./model";

function ascii(value: string) {
  return value.normalize("NFKD").replace(/[^\x20-\x7E\n]/g, "?");
}

function escapePdf(value: string) {
  return ascii(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function bytes(value: string) {
  const out = new Uint8Array(value.length);
  for (let index = 0; index < value.length; index += 1) out[index] = value.charCodeAt(index) & 0xff;
  return out;
}

function wrap(value: string, max = 68) {
  const words = value.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let line = "";
  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (next.length > max && line) { lines.push(line); line = word; }
    else line = next;
  });
  if (line) lines.push(line);
  return lines;
}

export function invoiceShareSummary(draft: InvoiceDraft, customer: SalesCustomer, currency: string) {
  const totals = calculateInvoiceTotals(draft);
  return `${draft.invoiceNumber} for ${customer.name}\nTotal: ${currency} ${totals.total.toFixed(2)}\nDue: ${draft.dueDate}`;
}

export function createInvoicePdf(draft: InvoiceDraft, business: BusinessProfile, customer: SalesCustomer, currency: string, label: "INVOICE" | "ESTIMATE" = "INVOICE") {
  const totals = calculateInvoiceTotals(draft);
  const pages: string[][] = [];
  let commands: string[] = [];
  const textCommand = (text: string, x: number, y: number, size = 10, bold = false) => `BT /${bold ? "F2" : "F1"} ${size} Tf ${x} ${y} Td (${escapePdf(text)}) Tj ET`;
  const add = (text: string, x: number, y: number, size = 10, bold = false) => commands.push(textCommand(text, x, y, size, bold));
  const addTableHeader = (tableY: number) => {
    commands.push(`0.82 G 48 ${tableY + 16} m 564 ${tableY + 16} l S`);
    add("Description", 48, tableY, 9, true);
    add("Qty", 360, tableY, 9, true);
    add("Rate", 418, tableY, 9, true);
    add("Amount", 500, tableY, 9, true);
  };
  add(label, label === "ESTIMATE" ? 420 : 440, 744, 22, true);
  add(business.businessName || "Receipt Cycle", 48, 748, 16, true);
  if (business.email) add(business.email, 48, 730, 9);
  if (business.phone) add(business.phone, 48, 716, 9);
  add(`${label === "INVOICE" ? "Invoice" : "Estimate"} #: ${draft.invoiceNumber}`, 392, 714, 9);
  add(`Issue date: ${draft.issueDate}`, 392, 700, 9);
  add(`${label === "INVOICE" ? "Due date" : "Valid until"}: ${draft.dueDate}`, 392, 686, 9);
  add("BILL TO", 48, 670, 9, true);
  add(customer.name, 48, 654, 11, true);
  let customerY = 639;
  wrap(customer.billingAddress || customer.email || "", 46).slice(0, 4).forEach((line) => { add(line, 48, customerY, 9); customerY -= 13; });
  addTableHeader(562);
  let y = 540;
  draft.items.forEach((item) => {
    const detail = wrap(item.description, 55)[0];
    const rowHeight = detail ? 39 : 27;
    if (y - rowHeight < 220) {
      pages.push(commands);
      commands = [];
      add(`${label} ${draft.invoiceNumber} — continued`, 48, 744, 13, true);
      addTableHeader(716);
      y = 694;
    }
    add(item.name, 48, y, 9, true);
    add(String(item.quantity), 364, y, 9);
    add(`${currency} ${item.rate.toFixed(2)}`, 410, y, 9);
    add(`${currency} ${(item.quantity * item.rate).toFixed(2)}`, 492, y, 9);
    if (detail) { add(detail, 48, y - 13, 8); y -= 12; }
    y -= 27;
  });
  if (y < 220) {
    pages.push(commands);
    commands = [];
    add(`${label} ${draft.invoiceNumber} — totals`, 48, 744, 13, true);
    y = 650;
  }
  const summaryY = Math.min(y - 16, 300);
  commands.push(`0.82 G 330 ${summaryY + 30} m 564 ${summaryY + 30} l S`);
  add("Subtotal", 382, summaryY + 12, 9);
  add(`${currency} ${totals.subtotal.toFixed(2)}`, 490, summaryY + 12, 9);
  add(`Discount (${draft.discountType === "percentage" ? `${draft.discountValue}%` : "fixed"})`, 382, summaryY - 5, 9);
  add(`-${currency} ${totals.discountAmount.toFixed(2)}`, 486, summaryY - 5, 9);
  add(`${draft.taxLabel} (${draft.taxRate}%)`, 382, summaryY - 22, 9);
  add(`${currency} ${totals.taxAmount.toFixed(2)}`, 490, summaryY - 22, 9);
  if (draft.shipping > 0) { add("Shipping", 382, summaryY - 39, 9); add(`${currency} ${draft.shipping.toFixed(2)}`, 490, summaryY - 39, 9); }
  add("TOTAL", 382, summaryY - 62, 13, true);
  add(`${currency} ${totals.total.toFixed(2)}`, 474, summaryY - 62, 13, true);
  let noteY = Math.max(72, summaryY - 112);
  wrap(draft.notes, 78).slice(0, 4).forEach((line) => { add(line, 48, noteY, 8); noteY -= 12; });
  add(`Terms: ${draft.terms}`, 48, 45, 8);
  pages.push(commands);
  pages.forEach((page, index) => page.push(textCommand(`Page ${index + 1} of ${pages.length}`, 510, 25, 7)));

  const pageIds = pages.map((_, index) => 5 + index * 2);
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
  ];
  pages.forEach((page, index) => {
    const stream = `${page.join("\n")}\n`;
    const contentId = 6 + index * 2;
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`);
    objects.push(`<< /Length ${bytes(stream).length} >>\nstream\n${stream}endstream`);
  });
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  objects.forEach((object, index) => {
    offsets.push(bytes(pdf).length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = bytes(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => { pdf += `${String(offset).padStart(10, "0")} 00000 n \n`; });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;

  const directory = new Directory(Paths.document, "ReceiptCycle", label === "ESTIMATE" ? "Estimates" : "Invoices");
  directory.create({ idempotent: true, intermediates: true });
  const file = new File(directory, `${draft.invoiceNumber.replace(/[^A-Za-z0-9_-]/g, "-")}.pdf`);
  if (file.exists) file.delete();
  file.write(bytes(pdf));
  return file.uri;
}
