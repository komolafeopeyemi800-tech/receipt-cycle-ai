import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const out = path.join(root, "artifacts", "play-store-assets-v3");
const receiptPhoto = path.join(out, "sources", "generated", "natural-receipt-desk.png");

const C = {
  teal: "#13877f", teal2: "#0b706b", mint: "#79e2ca", mintPale: "#e8f7f2",
  navy: "#07162e", navy2: "#0d2143", ink: "#0b1730", slate: "#53647b",
  line: "#d8e2eb", paper: "#f5f8f6", white: "#ffffff", blue: "#1769ff",
  coral: "#f34f55", amber: "#f4a51c", green: "#19a67a", lavender: "#f3ebff"
};

const esc = (s) => String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const svg = (w, h, body) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><filter id="shadow" x="-30%" y="-30%" width="160%" height="180%"><feDropShadow dx="0" dy="24" stdDeviation="28" flood-color="#071522" flood-opacity=".22"/></filter><filter id="soft" x="-30%" y="-30%" width="160%" height="180%"><feDropShadow dx="0" dy="12" stdDeviation="15" flood-color="#071522" flood-opacity=".15"/></filter><filter id="beam" x="-20%" y="-400%" width="140%" height="900%"><feGaussianBlur stdDeviation="12"/></filter></defs>${body}</svg>`);

function lines(items, x, y, size, color, { weight = 800, line = size * 1.06, anchor = "start", accent = -1, accentColor = C.mint, family = "Segoe UI, Arial, sans-serif" } = {}) {
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="${family}" font-size="${size}" font-weight="${weight}" fill="${color}">${items.map((v, i) => `<tspan x="${x}" dy="${i ? line : 0}" fill="${i === accent ? accentColor : color}">${esc(v)}</tspan>`).join("")}</text>`;
}

function label(text, x, y, size = 28, color = C.ink, weight = 600, anchor = "start") {
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Segoe UI, Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}">${esc(text)}</text>`;
}

function icon(type, x, y, s = 32, color = C.teal) {
  const sw = Math.max(2.5, s / 11);
  const common = `fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"`;
  const p = {
    mic: `<path ${common} d="M${x+s*.38} ${y+s*.16}v${s*.38}a${s*.12} ${s*.12} 0 0 0 ${s*.24} 0v-${s*.38}a${s*.12} ${s*.12} 0 0 0-${s*.24} 0M${x+s*.22} ${y+s*.5}a${s*.28} ${s*.28} 0 0 0 ${s*.56} 0M${x+s*.5} ${y+s*.78}v${s*.14}M${x+s*.34} ${y+s*.92}h${s*.32}"/>`,
    edit: `<path ${common} d="M${x+s*.2} ${y+s*.76}l${s*.08}-${s*.28} ${s*.42}-${s*.42} ${s*.22} ${s*.22}-${s*.42} ${s*.42}-${s*.28} ${s*.08}zM${x+s*.62} ${y+s*.14}l${s*.22} ${s*.22}"/>`,
    doc: `<path ${common} d="M${x+s*.24} ${y+s*.1}h${s*.36}l${s*.18} ${s*.18}v${s*.62}h-${s*.54}zM${x+s*.6} ${y+s*.1}v${s*.2}h${s*.2}M${x+s*.34} ${y+s*.52}h${s*.34}M${x+s*.34} ${y+s*.67}h${s*.28}"/>`,
    folder: `<path ${common} d="M${x+s*.1} ${y+s*.28}h${s*.3}l${s*.1} ${s*.12}h${s*.4}v${s*.4}h-${s*.8}z"/>`,
    bell: `<path ${common} d="M${x+s*.25} ${y+s*.68}h${s*.5}l-${s*.08}-${s*.13}v-${s*.2}a${s*.17} ${s*.17} 0 0 0-${s*.34} 0v${s*.2}zM${x+s*.42} ${y+s*.78}a${s*.08} ${s*.08} 0 0 0 ${s*.16} 0"/>`,
    chart: `<path ${common} d="M${x+s*.16} ${y+s*.86}v-${s*.68}M${x+s*.16} ${y+s*.86}h${s*.7}M${x+s*.28} ${y+s*.68}l${s*.16}-${s*.2} ${s*.15} ${s*.11} ${s*.2}-${s*.3}"/>`,
    check: `<path ${common} d="M${x+s*.18} ${y+s*.52}l${s*.2} ${s*.2} ${s*.45}-${s*.5}"/>`,
    upload: `<path ${common} d="M${x+s*.5} ${y+s*.72}v-${s*.5}M${x+s*.3} ${y+s*.42}l${s*.2}-${s*.2} ${s*.2} ${s*.2}M${x+s*.18} ${y+s*.78}h${s*.64}"/>`
  };
  return p[type] || p.doc;
}

