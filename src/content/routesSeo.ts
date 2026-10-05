/**
 * Per-route SEO metadata + JSON-LD. Used by:
 *   - the `<Seo>` component at runtime (SPA nav updates),
 *   - `scripts/prerender.mjs` at build time (per-route HTML w/ correct head).
 *
 * Keep this file framework-free (no React, no imports from src/*) so the
 * build-time prerender script can import it directly with esbuild/tsx.
 */
import { BLOG_POSTS, type BlogPost } from "./blogPosts";
import { SITE_FAQ_ITEMS } from "./siteFaq";

export const SITE_URL = "https://receiptcycle.com";
export const SITE_NAME = "Receipt Cycle";
export const DEFAULT_OG = `${SITE_URL}/og-image.png?v=3`;

export type Jsonld = Record<string, unknown>;

export interface RouteSeo {
  path: string;
  title: string;
  description: string;
  ogImage?: string;
  ogImageAlt?: string;
  ogType?: "website" | "article";
  structuredData?: Jsonld[];
  /** Plain-text body injected into <noscript> for JS-less crawlers. */
  noscriptHtml?: string;
}

const organization: Jsonld = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/icon-512.png?v=3`,
  email: "support@receiptcycle.com",
  sameAs: ["https://x.com/receiptcycle", "https://www.instagram.com/receiptcycle"],
};

const softwareApp: Jsonld = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: SITE_NAME,
  operatingSystem: "iOS, Android, Web",
  applicationCategory: "FinanceApplication",
  description:
    "AI-powered receipt scanner and expense tracker. Capture purchases, catch money leaks, and keep audit-ready records for tax time.",
  image: DEFAULT_OG,
  url: SITE_URL,
  offers: [
    { "@type": "Offer", price: "0", priceCurrency: "USD", name: "Free" },
    { "@type": "Offer", price: "9.99", priceCurrency: "USD", name: "Pro Monthly" },
    { "@type": "Offer", price: "89.99", priceCurrency: "USD", name: "Pro Yearly" },
  ],
  publisher: { "@type": "Organization", name: SITE_NAME },
};

const homepageSoftwareApp: Jsonld = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: SITE_NAME,
  operatingSystem: "Web, Android",
  applicationCategory: "BusinessApplication",
  url: SITE_URL,
  image: DEFAULT_OG,
  description: "A connected workspace for receipts, expenses, estimates, invoices, payment records, budgets, reports, and AI-assisted review.",
  featureList: ["Receipt capture", "Expense records", "Estimates and invoices", "Payment records", "Business budgets", "Financial reports"],
  publisher: { "@type": "Organization", name: SITE_NAME },
};

function breadcrumb(trail: Array<{ name: string; path: string }>): Jsonld {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: `${SITE_URL}${t.path === "/" ? "/" : t.path}`,
    })),
  };
}

function blogPostSchema(post: BlogPost): Jsonld {
  const postImage = post.featuredImage?.startsWith("http")
    ? post.featuredImage
    : `${SITE_URL}${post.featuredImage}`;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    author: { "@type": "Organization", name: post.author },
    datePublished: post.datePublished,
    dateModified: post.dateModified,
    image: postImage || DEFAULT_OG,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/icon-512.png?v=3` },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/blog/${post.slug}`,
    },
    keywords: post.tags.join(", "),
  };
}

function faqSchema(): Jsonld {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: SITE_FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    if (c === "&") return "&amp;";
    if (c === "<") return "&lt;";
    if (c === ">") return "&gt;";
    if (c === '"') return "&quot;";
    return "&#39;";
  });
}

function noscriptWrap(title: string, innerHtml: string): string {
  return `<div style="font-family:Inter,system-ui,-apple-system,sans-serif;max-width:760px;margin:40px auto;padding:24px;color:#0f172a">
  <header><a href="/" style="color:#0f766e;text-decoration:none;font-weight:600">Receipt Cycle</a></header>
  <h1 style="margin:18px 0 12px 0;font-size:28px">${escapeHtml(title)}</h1>
  ${innerHtml}
  <nav style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:14px">
    <a href="/">Home</a> · <a href="/about">About</a> · <a href="/blog">Blog</a> ·
    <a href="/pricing">Pricing</a> · <a href="/faq">FAQ</a> · <a href="/contact">Contact</a>
  </nav>
