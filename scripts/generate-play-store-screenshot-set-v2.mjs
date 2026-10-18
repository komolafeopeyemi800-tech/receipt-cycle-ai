import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const output = path.join(root, "artifacts", "play-store-assets-v2");
const C = { navy: "#071a3a", royal: "#071575", teal: "#149184", mint: "#68e0ca", lime: "#dfff00", ink: "#07131c", paper: "#f5f6f4", coral: "#ff665d", white: "#ffffff", muted: "#8da0b4" };

const src = {
  scan: "public/landing/scan-receipt.png",
  upload: "artifacts/play-store-upload-document.png",
  voice: ".android-device-test/mobile-add-transaction-rich.png",
  invoice: "public/landing/invoice-software-og.png",
  estimate: "public/landing/estimate-quotation-software-og.png",
  payment: "public/landing/payment-tracking-software-og.png",
  budget: "public/landing/business-budgeting-software-og.png",
  report: "public/landing/expense-reporting-software-og.png",
  backup: "artifacts/play-store-backup-export.png",
  icon: "apps/mobile/assets/icon.png"
};

const frames = [
  { id: "01-scan", headline: ["Scan Receipts", "Without Retyping"], accent: 0, support: "Capture the receipt, review the details, then save." },
  { id: "02-upload", headline: ["Upload Statements", "Without the Spreadsheet Work"], accent: 0, support: "Import JPG, PNG, PDF or CSV and review every result." },
  { id: "03-voice", headline: ["Say the Transaction", "Receipt Cycle Fills It"], accent: 0, support: "Use voice or quick text, then confirm the prepared record." },
  { id: "04-invoices", headline: ["Professional Invoices", "Made Simple"], accent: 0, support: "Build, style, preview and send a polished PDF." },
  { id: "05-estimates", headline: ["Create Estimates", "Win the Work"], accent: 0, support: "Send the quote, then convert it into an invoice." },
  { id: "06-payments", headline: ["Record and Track", "Payments Faster"], accent: 1, support: "See paid, partial and overdue balances at a glance." },
  { id: "07-budgets", headline: ["Control Spending", "With Clear Budgets"], accent: 1, support: "Follow cash flow, category totals and monthly progress." },
  { id: "08-backup", headline: ["Keep Records Safe", "Ready for Your Accountant"], accent: 0, support: "Sync your account and export records with evidence links." }
];

const escapeXml = (s) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const svg = (w, h, body) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`);

function textLines(lines, { x, y, size, line = size * 1.08, color = C.white, accent = C.lime, accentIndex = -1, anchor = "start", weight = 800, family = "Arial, Helvetica, sans-serif" }) {
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="${family}" font-size="${size}" font-weight="${weight}" fill="${color}">${lines.map((v, i) => `<tspan x="${x}" dy="${i ? line : 0}" fill="${i === accentIndex ? accent : color}">${escapeXml(v)}</tspan>`).join("")}</text>`;
}

function paragraph(text, { x, y, widthChars = 42, size = 30, line = 42, color = C.muted, anchor = "start" }) {
  const words = text.split(/\s+/); const lines = []; let current = "";
  for (const word of words) { const next = current ? `${current} ${word}` : word; if (next.length > widthChars && current) { lines.push(current); current = word; } else current = next; }
  if (current) lines.push(current);
  return textLines(lines, { x, y, size, line, color, anchor, weight: 400 });
}

async function cropImage(source, width, height, { fit = "cover", position = "centre", background = C.white, radius = 0, extract } = {}) {
  let pipeline = sharp(path.join(root, source));
  if (extract) pipeline = pipeline.extract(extract);
  pipeline = pipeline.resize(width, height, { fit, position, background });
  if (radius) {
    const mask = svg(width, height, `<rect width="${width}" height="${height}" rx="${radius}" fill="#fff"/>`);
    pipeline = pipeline.composite([{ input: mask, blend: "dest-in" }]);
  }
  return pipeline.png().toBuffer();
}