function field(x, y, w, title, value, ico = "doc") {
  return `${label(title, x, y - 18, 24, C.slate, 700)}<rect x="${x}" y="${y}" width="${w}" height="92" rx="20" fill="#fff" stroke="${C.line}" stroke-width="2"/><rect x="${x}" y="${y}" width="82" height="92" rx="20" fill="#f1faf7"/>${icon(ico, x + 24, y + 26, 40)}${label(value, x + 108, y + 58, 29, C.ink, 500)}`;
}

function topbar(title, w, action = "") {
  return `<rect width="${w}" height="104" fill="#fff"/><path d="M48 51h34m-34 0 16-16m-16 16 16 16" fill="none" stroke="${C.ink}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>${label(title, 118, 66, 36, C.ink, 800)}${action ? `<rect x="${w-190}" y="22" width="150" height="60" rx="18" fill="#fff" stroke="${C.teal}" stroke-width="3"/>${label(action, w-115, 62, 24, C.teal, 800, "middle")}` : ""}`;
}

function appScreenVoice(w = 700, h = 1110) {
  const x = 34, fw = w - 68;
  return `<g><rect width="${w}" height="${h}" rx="42" fill="#f8fbfa"/>${topbar("Add Expense", w)}<rect x="${x}" y="132" width="${fw}" height="82" rx="40" fill="#eaf0f5"/><rect x="${x+6}" y="138" width="${fw/2-6}" height="70" rx="35" fill="${C.teal}"/>${label("Expense", x+fw/4, 186, 27, C.white, 800, "middle")}${label("Income", x+fw*.75, 186, 27, C.slate, 700, "middle")}<rect x="${x}" y="250" width="${fw}" height="150" rx="26" fill="${C.lavender}" stroke="#dfd3ee" stroke-width="2"/><rect x="${x+24}" y="284" width="66" height="66" rx="18" fill="#fff"/>${icon("mic", x+39, 299, 36)}<rect x="${x+102}" y="284" width="66" height="66" rx="18" fill="#fff"/>${icon("edit", x+117, 299, 36, C.blue)}${label("AI Capture", x+195, 302, 28, C.ink, 800)}${label("Speak or type to fill this form", x+195, 342, 23, C.slate, 500)}${field(x, 460, fw, "Amount", "$42.80", "doc")}${field(x, 610, fw, "Merchant", "Northside Market", "doc")}${field(x, 760, fw, "Category", "Groceries", "doc")}${field(x, 910, fw, "Paid from / account", "Cash", "doc")}</g>`;
}

function uploadPanel(w = 620, h = 760) {
  return `<g><rect width="${w}" height="${h}" rx="34" fill="#fff" stroke="${C.line}" stroke-width="2"/>${topbar("Upload document", w)}<rect x="42" y="145" width="${w-84}" height="470" rx="28" fill="#fff" stroke="#dbe4ed" stroke-width="4" stroke-dasharray="12 12"/>${icon("folder", w/2-48, 205, 96, "#708096")}${label("Upload your files", w/2, 355, 32, C.ink, 800, "middle")}${label("JPG · PNG · PDF · CSV", w/2, 405, 24, C.slate, 600, "middle")}<rect x="110" y="470" width="${w-220}" height="78" rx="22" fill="${C.teal}"/>${icon("upload", 145, 490, 40, C.white)}${label("Browse files", w/2+20, 521, 27, C.white, 800, "middle")}<rect x="54" y="646" width="${w-108}" height="76" rx="22" fill="#e8f3ff"/>${label("Reviewed files keep their source evidence", w/2, 694, 21, C.slate, 600, "middle")}</g>`;
}

function evidencePanel(w = 600, h = 860) {
  return `<g><rect width="${w}" height="${h}" rx="34" fill="#fff" stroke="${C.line}" stroke-width="2"/>${topbar("Transaction", w)}${label("Northside Market", 42, 168, 34, C.ink, 800)}${label("17 Oct 2026 · Groceries", 42, 208, 23, C.slate, 500)}${label("$42.80", w-42, 175, 38, C.teal, 800, "end")}<rect x="38" y="250" width="${w-76}" height="166" rx="24" fill="#f4faf8"/>${label("Receipt summary", 68, 292, 23, C.slate, 700)}${label("Subtotal", 68, 338, 24, C.slate, 500)}${label("$39.60", w-68, 338, 24, C.ink, 700, "end")}${label("Tax", 68, 377, 24, C.slate, 500)}${label("$3.20", w-68, 377, 24, C.ink, 700, "end")}<rect x="38" y="448" width="${w-76}" height="270" rx="24" fill="#f1f0ec"/><path d="M145 680h310l-26-190H170z" fill="#fff" stroke="#d1d1cf" stroke-width="2"/>${label("NORTHSIDE MARKET", 300, 535, 18, C.ink, 800, "middle")}${label("TOTAL  $42.80", 300, 642, 19, C.ink, 800, "middle")}<rect x="38" y="748" width="${w-76}" height="72" rx="20" fill="#e9f7f3"/>${icon("doc", 62, 766, 38)}${label("Open original evidence", 118, 792, 24, C.teal, 800)}</g>`;
}