</div>`;
}

function blogPostNoscript(post: BlogPost): string {
  const body = post.body
    .map((b) => {
      if (b.kind === "p") return `<p>${escapeHtml(b.text)}</p>`;
      if (b.kind === "h2") return `<h2 id="${b.id}">${escapeHtml(b.text)}</h2>`;
      if (b.kind === "h3") return `<h3 id="${b.id}">${escapeHtml(b.text)}</h3>`;
      if (b.kind === "h4") return `<h4 id="${b.id}">${escapeHtml(b.text)}</h4>`;
      if (b.kind === "image") {
        const safeSrc = escapeHtml(b.src);
        const safeAlt = escapeHtml(b.alt);
        const caption = b.caption ? `<figcaption>${escapeHtml(b.caption)}</figcaption>` : "";
        return `<figure><img src="${safeSrc}" alt="${safeAlt}"/>${caption}</figure>`;
      }
      if (b.kind === "links") {
        return `<section><h3>${escapeHtml(b.title)}</h3><ul>${b.items
          .map((item) => {
            const safeHref = escapeHtml(item.href);
            const safeLabel = escapeHtml(item.label);
            const attrs = item.external ? ` target="_blank" rel="noopener noreferrer"` : "";
            return `<li><a href="${safeHref}"${attrs}>${safeLabel}</a></li>`;
          })
          .join("")}</ul></section>`;
      }
      if (b.kind === "ul") return `<ul>${b.items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>`;
      if (b.kind === "ol") return `<ol>${b.items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ol>`;
      if (b.kind === "quote")
        return `<blockquote>${escapeHtml(b.text)}${b.cite ? `<footer>${escapeHtml(b.cite)}</footer>` : ""}</blockquote>`;
      return `<aside><strong>${escapeHtml(b.title)}</strong><p>${escapeHtml(b.text)}</p></aside>`;
    })
    .join("\n");
  const inner = `<p><em>${escapeHtml(post.tldr)}</em></p>${body}`;
  return noscriptWrap(post.title, inner);
}

const staticRoutes: RouteSeo[] = [
  {
    path: "/",
    title: "Receipt Cycle | Connected Business Records and Billing",
    description:
      "Capture receipts, organize expenses, prepare estimates and invoices, record payments, set budgets, and review business activity in one connected workspace.",
    structuredData: [organization, homepageSoftwareApp, {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/blog?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    }],
    noscriptHtml: noscriptWrap(
      "Keep the money side of your business connected",
      `<p>Receipt Cycle brings business records and billing into one practical workspace for freelancers, consultants, small businesses, and operations teams.</p>
       <ul>
         <li>Capture receipts and organize expense records.</li>
         <li>Prepare estimates and customer invoices.</li>
         <li>Record payments and remaining balances.</li>
         <li>Set budgets and review reports.</li>
         <li>Ask questions based on saved business records.</li>
       </ul>`,
    ),
  },
  {
    path: "/invoice-software",
    title: "Invoice Software for Small Businesses | Receipt Cycle",
    description:
      "Create professional invoices, add customers and line items, review totals, track payment status, and record payments with Receipt Cycle invoice software.",
    ogImage: `${SITE_URL}/landing/invoice-software-og.png`,
    ogImageAlt: "Receipt Cycle invoice software showing a professional invoice preview",
    structuredData: [
      organization,
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Invoice Software for Small Businesses",
        description:
          "Create professional invoices, add customers and line items, review totals, track payment status, and record payments with Receipt Cycle invoice software.",
        url: `${SITE_URL}/invoice-software`,
        mainEntity: {
          "@type": "SoftwareApplication",
          name: "Receipt Cycle Invoice Software",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          url: `${SITE_URL}/invoice-software`,
          description:
            "An invoice workspace for customers, line items, totals, invoice status, payment records, receipts, and reporting.",
          featureList: [
            "Invoice line items",
            "Tax and discount calculations",
            "Invoice preview",
            "Invoice status and balances",
            "Full and partial payment records",
            "Payment receipts",
          ],
        },
      },
      breadcrumb([
        { name: "Home", path: "/" },
        { name: "Invoice Software", path: "/invoice-software" },
      ]),
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "Is Receipt Cycle a full accounting system?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Receipt Cycle focuses on practical finance workflows such as invoices, estimates, payments, receipts, expenses, budgets, and reports. It does not claim to replace payroll, tax filing, inventory, or a full general-ledger accounting platform.",
            },
          },
          {
            "@type": "Question",
            name: "Can I add tax, discounts, notes, and payment terms?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. The invoice builder supports tax and discount percentages, notes, payment terms, issue dates, due dates, quantities, rates, and line-item descriptions.",
            },
          },
          {
            "@type": "Question",
            name: "Can I record a partial payment?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. Record the amount received and payment method. Receipt Cycle updates the paid amount, remaining balance, invoice status, and payment history.",
            },
          },
          {
            "@type": "Question",
            name: "Does Receipt Cycle process online card payments?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Not currently. Receipt Cycle records payments made through your existing payment method. It does not claim to act as a payment gateway.",
            },
          },
          {
            "@type": "Question",
            name: "Can I print or save an invoice as a PDF?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. Open the invoice preview and use the print option. Your browser can print the document or save it as a PDF.",
            },
          },
          {
            "@type": "Question",
            name: "Can I turn an estimate into an invoice?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. An estimate can be converted into an editable invoice draft, keeping its customer, line items, tax, discount, and terms connected.",
            },
          },
          {
            "@type": "Question",
            name: "Does Receipt Cycle include invoice templates?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Receipt Cycle currently provides a consistent invoice layout that uses your business details and accent color. It does not claim to include a gallery of interchangeable invoice templates.",
            },
          },
        ],
      },
    ],
    noscriptHtml: noscriptWrap(
      "Invoicing Software for Small Businesses and Freelancers",
      `<p>Create polished invoices, send them to customers, and track what is paid or outstanding from one straightforward workspace.</p>
       <h2>Build and review an invoice</h2>
       <ul>
         <li>Select a saved customer and add products or services.</li>
         <li>Set quantities, rates, descriptions, tax, discounts, notes, and terms.</li>
         <li>Preview the customer document before marking it as sent.</li>
       </ul>
       <h2>Track invoice status and payment history</h2>
       <p>Filter invoices by status, record full or partial payments, see the remaining balance, and keep payment receipts connected to invoice history.</p>
       <p><a href="/signup?intent=invoice">Create your first invoice</a>. No credit card required.</p>`,
    ),
  },
  {
    path: "/estimate-quotation-software",
    title: "Estimate Software & Quotation Maker | Receipt Cycle",
    description:
      "Create detailed estimates and quotations, track approval status, and convert accepted work into an editable invoice with Receipt Cycle estimate software.",
    ogImage: `${SITE_URL}/landing/estimate-quotation-software-og.png`,
    ogImageAlt: "Receipt Cycle estimate software showing a quotation and estimate-to-invoice workflow",
    structuredData: [
      organization,
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Estimate and Quotation Software",
        description:
          "Create detailed estimates and quotations, track approval status, and convert accepted work into an editable invoice with Receipt Cycle estimate software.",
        url: `${SITE_URL}/estimate-quotation-software`,
        mainEntity: {
          "@type": "SoftwareApplication",
          name: "Receipt Cycle Estimate Software",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web, iOS, Android",
          url: `${SITE_URL}/estimate-quotation-software`,
          description:
            "Estimate and quotation software for customer details, line items, quantities, rates, tax, discounts, validity, status, preview, and invoice conversion.",
          featureList: [
            "Estimate and quotation creation",
            "Products and service line items",
            "Quantity and rate calculations",
            "Tax and discount calculations",
            "Estimate validity dates",
            "Draft, sent, accepted, and expired status",
            "Estimate preview and sharing",
            "Accepted estimate conversion to invoice draft",
          ],
        },
      },
      breadcrumb([
        { name: "Home", path: "/" },
        { name: "Estimate & Quotation Software", path: "/estimate-quotation-software" },
      ]),
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "What is the difference between an estimate and a quotation?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Businesses often use estimate, quote, and quotation for the same pre-sale document. Local practice and the certainty of the price can affect the label. Receipt Cycle provides a structured estimate document for describing proposed work, pricing, validity, and terms.",
            },
          },
          {
            "@type": "Question",
            name: "What can I include in a Receipt Cycle estimate?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Choose a customer, add products or services, descriptions, quantities, and rates, then set tax, a discount, notes, terms, an issue date, and a validity period. Review the calculated total before saving or sending the estimate.",
            },
          },
          {
            "@type": "Question",
            name: "Can I preview and send an estimate?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. Receipt Cycle includes an estimate preview and a send or share action. The current workflow hands the document to your device or email tools; it does not claim automatic email-open tracking or an approval portal.",
            },
          },
          {
            "@type": "Question",
            name: "Which estimate statuses are available?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Receipt Cycle supports draft, sent, accepted, and expired estimates. A rejected status is not currently implemented, so the page does not claim that feature.",
            },
          },
          {
            "@type": "Question",
            name: "Can I convert an accepted estimate into an invoice?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. Convert the estimate into an editable invoice draft. The customer, line items, quantities, rates, tax, discount, and terms remain available so you can review the invoice before sending it.",
            },
          },
          {
            "@type": "Question",
            name: "Is this contractor estimating software?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Receipt Cycle can suit contractors who quote defined services and rates. It is not positioned as construction takeoff, materials database, job-costing, tender, or project-scheduling software.",
            },
          },
          {
            "@type": "Question",
            name: "Does Receipt Cycle work as estimate and invoice software?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. Estimates and invoices are connected parts of the Receipt Cycle sales workflow. Use the estimate before approval, convert accepted work into a draft invoice, then manage billing from the invoice workspace.",
            },
          },
        ],
      },
    ],
    noscriptHtml: noscriptWrap(
      "Estimate software for service businesses and independent contractors",
      `<p>Create a detailed estimate, send it for review, and turn accepted work into an editable invoice without entering the job twice.</p>
       <h2>Create and review an estimate</h2>
       <ul>
         <li>Choose a customer and add proposed services, descriptions, quantities, and rates.</li>
         <li>Set tax, a discount, notes, terms, and the quotation validity period.</li>
         <li>Preview the customer document before saving or sending it.</li>
       </ul>
       <h2>Record approval and continue to invoicing</h2>
       <p>Track draft, sent, accepted, and expired estimates. Convert accepted work into an editable invoice draft while keeping its customer, line items, pricing adjustments, and terms.</p>
       <p><a href="/signup?intent=estimate">Create your first estimate</a>. No credit card required.</p>`,
    ),
  },
  {
    path: "/payment-tracking-software",
    title: "Payment Tracking Software & Receipt Manager | Receipt Cycle",
    description:
      "Record full or partial invoice payments, update balances, preserve payment history, and create shareable receipts with Receipt Cycle payment tracking software.",
    ogImage: `${SITE_URL}/landing/payment-tracking-software-og.png`,
    ogImageAlt: "Receipt Cycle payment tracking software showing an invoice payment, updated balance, and customer receipt",
    structuredData: [
      organization,
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Payment Tracking and Receipt Management Software",
        description:
          "Record full or partial invoice payments, update balances, preserve payment history, and create shareable receipts with Receipt Cycle payment tracking software.",
        url: `${SITE_URL}/payment-tracking-software`,
        mainEntity: {
          "@type": "SoftwareApplication",
          name: "Receipt Cycle Payment Tracking Software",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web, iOS, Android",
          url: `${SITE_URL}/payment-tracking-software`,
          description:
            "Payment tracking software for invoice-linked payments, partial payments, balances, payment history, receipt previews, and receipt sharing.",
          featureList: [
            "Full and partial invoice payment records",
            "Paid amount and outstanding balance updates",
            "Payment method, date, account, and reference",
            "Invoice payment history",
            "Numbered payment receipts",
            "Receipt preview",
            "PDF and image receipt sharing on supported mobile devices",
            "Print or save as PDF on the web workspace",
          ],
        },
      },
      breadcrumb([
        { name: "Home", path: "/" },
        { name: "Payment Tracking Software", path: "/payment-tracking-software" },
      ]),
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "What does payment tracking software do?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "It records customer payments against invoices so the payment date, amount, method, reference, history, paid amount, and remaining balance can be reviewed together. Receipt Cycle also creates a receipt record after the payment is saved.",
            },
          },
          {
            "@type": "Question",
            name: "Can I record a partial payment?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. Enter an amount up to the invoice balance. Receipt Cycle adds the payment to history, updates the paid amount and outstanding balance, and marks the invoice partially paid until the full total has been recorded.",
            },
          },
          {
            "@type": "Question",
            name: "Does Receipt Cycle process customer payments?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "No. Receipt Cycle records payments received through an existing payment method. It does not act as a payment gateway, collect funds, or verify settlement.",
            },
          },
          {
            "@type": "Question",
            name: "What information appears on a payment receipt?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "The receipt can include the business, customer, receipt number, invoice reference, amount received, payment method, receiving account, payment date, payment reference, and remaining balance.",
            },
          },
          {
            "@type": "Question",
            name: "Can I preview, download, or share a receipt?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. The mobile workflow includes receipt preview and sharing as a PDF or image through supported device apps. The web workspace supports receipt sharing plus printing or saving the receipt as a PDF.",
            },
          },
          {
            "@type": "Question",
            name: "Does Receipt Cycle support payment reconciliation?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Receipt Cycle supports manual payment reconciliation by keeping each recorded amount attached to its invoice, reference, method, date, and balance. It does not currently claim automatic bank-feed matching or settlement reconciliation.",
            },
          },
          {
            "@type": "Question",
            name: "Is this accounts receivable tracking software?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Receipt Cycle covers practical accounts-receivable tasks for small businesses: invoice status, paid amount, partial payments, overdue balances, payment history, and receipts. It is not positioned as an enterprise collections or treasury platform.",
            },
          },
        ],
      },
    ],
    noscriptHtml: noscriptWrap(
      "Payment tracking software for invoicing and recurring billing",
      `<p>Record full or partial invoice payments, update the balance, and create a receipt without rebuilding the transaction in another file.</p>
       <h2>Record the payment against an invoice</h2>
       <ul>
         <li>Choose an open invoice and enter the amount received.</li>
         <li>Store the payment method, receiving account, date, note, and generated reference.</li>
         <li>Update the paid amount, remaining balance, and invoice status.</li>
       </ul>
       <h2>Create and share a payment receipt</h2>
       <p>Preview a numbered receipt with the customer, invoice, amount, method, reference, date, and balance. Share supported PDF or image output, or print and save the web receipt as a PDF.</p>
       <p><a href="/signup?intent=payment">Record your first payment</a>. No credit card required.</p>`,
    ),
  },
  {
    path: "/ai-receipt-scanner",
    title: "AI Receipt Scanner & Receipt OCR App | Receipt Cycle",
    description:
      "Scan receipt images, extract merchant, amount, date, tax and line items, review the details, and save organized expense records with Receipt Cycle.",
    ogImage: `${SITE_URL}/landing/ai-receipt-scanner-og.png`,
    ogImageAlt: "Receipt Cycle AI receipt scanner turning a receipt image into editable expense fields",
    structuredData: [
      organization,
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "AI Receipt Scanner",
        description:
          "Scan receipt images, extract merchant, amount, date, tax and line items, review the details, and save organized expense records with Receipt Cycle.",
        url: `${SITE_URL}/ai-receipt-scanner`,
        mainEntity: {
          "@type": "SoftwareApplication",
          name: "Receipt Cycle AI Receipt Scanner",
          applicationCategory: "FinanceApplication",
          operatingSystem: "Web, iOS, Android",
          url: `${SITE_URL}/ai-receipt-scanner`,
          description:
            "AI receipt scanning software for receipt-image capture, OCR extraction, editable field review, and organized expense records.",
          featureList: [
            "Mobile receipt camera with flash control",
            "Receipt image upload from mobile gallery or web",
            "Merchant, amount, date, time, and payment method extraction",
            "Subtotal, tax, currency, and line-item extraction when visible",
            "Suggested expense category",
            "OCR confidence, detected language, and review tags",
            "Editable review before saving an expense",
            "Receipt evidence connected to saved transaction records",
          ],
        },
      },
      breadcrumb([
        { name: "Home", path: "/" },
        { name: "AI Receipt Scanner", path: "/ai-receipt-scanner" },
      ]),
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "What does an AI receipt scanner extract?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Receipt Cycle can propose the merchant, total amount, date, time, payment method, category, currency, subtotal, tax, document type, detected language, confidence, tags, formatted receipt text, and line items when those details are visible. Results depend on the source image and must be reviewed.",
            },
          },
          {
            "@type": "Question",
            name: "Can I scan a receipt with my phone camera?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. The mobile flow includes a receipt camera with flash control. You can also choose an existing image from the gallery. On the web, supported receipt images can be uploaded for processing.",
            },
          },
          {
            "@type": "Question",
            name: "Can I edit the OCR result?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. The review screen is designed for correction. Check the merchant, amount, date, time, category, payment method, extracted text, and any line items before continuing to save the expense.",
            },
          },
          {
            "@type": "Question",
            name: "Does the scanner always capture tax and line items?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "No. Tax extraction and line-item extraction depend on what is visible and legible in the receipt image. A short, faded, folded, handwritten, or damaged receipt may return fewer fields or a lower confidence indicator.",
            },
          },
          {
            "@type": "Question",
            name: "Can I use the receipt scanner for taxes?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "You can use it to organize receipt images and reviewed expense details for later record preparation. Receipt Cycle does not determine deductions, file returns, provide tax advice, or guarantee that a record satisfies a tax authority or audit requirement.",
            },
          },
          {
            "@type": "Question",
            name: "Does Receipt Cycle support multilingual receipts?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "The scanner is designed to recognize multiple scripts and can display detected languages. Accuracy still varies with image quality, typography, handwriting, layout, and the OCR provider available when the scan runs.",
            },
          },
          {
            "@type": "Question",
            name: "Can I scan PDF receipts?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "The receipt camera and receipt-image upload flow are intended for supported image formats such as JPG and PNG. PDF statement import belongs to a separate upload workflow and should not be treated as receipt-camera OCR.",
            },
          },
        ],
      },
    ],
    noscriptHtml: noscriptWrap(
      "AI receipt scanner for faster expense capture",
      `<p>Photograph or upload a receipt, extract the visible purchase details, and review the expense before it joins your records.</p>
       <h2>Capture, extract, and review</h2>
       <ul>
         <li>Use the mobile receipt camera, choose an image from the gallery, or upload a supported receipt image from the web.</li>
         <li>Review proposed merchant, amount, date, category, payment method, tax, currency, and line-item details when visible.</li>
         <li>Correct uncertain OCR fields before continuing to save the expense.</li>
       </ul>
       <h2>Keep the source with the record</h2>
       <p>Receipt Cycle can preserve the receipt image or structured receipt data with the saved transaction so you can return to the evidence later.</p>
       <p><a href="/signup?intent=scan">Scan your first receipt</a>. No credit card required.</p>`,
    ),
  },
  {
    path: "/business-travel-expense-tracker",
    title: "Business Travel Expense Tracker & Trip Expenses | Receipt Cycle",
    description:
      "Capture travel receipts, record airfare, hotel, meals and transportation, filter trip expenses, and export organized transaction records with Receipt Cycle.",
    ogImage: `${SITE_URL}/landing/business-travel-expense-tracker-og.png`,
    ogImageAlt: "Receipt Cycle business travel expense tracker showing trip purchases organized by date, category, and account",
    structuredData: [
      organization,
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Business Travel Expense Tracker",
        description:
          "Capture travel receipts, record airfare, hotel, meals and transportation, filter trip expenses, and export organized transaction records with Receipt Cycle.",
        url: `${SITE_URL}/business-travel-expense-tracker`,
        mainEntity: {
          "@type": "SoftwareApplication",
          name: "Receipt Cycle Business Travel Expense Tracker",
          applicationCategory: "FinanceApplication",
          operatingSystem: "Web, iOS, Android",
          url: `${SITE_URL}/business-travel-expense-tracker`,
          description:
            "Business travel expense tracking software for receipt capture, editable transaction records, travel categories, account context, date filtering, and CSV export.",
          featureList: [
            "Receipt camera, gallery selection, and supported web image upload",
            "Manual travel expense entry",
            "Editable merchant, amount, date, category, payment method, account, and notes",
            "Receipt evidence connected to transaction records when available",
            "Search by merchant, description, category, and amount",
            "Filters for date range, category, account, and transaction type",
            "Cash, card, bank, and savings account activity",
            "CSV transaction export when plan and workspace access permit",
          ],
        },
      },
      breadcrumb([
        { name: "Home", path: "/" },
        { name: "Business Travel Expense Tracker", path: "/business-travel-expense-tracker" },
      ]),
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "What can I record with a business travel expense tracker?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Record expenses such as airfare, hotels, meals, ground transportation, parking, fuel, event fees, internet access, and trip supplies when they relate to your work. Each Receipt Cycle transaction can include an amount, merchant, category, date, payment method, linked account, notes, and available receipt evidence.",
            },
          },
          {
            "@type": "Question",
            name: "Can I scan travel receipts while I am away?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. Use the mobile receipt camera or choose an image from the gallery, then review the extracted details before saving. You can also upload a supported receipt image on the web or enter the purchase manually when there is no usable image.",
            },
          },
          {
            "@type": "Question",
            name: "Can I group expenses under a trip name?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Receipt Cycle does not currently provide a dedicated trip object or trip-name field. Use the travel dates, categories, linked account, merchant search, and transaction notes to retrieve the relevant records. Do not rely on the product for itinerary or booking management.",
            },
          },
          {
            "@type": "Question",
            name: "Does Receipt Cycle create a business trip expense report?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Receipt Cycle provides transaction history, date and category filters, report totals, and CSV export when available for the plan and workspace. It does not currently claim a formatted PDF expense report dedicated to one trip.",
            },
          },
          {
            "@type": "Question",
            name: "Does it handle expense claims and employee reimbursement?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "No. Receipt Cycle can organize the records that may support a claim or reimbursement discussion, but it is not travel expense claims software. It does not submit claims, route manager approvals, enforce travel policy, or repay employees.",
            },
          },
          {
            "@type": "Question",
            name: "Can a corporate or small team use it for travel expenses?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Teams can use consistent categories, accounts, notes, receipt evidence, and exports to improve record quality. Receipt Cycle is not positioned as a corporate booking, card-feed, or enterprise travel and expense management platform.",
            },
          },
          {
            "@type": "Question",
            name: "Does Receipt Cycle reconcile travel expenses automatically?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "No. Business travel expense reconciliation remains a review task. Filters, accounts, payment methods, notes, and receipt attachments help you compare records, but Receipt Cycle does not automatically match card feeds, settle cash advances, or approve discrepancies.",
            },
          },
          {
            "@type": "Question",
            name: "Can I export my travel transaction records?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "CSV export is available when the account plan and administrator settings permit it. The export includes transaction fields such as date, type, category, amount, merchant, description, payment method, and workspace. PDF travel-report export is not currently claimed.",
            },
          },
        ],
      },
    ],
    noscriptHtml: noscriptWrap(
      "Business travel expense tracker for the whole trip",
      `<p>Capture travel receipts, review every purchase, and return to an organized record of airfare, lodging, meals, and transportation.</p>
       <h2>Record each travel purchase</h2>
       <ul>
         <li>Scan a supported receipt image or enter the expense manually.</li>
         <li>Review the merchant, amount, date, category, payment method, account, and notes.</li>
         <li>Keep available receipt evidence connected to the transaction record.</li>
       </ul>
       <h2>Return to the trip after traveling</h2>
       <p>Search merchants and descriptions, filter transactions by date, category, account, or type, and export CSV transaction data when plan and workspace access permit.</p>
       <p><a href="/signup?intent=expense">Track your first travel expense</a>. No credit card required.</p>`,
    ),
  },
  {
    path: "/freelancer-tax-receipt-tracker",
    title: "Freelancer Tax Tracker & Receipt Organizer | Receipt Cycle",
    description:
      "Capture freelancer receipts, organize business expenses, review records by date and category, and export transaction data for tax preparation with Receipt Cycle.",
    ogImage: `${SITE_URL}/landing/freelancer-tax-receipt-tracker-og.png`,
    ogImageAlt: "Receipt Cycle freelancer tax tracker showing categorized expense records, receipt evidence, and CSV export",
    structuredData: [
      organization,
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Freelancer Tax & Receipt Tracker",
        description:
          "Capture freelancer receipts, organize business expenses, review records by date and category, and export transaction data for tax preparation with Receipt Cycle.",
        url: `${SITE_URL}/freelancer-tax-receipt-tracker`,
        mainEntity: {
          "@type": "SoftwareApplication",
          name: "Receipt Cycle Freelancer Tax Tracker",
          applicationCategory: "FinanceApplication",
          operatingSystem: "Web, iOS, Android",
          url: `${SITE_URL}/freelancer-tax-receipt-tracker`,
          description:
            "Freelancer receipt and expense record software for receipt capture, editable transaction details, categories, search, date filtering, account context, and CSV export.",
          featureList: [
            "Receipt camera, gallery selection, and supported web image upload",
            "Editable merchant, amount, date, category, payment method, account, tax, and notes",
            "Receipt evidence connected to saved transactions when available",
            "Manual expense and income entry",
            "Search by merchant, description, category, and amount",
            "Filters for date range, category, account, transaction type, and sort order",
            "Category-aware reports and income-and-expense totals",
            "CSV transaction export when plan and administrator access permit",
          ],
        },
      },
      breadcrumb([
        { name: "Home", path: "/" },
        { name: "Freelancer Tax & Receipt Tracker", path: "/freelancer-tax-receipt-tracker" },
      ]),
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "What does a freelancer tax tracker do?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Receipt Cycle helps freelancers capture receipts, record business expenses, review transaction details, organize categories, search a date range, and export supported transaction data. It prepares records for review. It does not calculate a return, file taxes, or determine which purchases qualify under tax law.",
            },
          },
          {
            "@type": "Question",
            name: "Can I scan tax receipts with my phone?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. The mobile app supports receipt capture with the camera or an image from the gallery. The web workspace supports compatible image uploads. OCR can propose visible purchase details, and you should review every field before saving the expense.",
            },
          },
          {
            "@type": "Question",
            name: "Does Receipt Cycle decide which expenses are tax deductions?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "No. Receipt Cycle is not a tax deduction tracker that decides eligibility. Categories, notes, receipt evidence, and transaction history can help you present the facts, but you or a qualified tax professional must decide how an expense should be treated.",
            },
          },
          {
            "@type": "Question",
            name: "Can I use it as a receipt tracker for taxes throughout the year?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. Capture records as purchases happen, then review them weekly or monthly. A consistent habit gives you a stronger starting point than waiting until a filing deadline to rebuild the year from paper, email, and card statements.",
            },
          },
          {
            "@type": "Question",
            name: "Can I organize both expenses and income?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Receipt Cycle supports expense and income transaction types. Reports and workspace totals can provide broader context, but the product does not claim to calculate taxable income, estimated payments, or tax owed.",
            },
          },
          {
            "@type": "Question",
            name: "Can I give my accountant a CSV export?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "CSV export is available when the plan and administrator settings permit it. The file can include transaction fields such as date, type, category, amount, merchant, description, payment method, and workspace. Confirm the export contents and any additional evidence your accountant needs.",
            },
          },
          {
            "@type": "Question",
            name: "Does the CSV include every receipt image?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Do not assume it does. CSV is a structured transaction-data format, not a bundle of image attachments. Receipt evidence may remain with the saved transaction, so review your handoff process before sending records elsewhere.",
            },
          },
          {
            "@type": "Question",
            name: "Does Receipt Cycle replace tax software or an accountant?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "No. Receipt Cycle is a record-organization workspace. It does not prepare or submit tax forms, provide legal or accounting advice, guarantee compliance, calculate savings, or replace the professional responsible for tax decisions.",
            },
          },
        ],
      },
    ],
    noscriptHtml: noscriptWrap(
      "Freelancer tax tracker for receipts and expense records",
      `<p>Capture business purchases as they happen, preserve the supporting receipt, and prepare an organized record for tax-time review.</p>
       <h2>Maintain the expense record throughout the year</h2>
       <ul>
         <li>Scan a supported receipt image or enter the purchase manually.</li>
         <li>Review the merchant, amount, date, category, account, payment method, tax, and notes.</li>
         <li>Search and filter records by date, category, account, type, merchant, description, or amount.</li>
       </ul>
       <h2>Prepare records without replacing tax judgment</h2>
       <p>Use category views, receipt evidence, reports, and supported CSV export to prepare a review. Receipt Cycle does not determine deductions, calculate tax, file returns, or replace an accountant.</p>
       <p><a href="/signup?intent=expense">Organize your first tax receipt</a>. No credit card required.</p>`,
    ),
  },
  {
    path: "/business-budgeting-software",
    title: "Business Budgeting Software for Small Teams | Receipt Cycle",
    description:
      "Set monthly category budgets, compare recorded spending with each limit, and review the transactions behind your progress with Receipt Cycle.",
    ogImage: `${SITE_URL}/landing/business-budgeting-software-og.png`,
    ogImageAlt: "Receipt Cycle business budgeting software showing monthly category limits, spending progress, and remaining amounts",
    structuredData: [
      organization,
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Business Budgeting & Expense Planning",
        description:
          "Set monthly category budgets, compare recorded spending with each limit, and review the transactions behind your progress with Receipt Cycle.",
        url: `${SITE_URL}/business-budgeting-software`,
        mainEntity: {
          "@type": "SoftwareApplication",
          name: "Receipt Cycle Business Budgeting Software",
          applicationCategory: "FinanceApplication",
          operatingSystem: "Web, iOS, Android",
          url: `${SITE_URL}/business-budgeting-software`,
          description:
            "Monthly business budgeting software for category limits, recorded spending, remaining amounts, percentage used, and recent transaction review.",
          featureList: [
            "Monthly category budget limits",
            "Total budget, recorded spending, and remaining summaries",
            "Category-level budget versus actual comparison",
            "Percentage-used and monthly progress views",
            "Recent expense transactions within each category",
            "Month navigation and editable budget limits",
            "Over-budget states when recorded spending exceeds a limit",
          ],
        },
      },
      breadcrumb([
        { name: "Home", path: "/" },
        { name: "Business Budgeting Software", path: "/business-budgeting-software" },
      ]),
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "What does business budgeting software do in Receipt Cycle?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Receipt Cycle lets you choose a month, set limits for individual expense categories, compare those limits with recorded spending, and see the amount remaining. You can open a category to review its progress and recent transactions.",
            },
          },
          {
            "@type": "Question",
            name: "Can I create a different category budget for each month?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. Budgets are associated with a selected month and category. Move between months to prepare a new plan or review an earlier one without requiring every month to use the same amount.",
            },
          },
          {
            "@type": "Question",
            name: "How is budget versus actual spending calculated?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "The budget is the limit entered for a category. Actual spending comes from saved expense transactions in that category during the selected month. Receipt Cycle compares the two and calculates the remaining amount.",
            },
          },
          {
            "@type": "Question",
            name: "What happens when a category goes over budget?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "The remaining amount becomes negative and the interface can show the category as over its limit. This is a review signal, not a blocked payment. Receipt Cycle does not decline purchases or enforce card controls.",
            },
          },
          {
            "@type": "Question",
            name: "Does the business budgeting app send budget alerts?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "The current budgeting workspace shows progress, percentage used, remaining amounts, and over-budget states when reviewed. This page does not promise automatic budget alerts, email warnings, or push notifications.",
            },
          },
          {
            "@type": "Question",
            name: "Can I see which purchases used a category budget?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. Open the category detail to see recent expense transactions assigned to it for the selected month. Merchant or description, date, and amount connect the progress view to the underlying records.",
            },
          },
          {
            "@type": "Question",
            name: "Is this business financial planning software?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Receipt Cycle supports practical monthly expense planning and monitoring. It is not a forecasting suite, cash-flow scenario model, general ledger, payroll system, tax planner, or enterprise financial planning platform.",
            },
          },
          {
            "@type": "Question",
            name: "Can I use Receipt Cycle instead of a spreadsheet?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "You can move monthly category limits and their actual expense progress into Receipt Cycle. A spreadsheet may still be useful for forecasts, staffing plans, or scenarios that the product does not support.",
            },
          },
        ],
      },
    ],
    noscriptHtml: noscriptWrap(
      "Business budgeting software that keeps spending in view",
      `<p>Set monthly category limits, compare them with recorded expenses, and open the purchases behind every total.</p>
       <h2>Plan and review one month at a time</h2>
       <ul>
         <li>Set positive monthly limits for the expense categories worth watching.</li>
         <li>Compare total budget, recorded spending, and the amount remaining.</li>
         <li>Open a category to review percentage used, progress, and recent transactions.</li>
       </ul>
       <h2>Use a focused budgeting workspace</h2>
       <p>Receipt Cycle supports category-level expense planning. It does not forecast cash flow, enforce card limits, approve purchases, or replace accounting software.</p>
       <p><a href="/signup?intent=budget">Set your first budget</a>. No credit card required.</p>`,
    ),
  },
  {
    path: "/client-management-software",
    title: "Client Management Software for Small Business | Receipt Cycle",
    description:
      "Keep customer details, invoice history, outstanding balances, and reusable products or services connected with Receipt Cycle client management software.",
    ogImage: `${SITE_URL}/landing/client-management-software-og.png`,
    ogImageAlt: "Receipt Cycle client management software showing customer profiles, invoice history, balances, and reusable services",
    structuredData: [
      organization,
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Client & Customer Management for Invoicing",
        description:
          "Keep customer details, invoice history, outstanding balances, and reusable products or services connected with Receipt Cycle client management software.",
        url: `${SITE_URL}/client-management-software`,
        mainEntity: {
          "@type": "SoftwareApplication",
          name: "Receipt Cycle Client Management Software",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          url: `${SITE_URL}/client-management-software`,
          description:
            "Client management software for small business billing records, customer contact details, document history, outstanding balances, and reusable products or services.",
          featureList: [
            "Searchable customer profiles",
            "Contact and billing information",
            "Customer status and internal notes",
            "Connected invoice history",
            "Invoice count and outstanding balance",
            "Reusable products and services catalog",
            "Catalog descriptions, categories, unit prices, and active state",
          ],
        },
      },
      breadcrumb([
        { name: "Home", path: "/" },
        { name: "Client Management Software", path: "/client-management-software" },
      ]),
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "What is client management software for small business?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "It is software for storing useful client details and keeping the work around each relationship easier to find. In Receipt Cycle, that means customer contact and billing information, status, notes, invoice count, outstanding balance, and linked document history. It is focused on billing context rather than a full sales CRM.",
            },
          },
          {
            "@type": "Question",
            name: "Can I keep customer contact information in Receipt Cycle?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. A customer record can include the contact name, company, email address, phone number, billing address, status, and internal notes. You can edit the record when details change and search the directory by customer, company, or email.",
            },
          },
          {
            "@type": "Question",
            name: "Does each customer record show invoice history?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. The customer workspace connects invoices to the saved customer. You can review invoice numbers, due dates, status, totals, invoice count, and the calculated amount still outstanding. Estimate, invoice, and payment actions remain in their dedicated workspaces.",
            },
          },
          {
            "@type": "Question",
            name: "Can I save services and prices for later invoices?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. The Items & Services catalog stores a product or service name, description, category, unit price, type, and active state. Those entries can be selected when building estimates or invoices so common work does not have to be typed again.",
            },
          },
          {
            "@type": "Question",
            name: "Is Receipt Cycle a customer database software product?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Receipt Cycle provides a practical customer directory for billing work. It is suitable when you need searchable customer records connected to sales documents and balances. It is not a general-purpose database builder, marketing platform, or enterprise customer-data platform.",
            },
          },
          {
            "@type": "Question",
            name: "Does Receipt Cycle replace a CRM?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "No. Receipt Cycle does not claim lead scoring, opportunity pipelines, campaign automation, call logging, email-open tracking, or sales forecasting. Use it when the main need is keeping customer information close to estimates, invoices, payments, and reusable billing items.",
            },
          },
          {
            "@type": "Question",
            name: "Can freelancers use the client management app?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. Client management for freelancers often begins with a smaller need: keep the correct billing address, remember a useful note, find prior invoices, and reuse a familiar service price. Receipt Cycle supports that focused workflow without forcing a complex sales process.",
            },
          },
          {
            "@type": "Question",
            name: "Can I track outstanding balances by customer?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. The customer directory calculates the balance from connected invoices and recorded paid amounts. Open the customer to review the invoice entries behind that figure. Payment recording and receipt generation are explained on the dedicated payment tracking page.",
            },
          },
        ],
      },
    ],
    noscriptHtml: noscriptWrap(
      "Client management software for small business billing",
      `<p>Keep customer details, document history, outstanding balances, and reusable services ready for the next estimate or invoice.</p>
       <h2>Start with the customer record</h2>
       <ul>
         <li>Store contact name, company, email, phone, billing address, status, and notes.</li>
         <li>Review connected invoice history, invoice count, status, totals, and outstanding balance.</li>
         <li>Save reusable products and services with descriptions, categories, unit prices, and active state.</li>
       </ul>
       <h2>Focused customer management for billing</h2>
       <p>Receipt Cycle connects customer records to estimates, invoices, payments, and catalog items. It does not claim CRM pipelines, marketing automation, inventory, scheduling, or project management.</p>
       <p><a href="/signup?intent=customer">Add your first customer</a>. No credit card required.</p>`,
    ),
  },
  {
    path: "/expense-reporting-software",
    title: "Expense Report Software for Small Business | Receipt Cycle",
    description:
      "Review income, expenses, category spending, cash flow, payments, and overdue invoices with Receipt Cycle expense report software for small business.",
    ogImage: `${SITE_URL}/landing/expense-reporting-software-og.png`,
    ogImageAlt: "Receipt Cycle expense report software showing income, expenses, cash flow, category spending, and invoice exposure",
    structuredData: [
      organization,
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Expense Reports & Financial Reporting",
        description:
          "Review income, expenses, category spending, cash flow, payments, and overdue invoices with Receipt Cycle expense report software for small business.",
        url: `${SITE_URL}/expense-reporting-software`,
        mainEntity: {
          "@type": "SoftwareApplication",
          name: "Receipt Cycle Expense Report Software",
          applicationCategory: "FinanceApplication",
          operatingSystem: "Web, iOS, Android",
          url: `${SITE_URL}/expense-reporting-software`,
          description:
            "Expense reporting software for period summaries, category analysis, monthly cash movement, payments, invoice aging, and record-grounded review.",
          featureList: [
            "Monthly and all-time income and expense summaries",
            "Net movement and transaction-count reporting",
            "Expense distribution by category",
            "Six-month and current-year cash-flow views",
            "Payments received and paid-invoice counts",
            "Outstanding and overdue invoice reporting",
            "Record-grounded AI-assisted analysis",
            "Supported CSV transaction export",
          ],
        },
      },
      breadcrumb([
        { name: "Home", path: "/" },
        { name: "Expense Report Software", path: "/expense-reporting-software" },
      ]),
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "What does Receipt Cycle expense report software show?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "The reporting workspace summarizes saved income and expense records for the selected period. It shows income, expenses, net movement, record count, category distribution, cash-flow comparisons, payments received, paid-invoice counts, outstanding invoices, and overdue invoice context where those records are available.",
            },
          },
          {
            "@type": "Question",
            name: "Can I review monthly income and expense reports?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. The main report can focus on the current month or all available records. The cash-flow report can compare the last six months or the current year using monthly income and expense bars, total inflow, total outflow, and net cash movement.",
            },
          },
          {
            "@type": "Question",
            name: "Does the expense reporting app show category spending?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. Receipt Cycle groups saved expense records by category, calculates category totals and transaction counts, and shows the largest categories in a distribution view. Open the transaction workspace when a category needs correction or record-level review.",
            },
          },
          {
            "@type": "Question",
            name: "Can it report on invoices and payments?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "The report dashboard includes outstanding invoice value, payments received, and paid-invoice counts. A separate overdue view shows overdue amount, invoice count, average days overdue, customer, balance, and due status. Recording a payment remains part of the dedicated payment workflow.",
            },
          },
          {
            "@type": "Question",
            name: "Does Receipt Cycle create automated expense reports?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "The totals and charts recalculate from the saved records available to the selected period, so routine summaries do not need to be rebuilt manually. Receipt Cycle does not claim automatic employee claim submission, approval routing, reimbursement processing, scheduled email delivery, or automatic filing.",
            },
          },
          {
            "@type": "Question",
            name: "Can I export a business expense report?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Supported plans and workspaces can export transaction data as CSV for use in a spreadsheet or professional review. The export is structured transaction data, not a generated tax return, statutory financial statement, PDF claim packet, or guaranteed bundle of receipt images.",
            },
          },
          {
            "@type": "Question",
            name: "What can the AI analysis do with my reports?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "AI-assisted analysis can use a limited structured slice of saved transaction fields to answer questions about category totals, merchant patterns, period comparisons, recurring charges, possible duplicate entries, unusual patterns, and plain-language activity summaries. It does not alter records or make regulated financial decisions.",
            },
          },
          {
            "@type": "Question",
            name: "Is this financial reporting software for small business accounting?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Receipt Cycle provides operational reporting for saved transactions and connected sales records. It does not claim a general ledger, balance sheet, statutory profit-and-loss statement, bank reconciliation, payroll, inventory accounting, audit assurance, or automatic tax filing.",
            },
          },
        ],
      },
    ],
    noscriptHtml: noscriptWrap(
      "Expense report software for a complete business view",
      `<p>Review income, expenses, category spending, cash movement, payments, and overdue invoices without rebuilding the month by hand.</p>
       <h2>Understand the period and its source records</h2>
       <ul>
         <li>Compare income, expenses, net movement, and monthly cash flow.</li>
         <li>Review category totals, transaction counts, payments, outstanding balances, and invoice aging.</li>
         <li>Use supported AI analysis and CSV export where the plan and workspace allow them.</li>
       </ul>
       <h2>Operational reports with clear boundaries</h2>
       <p>Receipt Cycle does not claim employee expense claims, reimbursement workflows, statutory accounting statements, audit assurance, or automatic tax filing.</p>
       <p><a href="/signup?intent=report">Create your reporting workspace</a>. No credit card required.</p>`,
    ),
  },
  {
    path: "/ai-financial-assistant",
    title: "AI Financial Assistant for Small Business | Receipt Cycle",
    description:
      "Ask questions about spending, categories, merchants, income, expenses, and financial trends using Receipt Cycle AI analysis grounded in saved business records.",
    ogImage: `${SITE_URL}/landing/ai-financial-assistant-og.png`,
    ogImageAlt: "Receipt Cycle AI financial assistant showing a record-grounded expense question, category comparison, and source transactions",
    structuredData: [
      organization,
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "AI Financial Assistant and AI Expense Analysis",
        description:
          "Ask questions about spending, categories, merchants, income, expenses, and financial trends using Receipt Cycle AI analysis grounded in saved business records.",
        url: `${SITE_URL}/ai-financial-assistant`,
        mainEntity: {
          "@type": "SoftwareApplication",
          name: "Receipt Cycle AI Financial Assistant",
          applicationCategory: "FinanceApplication",
          operatingSystem: "Web",
          url: `${SITE_URL}/ai-financial-assistant`,
          description:
            "A record-grounded AI financial assistant for questions about saved business transactions, category totals, merchant patterns, income, expenses, and possible data anomalies.",
          featureList: [
            "Typed financial questions grounded in saved records",
            "Supported microphone input",
            "Income and expense comparison",
            "Expense category totals and ordering",
            "Merchant pattern summaries",
            "Plain-language business activity recaps",
            "Possible recurring, similar, and unusual entry review",
            "Source-record verification without automatic edits",
          ],
        },
      },
      breadcrumb([
        { name: "Home", path: "/" },
        { name: "AI Financial Assistant", path: "/ai-financial-assistant" },
      ]),
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "What is an AI financial assistant?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "An AI financial assistant helps a person ask plain-language questions about financial data. In Receipt Cycle, Ask AI works from a limited structured view of saved transaction records. It can restate totals, order categories, describe merchant patterns, compare activity represented in the available data, and produce a concise recap. It does not have authority to change the ledger or make financial decisions.",
            },
          },
          {
            "@type": "Question",
            name: "What records can Receipt Cycle use for AI expense analysis?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "The request can include saved transaction fields such as date, amount, type, category, merchant, and description where those fields are available. The assistant also receives calculated context such as transaction counts, income, expenses, and leading expense categories. A limited slice is used for each request rather than an unrestricted view of every workspace feature.",
            },
          },
          {
            "@type": "Question",
            name: "Can I ask a question by voice?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes, supported browsers can capture a spoken question through the microphone. Receipt Cycle transcribes the audio and sends the resulting question to Ask AI. You can also type instead. Microphone permission, sign-in, plan access, and configured service availability are required for the voice path.",
            },
          },
          {
            "@type": "Question",
            name: "Can the AI find duplicate or recurring expenses?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "The optional pattern review can flag entries that appear similar, repeat at the same merchant, use the same amount on nearby dates, or stand out within the supplied expense data. These are possible patterns, not confirmed duplicates or unauthorized charges. Verify a finding against the saved entry and, when needed, the original receipt or statement.",
            },
          },
          {
            "@type": "Question",
            name: "Is Receipt Cycle an AI bookkeeping assistant?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Receipt Cycle can organize and summarize records that you have saved, which may support parts of a bookkeeping review. It does not autonomously maintain books, reconcile bank accounts, post journal entries, prepare statutory statements, choose accounting treatment, or file taxes. A bookkeeper or accountant remains responsible for professional work.",
            },
          },
          {
            "@type": "Question",
            name: "Does the assistant provide financial or tax advice?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "No. The assistant is restricted to neutral summaries and organization of the user's own logged data. It does not give accounting, tax, legal, investment, debt, or personal financial advice. It also does not tell a user to cut spending, cancel a service, invest, or change financial behavior.",
            },
          },
          {
            "@type": "Question",
            name: "Will Ask AI change my transaction records?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "No. Ask AI returns a response but does not edit amounts, dates, categories, merchants, descriptions, or transaction types. If a question exposes a possible issue, open the source record, inspect the evidence, and make any correction yourself.",
            },
          },
          {
            "@type": "Question",
            name: "How is this different from an AI financial dashboard?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "A dashboard presents fixed totals and charts. Ask AI adds a conversational layer for questions about the records made available to it. Receipt Cycle also has dedicated reporting views for category distribution, cash movement, payments, and invoice aging. Use those views for repeatable expense reports and use AI expense reporting questions when you want a plain-language explanation or a new line of inquiry.",
            },
          },
        ],
      },
    ],
    noscriptHtml: noscriptWrap(
      "AI financial assistant grounded in your business records",
      `<p>Ask about spending, categories, merchants, income, expenses, and recent activity using the records already saved in Receipt Cycle.</p>
       <h2>Ask, compare, and verify</h2>
       <ul>
         <li>Use typed or supported microphone input for questions about saved activity.</li>
         <li>Review category totals, merchant patterns, income and expense comparisons, and plain-language recaps.</li>
         <li>Investigate possible repeats, similar entries, and unusual amounts against the source records.</li>
       </ul>
       <h2>Analysis without autonomous decisions</h2>
       <p>Receipt Cycle does not change records, provide accounting or tax treatment, make financial decisions, or replace a qualified professional.</p>
       <p><a href="/signup?intent=ai">Ask your first financial question</a>. No credit card required.</p>`,
    ),
  },
  {
    path: "/about",
    title: "About Receipt Cycle — Why We Built an AI Expense Tracker",
    description:
      "Why Receipt Cycle exists, who it's for, and the principles that guide how we build an AI receipt scanner and expense tracker people actually use.",
    structuredData: [
      organization,
      breadcrumb([
        { name: "Home", path: "/" },
        { name: "About", path: "/about" },
      ]),
    ],
    noscriptHtml: noscriptWrap(
      "About Receipt Cycle",
      `<p>Receipt Cycle is an AI-powered expense tracker and receipt scanner built for freelancers, independent professionals, and small teams.</p>
       <p>We started Receipt Cycle because finance tools fail when capture is harder than ignoring the problem. Our goal is simple: compress the grind of bookkeeping so you can justify every dollar, reclaim tax-time hours, and catch money leaks while they're still small.</p>
       <p>Contact us at <a href="mailto:support@receiptcycle.com">support@receiptcycle.com</a>.</p>`,
    ),
  },
  {
    path: "/blog",
    title: "Receipt Cycle Blog — Expense Tracking, Tax Tips, and Money Leaks",
    description:
      "Practical articles on receipt scanning, expense tracking, tax preparation for freelancers, and how to catch money leaks before they drain your business.",
    structuredData: [
      organization,
      {
        "@context": "https://schema.org",
        "@type": "Blog",
        name: `${SITE_NAME} Blog`,
        url: `${SITE_URL}/blog`,
        blogPost: BLOG_POSTS.map((p) => ({
          "@type": "BlogPosting",
          headline: p.title,
          url: `${SITE_URL}/blog/${p.slug}`,
          datePublished: p.datePublished,
          dateModified: p.dateModified,
          author: { "@type": "Organization", name: p.author },
          description: p.description,
        })),
      },
      breadcrumb([
        { name: "Home", path: "/" },
        { name: "Blog", path: "/blog" },
      ]),
    ],
    noscriptHtml: noscriptWrap(
      "Receipt Cycle Blog",
      `<p>Practical articles on expense tracking, receipt scanning, and catching money leaks.</p>
       <ul>${BLOG_POSTS.map(
          (p) =>
            `<li><a href="/blog/${p.slug}"><strong>${escapeHtml(p.title)}</strong></a> — ${escapeHtml(p.description)}</li>`,
        ).join("")}</ul>`,
    ),
  },
  {
    path: "/pricing",
    title: "Pricing — Receipt Cycle Free, Pro Monthly, Pro Yearly",
    description:
      "Simple pricing for Receipt Cycle. Start free. Unlock AI finance coach, unlimited scanning, bank imports, and money-leak alerts with Pro Monthly or Pro Yearly.",
    structuredData: [organization, softwareApp],
    noscriptHtml: noscriptWrap(
      "Receipt Cycle Pricing",
      `<ul>
         <li><strong>Free</strong> — basic receipt scanning and transaction tracking.</li>
         <li><strong>Pro Monthly</strong> — unlimited scanning, AI finance coach, bank imports, exports, money-leak alerts.</li>
         <li><strong>Pro Yearly</strong> — same as Pro Monthly, annual discount.</li>
       </ul>`,
    ),
  },
  {
    path: "/faq",
    title: "FAQ — Receipt Cycle",
    description:
      "Answers to common questions about Receipt Cycle: how scanning works, where data is stored, offline support, and how the web and mobile apps fit together.",
    // Keep FAQ page schema focused to avoid unsupported/unnamed rich-result items.
    structuredData: [faqSchema()],
    noscriptHtml: noscriptWrap(
      "Frequently asked questions",
      `<dl>${SITE_FAQ_ITEMS.map(
        (i) => `<dt><strong>${escapeHtml(i.q)}</strong></dt><dd>${escapeHtml(i.a)}</dd>`,
      ).join("")}</dl>`,
    ),
  },
  {
    path: "/contact",
    title: "Contact Receipt Cycle — We Reply in One Business Day",
    description:
      "Reach the Receipt Cycle team for support, billing, partnerships, or press. We reply to every email within one business day.",
    structuredData: [organization],
    noscriptHtml: noscriptWrap(
      "Contact us",
      `<p>Email <a href="mailto:support@receiptcycle.com">support@receiptcycle.com</a>. We reply within one business day.</p>`,
    ),
  },
  {
    path: "/privacy",
    title: "Privacy Policy — Receipt Cycle",
    description:
      "How Receipt Cycle collects, uses, and protects your data. Encryption at rest and in transit, user-controlled deletion, GDPR/CCPA compliance.",
    structuredData: [organization],
  },
  {
    path: "/terms",
    title: "Terms of Service — Receipt Cycle",
    description: "Terms of service for Receipt Cycle web and mobile apps.",
    structuredData: [organization],
  },
  {
    path: "/refund-policy",
    title: "Refund Policy — Receipt Cycle",
    description:
      "Our refund policy for Receipt Cycle Pro Monthly and Pro Yearly plans.",
    structuredData: [organization],
  },
  {
    path: "/cookies",
    title: "Cookie Policy — Receipt Cycle",
    description: "How Receipt Cycle uses cookies on the marketing site and the web app.",
    structuredData: [organization],
  },
];

export function getRouteSeo(path: string): RouteSeo | undefined {
  const normalized = path.replace(/\/$/, "") || "/";
  return staticRoutes.find((r) => (r.path === "/" ? normalized === "/" : r.path === normalized));
}

export function allPrerenderRoutes(): RouteSeo[] {
  const blog = BLOG_POSTS.map<RouteSeo>((post) => ({
    path: `/blog/${post.slug}`,
    title: `${post.title} — Receipt Cycle`,
    description: post.description,
    ogImage: post.featuredImage?.startsWith("http")
      ? post.featuredImage
      : `${SITE_URL}${post.featuredImage}`,
    ogImageAlt: post.title,
    ogType: "article",
    structuredData: [
      organization,
      blogPostSchema(post),
      breadcrumb([
        { name: "Home", path: "/" },
        { name: "Blog", path: "/blog" },
        { name: post.title, path: `/blog/${post.slug}` },
      ]),
    ],
    noscriptHtml: blogPostNoscript(post),
  }));
  return [...staticRoutes, ...blog];
}

export function getBlogPostSeo(slug: string): RouteSeo | undefined {
  return allPrerenderRoutes().find((r) => r.path === `/blog/${slug}`);
}