async function phoneShell(source, width, height, options = {}) {
  const border = options.border ?? 16;
  const radius = options.radius ?? Math.round(width * 0.075);
  const screen = await cropImage(source, width - border * 2, height - border * 2, { fit: options.fit ?? "cover", position: options.position ?? "top", background: options.background ?? C.white, radius: radius - border });
  const shell = svg(width, height, `<defs><filter id="s"><feDropShadow dx="0" dy="18" stdDeviation="22" flood-opacity=".28"/></filter></defs><rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="${radius}" fill="#f7f7f4" stroke="#1b2229" stroke-width="${border}" filter="url(#s)"/><rect x="${width * .38}" y="${border * .55}" width="${width * .24}" height="${border * .7}" rx="${border}" fill="#1b2229"/>`);
  return sharp(shell).composite([{ input: screen, left: border, top: border }]).png().toBuffer();
}

async function docCard(source, width, height, extract) {
  const art = await cropImage(source, width, height, { fit: "cover", position: "right", background: C.white, radius: 24, extract });
  const shadow = svg(width + 40, height + 50, `<defs><filter id="s"><feDropShadow dx="0" dy="16" stdDeviation="16" flood-opacity=".25"/></filter></defs><rect x="20" y="10" width="${width}" height="${height}" rx="24" fill="#fff" filter="url(#s)"/>`);
  return sharp(shadow).composite([{ input: art, left: 20, top: 10 }]).png().toBuffer();
}

function headerPhone(frame, bg = C.royal, accent = C.lime, darkText = false) {
  const ink = darkText ? C.ink : C.white;
  const muted = darkText ? "#52606d" : "#c8d1e3";
  return svg(1080, 1920, `<rect width="1080" height="1920" fill="${bg}"/>${textLines(frame.headline, { x: 540, y: 150, size: 66, line: 74, color: ink, accent, accentIndex: frame.accent, anchor: "middle" })}${paragraph(frame.support, { x: 540, y: 350, widthChars: 48, size: 28, line: 39, color: muted, anchor: "middle" })}`);
}

async function phone01(frame) {
  const photo = await cropImage(src.scan, 1080, 1600, { fit: "cover", position: "centre" });
  const base = svg(1080, 1920, `<rect width="1080" height="1920" fill="#4472a6"/><path d="M0 0H1080V520L0 920Z" fill="#4472a6"/><path d="M0 0H1080V380L0 780Z" fill="#3d6c9f" opacity=".8"/>${textLines(frame.headline, { x: 72, y: 125, size: 72, line: 78, color: C.white, accent: C.lime, accentIndex: 0 })}${paragraph(frame.support, { x: 74, y: 335, widthChars: 43, size: 28, line: 38, color: "#e9f0f7" })}<text x="72" y="1830" font-family="Arial" font-weight="700" font-size="24" fill="#fff">RECEIPT CYCLE</text>`);
  return sharp(base).composite([
    { input: photo, left: 0, top: 320 },
    { input: svg(1080, 800, `<path d="M0 0H1080V165L0 565Z" fill="#4472a6"/><path d="M0 0H1080V25L0 425Z" fill="#3d6c9f" opacity=".7"/>`), left: 0, top: 0 },
    { input: svg(1080, 480, `${textLines(frame.headline, { x: 72, y: 125, size: 72, line: 78, color: C.white, accent: C.lime, accentIndex: 0 })}${paragraph(frame.support, { x: 74, y: 335, widthChars: 43, size: 28, line: 38, color: "#edf3f8" })}`), left: 0, top: 0 }
  ]).flatten().removeAlpha().png().toBuffer();
}

async function phone02(frame) {
  const base = headerPhone(frame);
  const device = await phoneShell(src.upload, 800, 1540, { position: "top" });
  return sharp(base).composite([{ input: device, left: 140, top: 470 }]).flatten().removeAlpha().png().toBuffer();
}