function stepper(w, labels = ["Basic Info", "Items", "Details", "Review"]) {
  const gap = (w - 130) / 3;
  return `<path d="M65 65H${w-65}" stroke="#dfe7ed" stroke-width="8"/>${labels.map((t,i)=>{const cx=65+i*gap;return `<circle cx="${cx}" cy="65" r="34" fill="${i===0?C.teal:"#edf2f6"}"/>${label(i+1,cx,75,26,i===0?C.white:C.slate,800,"middle")}${label(t,cx,124,18,i===0?C.teal:C.slate,700,"middle")}`}).join("")}`;
}

function builderPanel(kind = "Invoice", w = 660, h = 1000) {
  const isEst = kind === "Estimate";
  return `<g><rect width="${w}" height="${h}" rx="36" fill="#f8fbfa"/>${topbar(`Create ${kind}`, w, "Save Draft")}<g transform="translate(38 122)">${stepper(w-76, isEst?["Basic Info","Items","Totals","Extras"]:undefined)}</g>${field(42, 310, w-84, `${kind} Number`, isEst?"EST-2026-001":"INV-2026-001", "doc")}${field(42, 460, w-84, `${kind} Title`, isEst?"Q4 website refresh":"Website design project", "edit")}${field(42, 610, w-84, isEst?"Estimate Date":"Issue Date", "17 Oct 2026", "doc")}${field(42, 760, w-84, "Customer", "Acme Studio", "doc")}<rect x="42" y="900" width="${w-84}" height="72" rx="22" fill="${C.teal}"/>${label(isEst?"Next: Add Items":"Continue to Items",w/2,946,26,C.white,800,"middle")}</g>`;
}

function documentPreview(kind = "INVOICE", w = 500, h = 720) {
  const code = kind === "INVOICE" ? "INV-2026-001" : "EST-2026-001";
  return `<g><rect width="${w}" height="${h}" rx="18" fill="#fff" filter="url(#shadow)"/>${label("RECEIPT CYCLE", 38, 58, 18, C.teal, 800)}${label(kind, w-38, 62, 36, C.ink, 900, "end")}${label(code, w-38, 96, 18, C.slate, 600, "end")}<rect x="38" y="126" width="${w-76}" height="5" fill="${C.teal}"/>${label("Bill to", 38, 174, 17, C.slate, 700)}${label("Acme Studio", 38, 205, 23, C.ink, 800)}${label("17 Oct 2026", w-38, 205, 20, C.slate, 600, "end")}<rect x="38" y="250" width="${w-76}" height="42" fill="#eef7f5"/>${label("DESCRIPTION", 52, 278, 15, C.slate, 800)}${label("AMOUNT", w-52, 278, 15, C.slate, 800, "end")}${[["Discovery & planning","$450.00"],["Interface design","$1,200.00"],["Implementation","$800.00"]].map(([a,b],i)=>`${label(a,52,335+i*58,18,C.ink,600)}${label(b,w-52,335+i*58,18,C.ink,700,"end")}<path d="M42 ${354+i*58}H${w-42}" stroke="#edf0f2"/>`).join("")}${label("Subtotal", w-190, 545, 18, C.slate,600)}${label("$2,450.00",w-42,545,18,C.ink,700,"end")}${label("Tax", w-190, 582, 18, C.slate,600)}${label("$196.00",w-42,582,18,C.ink,700,"end")}<rect x="${w-220}" y="608" width="178" height="62" rx="12" fill="#e7f7f2"/>${label("TOTAL",w-198,646,16,C.teal,800)}${label("$2,646.00",w-55,646,20,C.teal,900,"end")}<path d="M38 686H${w-38}" stroke="#dfe7e5"/>${label(kind==="INVOICE"?"Thank you for your business":"Valid for 30 days",38,707,15,C.slate,500)}</g>`;
}

function shareSheet(w = 520, h = 280) {
  return `<g><rect width="${w}" height="${h}" rx="28" fill="#fff" filter="url(#soft)"/>${label("Share estimate", 34, 52, 24, C.ink, 800)}${[["Email",C.teal],["PDF",C.blue],["More","#7653d6"]].map(([t,c],i)=>`<rect x="${34+i*158}" y="82" width="128" height="112" rx="24" fill="${c}"/>${icon(i===0?"doc":i===1?"upload":"edit",65+i*158,102,54,C.white)}${label(t,98+i*158,225,20,C.slate,700,"middle")}`).join("")}</g>`;
}

