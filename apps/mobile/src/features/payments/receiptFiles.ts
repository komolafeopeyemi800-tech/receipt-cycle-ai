import { Directory, File, Paths } from "expo-file-system";
import type { BusinessProfile } from "../sales/setupData";
import type { SavedPayment } from "./model";

function ascii(value: string) { return value.normalize("NFKD").replace(/[^\x20-\x7E\n]/g, "?"); }
function pdfEscape(value: string) { return ascii(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)"); }
function xmlEscape(value: string) { return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;"); }
function bytes(value: string) { const out = new Uint8Array(value.length); for (let index = 0; index < value.length; index += 1) out[index] = value.charCodeAt(index) & 0xff; return out; }

function receiptDirectory() {
  const directory = new Directory(Paths.document, "ReceiptCycle", "Receipts");
  directory.create({ idempotent: true, intermediates: true });
  return directory;
}

export function createReceiptPdf(payment: SavedPayment, business: BusinessProfile, currency: string) {
  const command = (text: string, x: number, y: number, size = 10, bold = false) => `BT /${bold ? "F2" : "F1"} ${size} Tf ${x} ${y} Td (${pdfEscape(text)}) Tj ET`;
  const lines = [
    command(business.businessName || "Receipt Cycle", 48, 744, 18, true),
    command("PAYMENT RECEIPT", 393, 744, 16, true),
    command(`Receipt #: ${payment.receiptNumber}`, 393, 721, 9),
    command(`Date: ${payment.paymentDate}`, 393, 706, 9),
    "0.82 G 48 682 m 564 682 l S",
    command("RECEIVED FROM", 48, 655, 9, true),
    command(payment.customerName, 48, 635, 12, true),
    command(payment.customerEmail || payment.customerAddress.replace(/\n/g, ", "), 48, 619, 9),
    command("INVOICE REFERENCE", 360, 655, 9, true),
    command(payment.invoiceNumber ?? "-", 360, 635, 12, true),
    command("AMOUNT RECEIVED", 48, 555, 9, true),
    command(`${currency} ${payment.amount.toFixed(2)}`, 360, 555, 13, true),
    command("PAYMENT METHOD", 48, 525, 9),
    command(payment.method, 360, 525, 9),
    command("RECEIVED INTO", 48, 499, 9),
    command(payment.accountName, 360, 499, 9),
    command("REFERENCE", 48, 473, 9),
    command(payment.reference, 360, 473, 9),
    "0.88 G 48 444 m 564 444 l S",
    command("REMAINING BALANCE", 48, 416, 11, true),
    command(`${currency} ${payment.remainingBalance.toFixed(2)}`, 401, 416, 12, true),
    command("Thank you for your payment!", 218, 322, 10),
    command("Together, we build brighter businesses.", 185, 305, 9),
    "0.55 G 175 207 m 437 207 l S",
    command(business.businessName || "Authorized Signature", 232, 190, 9),
  ];
  const stream = `${lines.join("\n")}\n`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [5 0 R] /Count 1 >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents 6 0 R >>",
    `<< /Length ${bytes(stream).length} >>\nstream\n${stream}endstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  objects.forEach((object, index) => { offsets.push(bytes(pdf).length); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = bytes(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => { pdf += `${String(offset).padStart(10, "0")} 00000 n \n`; });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  const file = new File(receiptDirectory(), `${payment.receiptNumber}.pdf`);
  if (file.exists) file.delete();
  file.write(bytes(pdf));
  return file.uri;
}

export function createReceiptImage(payment: SavedPayment, business: BusinessProfile, currency: string) {
  const brand = xmlEscape(business.businessName || "Receipt Cycle");
  const customer = xmlEscape(payment.customerName);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1100" viewBox="0 0 720 1100">
  <rect width="720" height="1100" fill="#f8fdfb"/><rect x="45" y="35" width="630" height="1030" rx="28" fill="#fff" stroke="#dbe7ee" stroke-width="2"/>
  <rect x="78" y="78" width="64" height="64" rx="16" fill="#0f766e"/><text x="110" y="120" font-family="Arial" font-size="30" fill="#fff" text-anchor="middle">RC</text>
  <text x="160" y="104" font-family="Arial" font-size="28" font-weight="700" fill="#14213a">${brand}</text><text x="160" y="132" font-family="Arial" font-size="16" fill="#64748b">Simple Financial Tools</text>
  <text x="620" y="104" text-anchor="end" font-family="Arial" font-size="25" font-weight="700" fill="#14213a">RECEIPT</text><text x="620" y="133" text-anchor="end" font-family="Arial" font-size="15" fill="#475569">${xmlEscape(payment.receiptNumber)}</text>
  <line x1="78" y1="180" x2="642" y2="180" stroke="#94a3b8" stroke-width="2" stroke-dasharray="7 7"/>
  <text x="78" y="226" font-family="Arial" font-size="15" font-weight="700" fill="#475569">BILL TO</text><text x="78" y="258" font-family="Arial" font-size="21" font-weight="700" fill="#14213a">${customer}</text>
  <text x="642" y="226" text-anchor="end" font-family="Arial" font-size="15" font-weight="700" fill="#475569">INVOICE REF.</text><text x="642" y="258" text-anchor="end" font-family="Arial" font-size="21" font-weight="700" fill="#14213a">${xmlEscape(payment.invoiceNumber ?? "-")}</text>
  <rect x="78" y="330" width="564" height="94" rx="14" fill="#f3fbfa"/><text x="102" y="367" font-family="Arial" font-size="16" fill="#475569">Amount Received</text><text x="618" y="390" text-anchor="end" font-family="Arial" font-size="31" font-weight="700" fill="#0f766e">${xmlEscape(currency)} ${payment.amount.toFixed(2)}</text>
  <text x="102" y="487" font-family="Arial" font-size="17" fill="#475569">Payment Method</text><text x="618" y="487" text-anchor="end" font-family="Arial" font-size="17" font-weight="700" fill="#14213a">${xmlEscape(payment.method)}</text>
  <text x="102" y="535" font-family="Arial" font-size="17" fill="#475569">Received Into</text><text x="618" y="535" text-anchor="end" font-family="Arial" font-size="17" font-weight="700" fill="#14213a">${xmlEscape(payment.accountName)}</text>
  <text x="102" y="583" font-family="Arial" font-size="17" fill="#475569">Payment Date</text><text x="618" y="583" text-anchor="end" font-family="Arial" font-size="17" font-weight="700" fill="#14213a">${xmlEscape(payment.paymentDate)}</text>
  <text x="102" y="631" font-family="Arial" font-size="17" fill="#475569">Reference</text><text x="618" y="631" text-anchor="end" font-family="Arial" font-size="17" font-weight="700" fill="#14213a">${xmlEscape(payment.reference)}</text>
  <rect x="78" y="682" width="564" height="72" rx="12" fill="#edf3fa"/><text x="102" y="727" font-family="Arial" font-size="18" font-weight="700" fill="#14213a">Remaining Balance</text><text x="618" y="727" text-anchor="end" font-family="Arial" font-size="20" font-weight="700" fill="#14213a">${xmlEscape(currency)} ${payment.remainingBalance.toFixed(2)}</text>
  <text x="360" y="840" text-anchor="middle" font-family="Arial" font-size="18" fill="#475569">Thank you for your payment!</text><text x="360" y="870" text-anchor="middle" font-family="Arial" font-size="15" font-style="italic" fill="#64748b">Together, we build brighter businesses.</text>
  <line x1="220" y1="968" x2="500" y2="968" stroke="#334155"/><text x="360" y="995" text-anchor="middle" font-family="Arial" font-size="14" fill="#64748b">Authorized Signature</text></svg>`;
  const file = new File(receiptDirectory(), `${payment.receiptNumber}.svg`);
  if (file.exists) file.delete();
  file.write(svg);
  return file.uri;
}