async function phone03(frame) {
  const base = headerPhone(frame, "#003f35", C.mint);
  const device = await phoneShell(src.voice, 760, 1450, { position: "top" });
  const speech = svg(740, 176, `<defs><filter id="s"><feDropShadow dy="10" stdDeviation="12" flood-opacity=".25"/></filter></defs><rect x="10" y="10" width="720" height="145" rx="28" fill="#fff" filter="url(#s)"/><circle cx="82" cy="82" r="38" fill="${C.teal}"/><text x="82" y="94" text-anchor="middle" font-family="Arial" font-size="34" fill="#fff">●</text><text x="140" y="72" font-family="Arial" font-size="25" font-weight="700" fill="${C.ink}">“Forty dollars of fuel yesterday”</text><text x="140" y="112" font-family="Arial" font-size="22" fill="#52606d">Prepared as an editable expense</text>`);
  return sharp(base).composite([{ input: device, left: 160, top: 485 }, { input: speech, left: 170, top: 625 }]).flatten().removeAlpha().png().toBuffer();
}

async function phone04(frame) {
  const base = headerPhone(frame);
  const cardA = await docCard(src.invoice, 760, 980, { left: 690, top: 40, width: 450, height: 550 });
  const settings = await cropImage("artifacts/play-store-document-settings.png", 520, 1040, { fit: "cover", position: "top", radius: 36 });
  return sharp(base).composite([{ input: cardA, left: 220, top: 600 }, { input: settings, left: 0, top: 940 }]).flatten().removeAlpha().png().toBuffer();
}

async function phone05(frame) {
  const base = headerPhone(frame);
  const card = await docCard(src.estimate, 820, 1100, { left: 680, top: 35, width: 470, height: 560 });
  const sendBar = svg(820, 210, `<defs><filter id="s"><feDropShadow dy="12" stdDeviation="14" flood-opacity=".3"/></filter></defs><rect x="10" y="10" width="800" height="175" rx="28" fill="#fff" filter="url(#s)"/><text x="70" y="70" font-family="Arial" font-size="24" fill="#52606d">Send estimate</text><rect x="65" y="92" width="185" height="62" rx="16" fill="#e8fff8"/><text x="157" y="132" text-anchor="middle" font-family="Arial" font-size="24" font-weight="700" fill="${C.teal}">EMAIL</text><rect x="270" y="92" width="185" height="62" rx="16" fill="#eef4ff"/><text x="362" y="132" text-anchor="middle" font-family="Arial" font-size="24" font-weight="700" fill="#2f65d9">SHARE</text><rect x="475" y="92" width="185" height="62" rx="16" fill="#f3eeff"/><text x="568" y="132" text-anchor="middle" font-family="Arial" font-size="24" font-weight="700" fill="#7740d8">PRINT</text>`);
  return sharp(base).composite([{ input: card, left: 130, top: 520 }, { input: sendBar, left: 130, top: 1260 }]).flatten().removeAlpha().png().toBuffer();
}

async function phone06(frame) {
  const base = headerPhone(frame);
  const payment = await docCard(src.payment, 780, 1040, { left: 690, top: 25, width: 455, height: 565 });
  const chips = svg(950, 430, `<defs><filter id="s"><feDropShadow dy="12" stdDeviation="12" flood-opacity=".28"/></filter></defs>${[[40,30,"PAID","#149184","$1,250 received"],[90,155,"PARTIAL","#f2a900","$800 remaining"],[140,280,"OVERDUE","#e63958","3 days overdue"]].map(([x,y,label,color,sub])=>`<rect x="${x}" y="${y}" width="760" height="110" rx="24" fill="#fff" filter="url(#s)"/><rect x="${x+24}" y="${y+26}" width="145" height="58" rx="14" fill="${color}"/><text x="${x+96}" y="${y+64}" text-anchor="middle" font-family="Arial" font-weight="800" font-size="22" fill="#fff">${label}</text><text x="${x+205}" y="${y+66}" font-family="Arial" font-size="27" font-weight="700" fill="${C.ink}">${sub}</text>`).join("")}`);
  return sharp(base).composite([{ input: payment, left: 170, top: 520 }, { input: chips, left: 65, top: 1190 }]).flatten().removeAlpha().png().toBuffer();
}