function paymentPanel(w = 680, h = 950) {
  const rows = [
    ["INV-2026-014","Riverstone Co.","Paid","$1,250.00",C.green],
    ["INV-2026-013","Oak & Pine Studio","Partially paid","$620.00 due",C.amber],
    ["INV-2026-009","Northstar Labs","Overdue","$840.00",C.coral]
  ];
  return `<g><rect width="${w}" height="${h}" rx="36" fill="#f8fbfa"/>${topbar("Invoices",w)}<rect x="36" y="132" width="${w-72}" height="72" rx="24" fill="#edf2f5"/>${label("All",80,178,22,C.teal,800)}${label("Open",190,178,22,C.slate,600)}${label("Paid",320,178,22,C.slate,600)}${label("Overdue",445,178,22,C.slate,600)}${rows.map((r,i)=>{const y=244+i*190;return `<rect x="36" y="${y}" width="${w-72}" height="156" rx="26" fill="#fff" stroke="${C.line}" stroke-width="2"/>${label(r[0],64,y+42,21,C.slate,700)}${label(r[1],64,y+82,27,C.ink,800)}<rect x="64" y="${y+105}" width="150" height="34" rx="17" fill="${r[4]}22"/>${label(r[2],139,y+128,17,r[4],800,"middle")}${label(r[3],w-64,y+86,26,r[4],800,"end")}`}).join("")}<rect x="36" y="840" width="${w-72}" height="76" rx="22" fill="#e8f6f2"/>${label("Outstanding balance",64,887,22,C.slate,600)}${label("$1,460.00",w-64,887,27,C.teal,800,"end")}</g>`;
}

function budgetPanel(w = 700, h = 920) {
  const cats=[["Groceries",420,600,C.teal],["Transport",260,500,C.amber],["Subscriptions",180,300,C.blue]];
  return `<g><rect width="${w}" height="${h}" rx="36" fill="#fff" filter="url(#shadow)"/>${topbar("Budgets",w)}${label("October overview",42,165,23,C.slate,600)}${label("$860 left of $1,400",42,215,34,C.ink,800)}<rect x="42" y="248" width="${w-84}" height="18" rx="9" fill="#e9eef2"/><rect x="42" y="248" width="380" height="18" rx="9" fill="${C.teal}"/>${cats.map((r,i)=>{const y=340+i*145;const used=Math.round((r[1]/r[2])*(w-84));return `${label(r[0],42,y,25,C.ink,800)}${label(`$${r[1]} / $${r[2]}`,w-42,y,21,C.slate,600,"end")}<rect x="42" y="${y+34}" width="${w-84}" height="20" rx="10" fill="#edf1f3"/><rect x="42" y="${y+34}" width="${used}" height="20" rx="10" fill="${r[3]}"/>`}).join("")}<rect x="42" y="785" width="${w-84}" height="94" rx="22" fill="#eef8f5"/>${icon("chart",66,808,50)}${label("View cash-flow report",138,842,24,C.teal,800)}</g>`;
}

function chartCard(w = 560, h = 520) {
  const bars=[160,245,205,300,270,360];
  return `<g><rect width="${w}" height="${h}" rx="30" fill="#fff" filter="url(#soft)"/>${label("Cash flow",34,58,28,C.ink,800)}${label("Last 6 months",w-34,58,18,C.slate,600,"end")}<path d="M54 400H${w-38}" stroke="#dfe6ea" stroke-width="2"/>${bars.map((b,i)=>`<rect x="${65+i*76}" y="${400-b}" width="32" height="${b}" rx="10" fill="${i===5?C.teal:"#bfe8dc"}"/>`).join("")}${label("Income",40,472,18,C.teal,700)}${label("Expenses",145,472,18,C.coral,700)}${label("+$2,180",w-34,472,26,C.teal,900,"end")}</g>`;
}

function exportPanel(w = 660, h = 830) {
  return `<g><rect width="${w}" height="${h}" rx="34" fill="#0a111d" stroke="#586376" stroke-width="2"/>${label("Backup & export",38,68,34,C.white,800)}${[["Import","Bring in a file","folder"],["Backups","Review saved copies","doc"],["Export CSV","Evidence links included","upload"]].map(([a,b,ic],i)=>{const y=118+i*180;return `<rect x="38" y="${y}" width="${w-76}" height="142" rx="24" fill="#101a29" stroke="#687386" stroke-width="2"/>${icon(ic,70,y+43,54,C.mint)}${label(a,146,y+58,27,C.white,800)}${label(b,146,y+98,20,"#b9c3d0",500)}`}).join("")}<rect x="38" y="676" width="${w-76}" height="110" rx="24" fill="#122a2a"/>${icon("check",68,700,54,C.mint)}${label("CSV ready to share",140,724,25,C.white,800)}${label("Date · Type · Category · Amount · Evidence",140,758,17,"#b9d6d0",500)}</g>`;
}

