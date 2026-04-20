import sharp from "sharp";

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#149184"/>
      <stop offset="100%" stop-color="#0f766e"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <rect x="58" y="72" width="1084" height="486" rx="28" fill="rgba(255,255,255,0.10)"/>
  <text x="96" y="180" font-family="Inter,Arial" font-size="64" font-weight="700" fill="#fff">Scan once.</text>
  <text x="96" y="250" font-family="Inter,Arial" font-size="64" font-weight="700" fill="#fff">Claim your tax refund.</text>
  <text x="96" y="312" font-family="Inter,Arial" font-size="28" fill="#e6fffb">ReceiptCycle helps freelancers and small businesses</text>
  <text x="96" y="348" font-family="Inter,Arial" font-size="28" fill="#e6fffb">track receipts, expenses, and money leaks automatically.</text>

  <g transform="translate(760,120)">
    <rect x="0" y="0" width="320" height="420" rx="34" fill="#0b1220"/>
    <rect x="16" y="22" width="288" height="376" rx="22" fill="#f8fafc"/>
    <rect x="36" y="56" width="248" height="76" rx="14" fill="#d1fae5"/>
    <text x="50" y="90" font-family="Inter,Arial" font-size="18" font-weight="700" fill="#065f46">Receipt OCR</text>
    <text x="50" y="116" font-family="Inter,Arial" font-size="14" fill="#065f46">Vendor, amount, date, category</text>
    <rect x="36" y="148" width="248" height="74" rx="14" fill="#ffedd5"/>
    <text x="50" y="178" font-family="Inter,Arial" font-size="18" font-weight="700" fill="#9a3412">Money Leaks</text>
    <text x="50" y="203" font-family="Inter,Arial" font-size="14" fill="#9a3412">Subscription and spend alerts</text>
    <rect x="36" y="238" width="248" height="74" rx="14" fill="#dbeafe"/>
    <text x="50" y="268" font-family="Inter,Arial" font-size="18" font-weight="700" fill="#1e3a8a">Tax Export</text>
    <text x="50" y="292" font-family="Inter,Arial" font-size="14" fill="#1e3a8a">Clean report for your accountant</text>
  </g>

  <circle cx="110" cy="500" r="14" fill="#f97316"/>
  <text x="136" y="507" font-family="Inter,Arial" font-size="24" font-weight="600" fill="#fff">receiptcycle.com</text>
</svg>`;

await sharp(Buffer.from(svg, "utf8"))
  .png({ compressionLevel: 9 })
  .toFile("public/landing/feature-seo-cover.png");

console.log("Generated public/landing/feature-seo-cover.png");