async function phone07(frame) {
  const base = headerPhone(frame, C.paper, C.coral, true);
  const budget = await cropImage(src.budget, 900, 1050, { fit: "cover", position: "centre", radius: 42, extract: { left: 640, top: 0, width: 560, height: 630 } });
  const chart = await cropImage(src.report, 760, 420, { fit: "cover", position: "centre", radius: 30, extract: { left: 640, top: 0, width: 560, height: 630 } });
  return sharp(base).composite([{ input: budget, left: 90, top: 530 }, { input: chart, left: 160, top: 1370 }]).flatten().removeAlpha().png().toBuffer();
}

async function phone08(frame) {
  const base = svg(1080, 1920, `<rect width="1080" height="1920" fill="#0b0d0c"/><circle cx="1050" cy="50" r="300" fill="#1c7a3c" opacity=".9"/><circle cx="60" cy="1900" r="270" fill="#1c7a3c" opacity=".8"/>${textLines(frame.headline, { x: 70, y: 135, size: 65, line: 72, color: C.white, accent: C.mint, accentIndex: 0 })}${paragraph(frame.support, { x: 72, y: 355, widthChars: 42, size: 28, line: 39, color: "#c7cfca" })}`);
  const backup = await phoneShell(src.backup, 520, 1160, { position: "top", border: 12 });
  const cards = svg(480, 760, `${[[0,"IMPORT","Choose files"],[245,"BACKUP","Stay connected"],[490,"EXPORT","Share records"]].map(([y,t,s])=>`<rect x="0" y="${y}" width="450" height="210" rx="28" fill="#0c1117" stroke="#6f7480" stroke-width="3"/><circle cx="72" cy="${y+72}" r="34" fill="#1c7a3c"/><text x="130" y="${y+72}" font-family="Arial" font-size="29" font-weight="800" fill="#fff">${t}</text><text x="130" y="${y+118}" font-family="Arial" font-size="23" fill="#bfc7d2">${s}</text>`).join("")}`);
  return sharp(base).composite([{ input: cards, left: 70, top: 570 }, { input: backup, left: 535, top: 610 }]).flatten().removeAlpha().png().toBuffer();
}

const phoneRenderers = [phone01, phone02, phone03, phone04, phone05, phone06, phone07, phone08];