function notificationCard(w=500,h=220){return `<g><rect width="${w}" height="${h}" rx="28" fill="#fff" filter="url(#soft)"/><circle cx="62" cy="68" r="34" fill="#e8f7f2"/>${icon("bell",40,45,44,C.teal)}${label("Receipt Cycle",112,62,23,C.ink,800)}${label("Budget check",112,96,20,C.slate,600)}${label("Groceries has $180 remaining this month.",34,156,20,C.ink,600)}</g>`}

const stories = [
  { id:"01-scan-review", bg:"#edf6f1", title:["Turn receipts into","editable records."], accent:1, dark:true },
  { id:"02-voice-quick-text", bg:C.navy, title:["Speak or type.","Edit before saving."], accent:0 },
  { id:"03-upload-evidence", bg:C.paper, title:["Upload documents.","Keep the evidence."], accent:1, dark:true },
  { id:"04-invoices", bg:C.teal2, title:["Build polished","invoices."], accent:1 },
  { id:"05-estimates", bg:C.navy, title:["Create and share","clear estimates."], accent:1 },
  { id:"06-payment-status", bg:"#0b0d10", title:["Know what is paid","and what is due."], accent:0 },
  { id:"07-budgets-reports", bg:"#eef8f1", title:["Understand cash flow.","Stay on budget."], accent:0, dark:true },
  { id:"08-backup-export", bg:"#050807", title:["Back up, export","and stay informed."], accent:0 }
];

function phoneHeader(s, center=false){
  const ink=s.dark?C.ink:C.white; const x=center?540:74; const anchor=center?"middle":"start";
  return `${lines(s.title,x,160,76,ink,{line:82,anchor,accent:s.accent,accentColor:s.dark?C.teal:C.mint})}`;
}

async function renderPhone(i){
  const s=stories[i];
  if(i===0){
    const screenW=676,screenH=1260;
    const photo=await sharp(receiptPhoto).resize(screenW,screenH,{fit:"cover",position:"center"}).modulate({brightness:.86,saturation:.9}).sharpen().png().toBuffer();
    const screenOverlay=svg(screenW,screenH,`<rect width="${screenW}" height="118" fill="#04090d" opacity=".7"/><circle cx="338" cy="31" r="11" fill="#050607" stroke="#273139" stroke-width="3"/>${label("Processing Receipt",42,84,28,C.white,800)}<path d="M90 645L590 712" stroke="${C.coral}" stroke-width="34" opacity=".24" filter="url(#beam)"/><path d="M90 645L590 712" stroke="${C.coral}" stroke-width="10" stroke-linecap="round"/><rect x="72" y="940" width="532" height="250" rx="34" fill="#061126" opacity=".94"/><circle cx="116" cy="992" r="17" fill="none" stroke="${C.mint}" stroke-width="5" stroke-dasharray="16 11"/>${label("Analyzing image and text",154,1001,23,C.white,800)}<circle cx="116" cy="1067" r="12" fill="none" stroke="#9cadbd" stroke-width="4"/>${label("Extracting transaction fields",154,1076,22,"#d8e1ea",600)}<circle cx="116" cy="1140" r="12" fill="none" stroke="#9cadbd" stroke-width="4"/>${label("Preparing your review",154,1149,22,"#d8e1ea",600)}`);
    const clipped=await sharp(photo).composite([{input:screenOverlay},{input:svg(screenW,screenH,`<rect width="${screenW}" height="${screenH}" rx="84" fill="#fff"/>`),blend:"dest-in"}]).png().toBuffer();
    const device=await sharp(svg(760,1390,`<rect x="18" y="18" width="724" height="1354" rx="104" fill="#161a1e" stroke="#69737a" stroke-width="6" filter="url(#shadow)"/>`)).composite([{input:clipped,left:42,top:42}]).png().toBuffer();
    const tilted=await sharp(device).rotate(-5,{background:{r:0,g:0,b:0,alpha:0}}).png().toBuffer();
    const base=svg(1080,1920,`<rect width="1080" height="1920" fill="#edf6f1"/><circle cx="1030" cy="1530" r="610" fill="#d7eee4"/><circle cx="1030" cy="1530" r="440" fill="#bce3d3" opacity=".75"/><circle cx="1030" cy="1530" r="260" fill="#93d4bd" opacity=".72"/><g transform="translate(70 74)"><rect width="62" height="62" rx="18" fill="${C.teal}"/><path d="M18 17h26v28H18zM24 25h14M24 32h14M24 39h9" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/></g>${label("Receipt Cycle",152,118,34,C.ink,800)}${lines(s.title,70,230,78,C.ink,{line:82,accent:1,accentColor:C.teal})}${label("Snap once. Review the details. Save when ready.",72,430,28,C.slate,600)}<rect x="64" y="490" width="298" height="58" rx="29" fill="#dff2eb"/>${label("YOU CAPTURE · AI EXTRACTS",213,528,18,C.teal,800,"middle")}`);
    const proof=svg(470,190,`<rect width="470" height="190" rx="28" fill="#fff" filter="url(#soft)"/>${label("Northside Market",28,52,22,C.ink,800)}${label("17 Oct 2026",28,86,18,C.slate,600)}${label("$42.80",440,62,28,C.teal,900,"end")}<path d="M28 111H442" stroke="#e3e9ec"/>${label("Merchant, total and date extracted",28,154,18,C.ink,700)}${icon("check",414,128,30,C.teal)}`);
    return sharp(base).composite([{input:tilted,left:258,top:535},{input:proof,left:60,top:1505}]).flatten().removeAlpha().png().toBuffer();
  }
  let body=`<rect width="1080" height="1920" fill="${s.bg}"/>${phoneHeader(s,i===4)}`;
  if(i===1){body+=`<g transform="translate(160 430)">${appScreenVoice(760,1250)}</g><g transform="translate(80 650)"><rect width="790" height="142" rx="28" fill="#fff" filter="url(#soft)"/><circle cx="66" cy="71" r="42" fill="${C.teal}"/>${icon("mic",43,48,46,C.white)}${label("“42 dollars at Northside Market”",130,65,26,C.ink,800)}${label("Prepared as an editable expense",130,105,20,C.slate,500)}</g>`}
  if(i===2){body+=`<path d="M850 -20a340 340 0 1 1-1 1" fill="#d9f1e7"/>${phoneHeader(s)}<g transform="translate(45 455) rotate(-3 310 380)">${uploadPanel(620,760)}</g><g transform="translate(430 810) rotate(2 300 430)">${evidencePanel(600,860)}</g>`}
  if(i===3){body+=`<path d="M0 0H1080V560L0 720Z" fill="#0a625d"/>${phoneHeader(s,true)}<g transform="translate(20 570) rotate(-3 330 500)">${builderPanel("Invoice",660,1000)}</g><g transform="translate(505 720) rotate(4 250 360)">${documentPreview("INVOICE",500,720)}</g><g transform="translate(102 1550)"><rect width="450" height="96" rx="24" fill="#fff" filter="url(#soft)"/>${label("Standard",120,60,22,C.teal,800,"middle")}<path d="M225 20V76" stroke="#dce4ea"/>${label("Compact",340,60,22,C.slate,700,"middle")}</g>`}
  if(i===4){body+=`<path d="M0 0H1080V520L0 650Z" fill="#081d43"/>${phoneHeader(s,true)}<g transform="translate(72 560) rotate(-3 330 500)">${builderPanel("Estimate",660,1000)}</g><g transform="translate(460 640) rotate(4 250 360)">${documentPreview("ESTIMATE",500,720)}</g><g transform="translate(250 1450)">${shareSheet(520,280)}</g>`}
  if(i===5){body+=`${phoneHeader(s)}<g transform="translate(220 430)">${paymentPanel(680,950)}</g><g transform="translate(54 800)"><rect width="740" height="122" rx="24" fill="#fff" filter="url(#soft)"/><rect x="24" y="28" width="170" height="66" rx="18" fill="#e3f7f0"/>${label("PAID",109,69,21,C.green,900,"middle")}${label("$1,250 received",230,71,25,C.ink,800)}</g><g transform="translate(118 950)"><rect width="760" height="122" rx="24" fill="#fff" filter="url(#soft)"/><rect x="24" y="28" width="190" height="66" rx="18" fill="#fff1d9"/>${label("PARTIAL",119,69,21,C.amber,900,"middle")}${label("$620 remaining",250,71,25,C.ink,800)}</g><g transform="translate(182 1100)"><rect width="790" height="122" rx="24" fill="#fff" filter="url(#soft)"/><rect x="24" y="28" width="190" height="66" rx="18" fill="#ffe4e7"/>${label("OVERDUE",119,69,21,C.coral,900,"middle")}${label("$840 · 3 days",250,71,25,C.ink,800)}</g>`}
  if(i===6){body+=`<circle cx="910" cy="120" r="310" fill="#d7efe0"/>${phoneHeader(s)}<g transform="translate(62 470)">${chartCard(650,520)}</g><g transform="translate(330 820)">${budgetPanel(700,920)}</g>`}
  if(i===7){body+=`<circle cx="1040" cy="80" r="290" fill="#1b6f3b"/><circle cx="1040" cy="80" r="190" fill="#2b874d"/><circle cx="20" cy="1910" r="250" fill="#1b6f3b"/>${phoneHeader(s)}<g transform="translate(60 480)">${exportPanel(660,830)}</g><g transform="translate(520 1120)">${notificationCard(500,220)}</g><g transform="translate(120 1480) rotate(-4 280 150)"><rect width="760" height="320" rx="26" fill="#fff" filter="url(#soft)"/>${label("DATE",28,52,16,C.slate,800)}${label("TYPE",180,52,16,C.slate,800)}${label("AMOUNT",350,52,16,C.slate,800)}${label("EVIDENCE",540,52,16,C.slate,800)}${[["17 Oct","Expense","$42.80","Open link"],["15 Oct","Income","$1,250","Open link"],["12 Oct","Expense","$68.20","Open link"]].map((r,j)=>r.map((v,k)=>label(v,[28,180,350,540][k],105+j*68,18,k===3?C.teal:C.ink,k===3?800:600)).join("")+`<path d="M24 ${126+j*68}H736" stroke="#e8edf0"/>`).join("")}</g>`}
  return sharp(svg(1080,1920,body)).flatten({background:s.bg}).removeAlpha().png().toBuffer();
}