async function tabletFrame(frame, index, ten) {
  const w = 1920, h = 1080;
  const scale = ten ? 1 : .92;
  const titleSize = ten ? 64 : 58;
  const left = ten ? 88 : 72;
  let bg = index === 6 ? C.paper : (index === 7 ? "#0b0d0c" : index === 2 ? "#003f35" : C.royal);
  let accent = index === 6 ? C.coral : (index === 2 || index === 7 ? C.mint : C.lime);
  let ink = index === 6 ? C.ink : C.white;
  const base = svg(w, h, `<rect width="${w}" height="${h}" fill="${bg}"/><circle cx="1900" cy="-10" r="300" fill="${accent}" opacity=".10"/><circle cx="20" cy="1100" r="260" fill="${accent}" opacity=".08"/>${textLines(frame.headline, { x: left, y: 155, size: titleSize, line: titleSize * 1.08, color: ink, accent, accentIndex: frame.accent })}${paragraph(frame.support, { x: left, y: 375, widthChars: ten ? 39 : 36, size: 29, line: 41, color: index === 6 ? "#52606d" : "#c8d1e3" })}<text x="${left}" y="1000" font-family="Arial" font-size="23" font-weight="700" letter-spacing="2" fill="${accent}">RECEIPT CYCLE</text>`);

  const comps = [];
  if (index === 0) {
    const scan = await cropImage(src.scan, Math.round(960 * scale), Math.round(760 * scale), { fit: "cover", position: "centre", radius: 36 });
    const phone = await phoneShell(src.upload, Math.round(390 * scale), Math.round(820 * scale), { position: "top", border: 11 });
    comps.push({ input: scan, left: ten ? 820 : 900, top: ten ? 155 : 185 }, { input: phone, left: ten ? 690 : 775, top: ten ? 175 : 205 });
  } else if (index === 1) {
    const phone = await phoneShell(src.upload, Math.round(620 * scale), Math.round(920 * scale), { position: "top", border: 13 });
    const side = await cropImage(src.report, Math.round(610 * scale), Math.round(560 * scale), { fit: "cover", position: "right", radius: 32 });
    comps.push({ input: side, left: ten ? 760 : 845, top: 300 }, { input: phone, left: ten ? 1180 : 1250, top: 80 });
  } else if (index === 2) {
    const main = await phoneShell(src.voice, Math.round(600 * scale), Math.round(930 * scale), { position: "top", border: 13 });
    const transcript = svg(640, 270, `<rect x="10" y="10" width="620" height="230" rx="32" fill="#fff"/><text x="48" y="72" font-family="Arial" font-size="24" fill="#52606d">YOU SAID</text><text x="48" y="128" font-family="Arial" font-size="30" font-weight="700" fill="${C.ink}">“Forty dollars of fuel yesterday”</text><rect x="48" y="160" width="300" height="48" rx="14" fill="#e8fff8"/><text x="198" y="192" text-anchor="middle" font-family="Arial" font-size="22" font-weight="700" fill="${C.teal}">EXPENSE PREPARED</text>`);
    comps.push({ input: transcript, left: ten ? 720 : 800, top: 280 }, { input: main, left: ten ? 1240 : 1290, top: 80 });
  } else if (index === 3) {
    const a = await docCard(src.invoice, Math.round(520 * scale), Math.round(760 * scale), { left: 690, top: 35, width: 455, height: 560 });
    const b = await docCard(src.estimate, Math.round(470 * scale), Math.round(700 * scale), { left: 680, top: 35, width: 470, height: 560 });
    const c = await cropImage("artifacts/play-store-document-settings.png", Math.round(430 * scale), Math.round(780 * scale), { fit: "cover", position: "top", radius: 32 });
    comps.push({ input: c, left: ten ? 680 : 760, top: 230 }, { input: b, left: ten ? 1050 : 1110, top: 165 }, { input: a, left: ten ? 1390 : 1410, top: 95 });
  } else if (index === 4) {
    const est = await docCard(src.estimate, Math.round(720 * scale), Math.round(820 * scale), { left: 650, top: 20, width: 510, height: 585 });
    const send = svg(660, 300, `<rect x="10" y="10" width="640" height="255" rx="32" fill="#fff"/><text x="45" y="65" font-family="Arial" font-size="24" fill="#52606d">SEND AND SHARE</text>${[[45,"EMAIL",C.teal],[235,"PDF","#2f65d9"],[425,"PRINT","#7740d8"]].map(([x,t,c])=>`<rect x="${x}" y="105" width="165" height="95" rx="22" fill="${c}"/><text x="${x+82}" y="163" text-anchor="middle" font-family="Arial" font-size="24" font-weight="800" fill="#fff">${t}</text>`).join("")}`);
    comps.push({ input: est, left: ten ? 760 : 820, top: 120 }, { input: send, left: ten ? 1260 : 1300, top: 570 });
  } else if (index === 5) {
    const pay = await docCard(src.payment, Math.round(690 * scale), Math.round(820 * scale), { left: 680, top: 20, width: 470, height: 575 });
    const chips = svg(670, 540, `${[[0,"FULLY PAID","#149184","$1,250.00"],[165,"PARTIAL","#f2a900","$800.00 due"],[330,"OVERDUE","#e63958","3 days"]].map(([y,t,c,s])=>`<rect x="10" y="${y+10}" width="630" height="130" rx="26" fill="#fff"/><rect x="38" y="${y+42}" width="170" height="62" rx="15" fill="${c}"/><text x="123" y="${y+81}" text-anchor="middle" font-family="Arial" font-size="21" font-weight="800" fill="#fff">${t}</text><text x="245" y="${y+82}" font-family="Arial" font-size="28" font-weight="700" fill="${C.ink}">${s}</text>`).join("")}`);
    comps.push({ input: pay, left: ten ? 740 : 815, top: 130 }, { input: chips, left: ten ? 1290 : 1320, top: 320 });
  } else if (index === 6) {
    const budget = await cropImage(src.budget, Math.round(850 * scale), Math.round(720 * scale), { fit: "cover", position: "centre", radius: 36, extract: { left: 640, top: 0, width: 560, height: 630 } });
    const report = await cropImage(src.report, Math.round(700 * scale), Math.round(560 * scale), { fit: "cover", position: "centre", radius: 32, extract: { left: 640, top: 0, width: 560, height: 630 } });
    comps.push({ input: report, left: ten ? 730 : 805, top: 340 }, { input: budget, left: ten ? 1110 : 1160, top: 125 });
  } else {
    const backup = await phoneShell(src.backup, Math.round(480 * scale), Math.round(900 * scale), { position: "top", border: 12 });
    const cards = svg(700, 660, `${[[0,"IMPORT","Bring in receipts and statements"],[205,"BACKUP","Keep signed-in records connected"],[410,"EXPORT","Share CSV records with evidence links"]].map(([y,t,s])=>`<rect x="0" y="${y}" width="680" height="170" rx="26" fill="#0c1117" stroke="#6f7480" stroke-width="3"/><circle cx="72" cy="${y+70}" r="34" fill="#1c7a3c"/><text x="130" y="${y+64}" font-family="Arial" font-size="29" font-weight="800" fill="#fff">${t}</text><text x="130" y="${y+108}" font-family="Arial" font-size="22" fill="#c6cbd3">${s}</text>`).join("")}`);
    comps.push({ input: cards, left: ten ? 690 : 770, top: 280 }, { input: backup, left: ten ? 1400 : 1440, top: 100 });
  }
  return sharp(base).composite(comps).flatten({ background: bg }).removeAlpha().png({ compressionLevel: 9 }).toBuffer();
}