function tabletHeader(s, ten){
  const ink=s.dark?C.ink:C.white; const size=ten?76:70;
  return `${lines(s.title,112,190,size,ink,{line:size*1.05,accent:s.accent,accentColor:s.dark?C.teal:C.mint})}${label("RECEIPT CYCLE",114,990,20,s.dark?C.teal:C.mint,800)}`;
}

async function renderTablet(i,ten=false){
  const s=stories[i], w=1920,h=1080;
  if(i===0){
    const photo=await sharp(receiptPhoto).resize(1140,1080,{fit:"cover",position:"right"}).modulate({brightness:.84,saturation:.9}).blur(.35).png().toBuffer();
    const base=svg(w,h,`<rect width="1920" height="1080" fill="${C.teal}"/>${tabletHeader(s,ten)}<path d="M690 0H1920V1080H580Z" fill="#0d5f5b" opacity=".36"/>`);
    const over=svg(1140,1080,`<path d="M260 640L1060 780" stroke="${C.coral}" stroke-width="24" opacity=".22" filter="url(#beam)"/><path d="M260 640L1060 780" stroke="${C.coral}" stroke-width="8"/><rect x="70" y="740" width="500" height="112" rx="24" fill="#081124" opacity=".94"/>${label("Tap the shutter. Review before saving.",104,807,24,C.white,700)}<circle cx="900" cy="900" r="70" fill="#fff" stroke="${C.teal}" stroke-width="12"/><circle cx="900" cy="900" r="48" fill="${C.teal}"/>`);
    return sharp(base).composite([{input:photo,left:780,top:0},{input:over,left:780,top:0}]).flatten().removeAlpha().png().toBuffer();
  }
  let body=`<rect width="1920" height="1080" fill="${s.bg}"/>${tabletHeader(s,ten)}`;
  const x=ten?690:760;
  if(i===1){body+=`<g transform="translate(${x} 70) scale(${ten?0.88:0.82})">${appScreenVoice(760,1110)}</g><g transform="translate(${ten?1260:1320} 240)"><rect width="560" height="155" rx="30" fill="#fff" filter="url(#soft)"/><circle cx="74" cy="77" r="44" fill="${C.teal}"/>${icon("mic",50,52,48,C.white)}${label("“42 dollars at Northside Market”",142,72,25,C.ink,800)}${label("Editable expense prepared",142,112,20,C.slate,500)}</g>`}
  if(i===2){body+=`<circle cx="1900" cy="0" r="320" fill="#d9f1e7"/>${tabletHeader(s,ten)}<g transform="translate(${ten?620:690} 160) scale(.95)">${uploadPanel(620,760)}</g><g transform="translate(${ten?1240:1300} 110) scale(.96)">${evidencePanel(600,860)}</g>`}
  if(i===3){body+=`<g transform="translate(${ten?600:680} 65) scale(.9)">${builderPanel("Invoice",660,1000)}</g><g transform="translate(${ten?1240:1300} 125) scale(1.12)">${documentPreview("INVOICE",500,720)}</g>`}
  if(i===4){body+=`<g transform="translate(${ten?610:690} 60) scale(.9)">${builderPanel("Estimate",660,1000)}</g><g transform="translate(${ten?1220:1280} 90) scale(1.05)">${documentPreview("ESTIMATE",500,720)}</g><g transform="translate(${ten?1320:1370} 760) scale(.88)">${shareSheet(520,280)}</g>`}
  if(i===5){body+=`<g transform="translate(${ten?640:710} 80) scale(.93)">${paymentPanel(680,950)}</g><g transform="translate(${ten?1290:1340} 220)"><rect width="510" height="122" rx="24" fill="#fff" filter="url(#soft)"/><rect x="22" y="28" width="145" height="66" rx="18" fill="#e3f7f0"/>${label("PAID",95,69,20,C.green,900,"middle")}${label("$1,250 received",200,71,24,C.ink,800)}</g><g transform="translate(${ten?1340:1390} 380)"><rect width="500" height="122" rx="24" fill="#fff" filter="url(#soft)"/><rect x="22" y="28" width="160" height="66" rx="18" fill="#fff1d9"/>${label("PARTIAL",102,69,20,C.amber,900,"middle")}${label("$620 due",212,71,24,C.ink,800)}</g><g transform="translate(${ten?1390:1440} 540)"><rect width="480" height="122" rx="24" fill="#fff" filter="url(#soft)"/><rect x="22" y="28" width="165" height="66" rx="18" fill="#ffe4e7"/>${label("OVERDUE",104,69,20,C.coral,900,"middle")}${label("3 days",220,71,24,C.ink,800)}</g>`}
  if(i===6){body+=`<circle cx="1870" cy="60" r="300" fill="#d7efe0"/>${tabletHeader(s,ten)}<g transform="translate(${ten?610:680} 170) scale(1.1)">${chartCard(560,520)}</g><g transform="translate(${ten?1240:1300} 80) scale(.98)">${budgetPanel(700,920)}</g>`}
  if(i===7){body+=`<circle cx="1900" cy="20" r="320" fill="#1b6f3b"/><circle cx="1900" cy="20" r="210" fill="#2b874d"/>${tabletHeader(s,ten)}<g transform="translate(${ten?620:690} 95) scale(.95)">${exportPanel(660,830)}</g><g transform="translate(${ten?1290:1340} 190)">${notificationCard(500,220)}</g><g transform="translate(${ten?1250:1310} 500)"><rect width="560" height="390" rx="26" fill="#fff" filter="url(#soft)"/>${label("DATE",26,52,15,C.slate,800)}${label("TYPE",146,52,15,C.slate,800)}${label("AMOUNT",285,52,15,C.slate,800)}${label("EVIDENCE",420,52,15,C.slate,800)}${[["17 Oct","Expense","$42.80","Open link"],["15 Oct","Income","$1,250","Open link"],["12 Oct","Expense","$68.20","Open link"],["10 Oct","Expense","$19.40","Open link"]].map((r,j)=>r.map((v,k)=>label(v,[26,146,285,420][k],106+j*66,17,k===3?C.teal:C.ink,k===3?800:600)).join("")+`<path d="M22 ${128+j*66}H538" stroke="#e8edf0"/>`).join("")}</g>`}
  return sharp(svg(w,h,body)).flatten({background:s.bg}).removeAlpha().png().toBuffer();
}