async function contact(kind, width, height) {
  const dir = path.join(output, kind); const names = frames.map(f => `${f.id}.png`);
  const tw = kind === "phone" ? 270 : 480; const th = Math.round(tw * height / width); const gap = 24;
  const sheet = sharp({ create: { width: tw * 4 + gap * 5, height: th * 2 + gap * 3, channels: 3, background: "#e6e7e4" } });
  const layers = [];
  for (let i = 0; i < names.length; i++) layers.push({ input: await sharp(path.join(dir, names[i])).resize(tw, th).png().toBuffer(), left: gap + (i % 4) * (tw + gap), top: gap + Math.floor(i / 4) * (th + gap) });
  await sheet.composite(layers).png().toFile(path.join(output, `${kind}-contact-sheet.png`));
}

for (const d of [output, path.join(output, "phone"), path.join(output, "tablet-7"), path.join(output, "tablet-10")]) await fs.mkdir(d, { recursive: true });

for (let i = 0; i < frames.length; i++) {
  await sharp(await phoneRenderers[i](frames[i])).toFile(path.join(output, "phone", `${frames[i].id}.png`));
  await sharp(await tabletFrame(frames[i], i, false)).toFile(path.join(output, "tablet-7", `${frames[i].id}.png`));
  await sharp(await tabletFrame(frames[i], i, true)).toFile(path.join(output, "tablet-10", `${frames[i].id}.png`));
}

await contact("phone", 1080, 1920);
await contact("tablet-7", 1920, 1080);
await contact("tablet-10", 1920, 1080);
await fs.copyFile(path.join(root, src.icon), path.join(output, "receipt-cycle-play-icon-512.png"));
await fs.writeFile(path.join(output, "README.md"), `# Receipt Cycle Google Play creative v2\n\nThis version replaces the rejected generic template system. It is built from the competitor-derived composition rules supplied by the user: feature-led headline hierarchy, selective accent words, oversized product evidence, controlled crops, layered document/status cards, diagonal receipt framing, and dark or editorial-light feature families.\n\n- phone: 8 PNG files at 1080 x 1920\n- tablet-7: 8 PNG files at 1920 x 1080\n- tablet-10: 8 PNG files at 1920 x 1080\n- all screenshots are opaque 24-bit PNG\n\nThe set uses Receipt Cycle repository assets and clean Android captures. No competitor logos, wording, metrics, awards or proprietary UI were copied. Tablet imagery remains a marketing composition until genuine tablet-specific product captures are available.\n`);
console.log(`Generated redesigned v2 assets in ${output}`);