async function contactSheet(dir,names,portrait){
  const tw=portrait?270:480,th=portrait?480:270,gap=24,cols=4,rows=2;
  const sheet=sharp({create:{width:cols*tw+(cols+1)*gap,height:rows*th+(rows+1)*gap,channels:3,background:"#dfe6e3"}});
  const comps=[];
  for(let i=0;i<names.length;i++) comps.push({input:await sharp(path.join(dir,names[i])).resize(tw,th,{fit:"cover"}).png().toBuffer(),left:gap+(i%cols)*(tw+gap),top:gap+Math.floor(i/cols)*(th+gap)});
  return sheet.composite(comps).png().toBuffer();
}

await fs.mkdir(path.join(out,"phone"),{recursive:true});
await fs.mkdir(path.join(out,"tablet-7"),{recursive:true});
await fs.mkdir(path.join(out,"tablet-10"),{recursive:true});
const names=[];
for(let i=0;i<stories.length;i++){
  const name=`${stories[i].id}.png`; names.push(name);
  await sharp(await renderPhone(i)).png({compressionLevel:9}).toFile(path.join(out,"phone",name));
  await sharp(await renderTablet(i,false)).png({compressionLevel:9}).toFile(path.join(out,"tablet-7",name));
  await sharp(await renderTablet(i,true)).png({compressionLevel:9}).toFile(path.join(out,"tablet-10",name));
}
await sharp(await contactSheet(path.join(out,"phone"),names,true)).toFile(path.join(out,"phone-contact-sheet.png"));
await sharp(await contactSheet(path.join(out,"tablet-7"),names,false)).toFile(path.join(out,"tablet-7-contact-sheet.png"));
await sharp(await contactSheet(path.join(out,"tablet-10"),names,false)).toFile(path.join(out,"tablet-10-contact-sheet.png"));
await fs.writeFile(path.join(out,"IMAGEGEN-PROMPT.md"),`# Generated supporting photograph\n\nBuilt-in image generation was used only for the natural receipt-on-desk photograph in frame 1. All app UI, copy, icons, scan beam, receipt controls, and all other frames are deterministic SVG/Sharp compositions reconstructed from verified Receipt Cycle screens.\n\n## Prompt\n\nUse case: photorealistic-natural. A natural smartphone-camera photograph of one generic fictional retail receipt lying diagonally on a dark warm walnut tabletop, with realistic paper texture and shadow, portrait composition and clean darker negative space above. No app UI, scan line, logos, badges, ratings, watermarks, hands, cards, or props.\n`);
console.log(`Generated ${stories.length*3} v3 assets and 3 contact sheets in ${out}`);
