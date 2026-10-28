import { Link, useParams, Navigate } from "react-router-dom";
import { CommercialFooter, CommercialHeader } from "@/components/marketing/CommercialLandingLayout";
import { Seo } from "@/components/Seo";
import { blogSection, getBlogPostSeo } from "@/content/routesSeo";
import { getPostBySlug, BLOG_POSTS, type BlogBlock, type BlogFaqItem } from "@/content/blogPosts";
import { SITE_URL } from "@/lib/seo";
import { aiSummaryLinks } from "@/lib/blogAiSummary";
import { appTone, isOurProduct, overallScore } from "@/lib/appTones";
import { hostnameOf, isInternalHref, tokenizeInline } from "@/lib/blogMarkdown";
import { CalendarDays, Check, Clock3, Copy, Link2, Mail, RefreshCw, Share2 } from "lucide-react";
import { useState, type ReactNode } from "react";

const LINK_CLASS =
  "rounded-sm font-medium text-teal-700 underline decoration-teal-700/40 underline-offset-2 hover:text-teal-900 hover:decoration-teal-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600";

const INLINE_LINK_RULES: Array<{ phrase: string; href: string; external?: boolean }> = [
  { phrase: "how to organize receipts for your accountant", href: "/blog/best-expense-tracker-for-freelancers" },
  { phrase: "staying compliant with a tax receipt tracker", href: "/blog/receipt-scanner-tax-purposes-audit-ready-year-round" },
  { phrase: "how to track business travel expenses", href: "/blog/scan-receipts-for-tax-refund" },
  { phrase: "how freelancers can track business expenses", href: "/blog/freelancers-guide-tracking-business-expenses" },
  { phrase: "how OCR and AI work together in receipt scanning", href: "/blog/how-ocr-receipt-scanning-works-ai-smarter" },
  { phrase: "why a combined expense tracker and receipt scanner changes everything", href: "/blog/expense-tracker-receipt-scanner-one-two-punch" },
  { phrase: "IRS Publication 463", href: "https://www.irs.gov/publications/p463", external: true },
  {
    phrase: "NerdWallet's research on subscription spending",
    href: "https://www.nerdwallet.com/article/finance/how-to-stop-paying-monthly-subscriptions-you-forgot-about",
    external: true,
  },
  { phrase: "receiptcycle.com", href: "/" },
];

function autoLinkText(text: string, prefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    let best: { idx: number; rule: (typeof INLINE_LINK_RULES)[number] } | null = null;
    for (const rule of INLINE_LINK_RULES) {
      const idx = remaining.toLowerCase().indexOf(rule.phrase.toLowerCase());
      if (idx === -1) continue;
      if (!best || idx < best.idx) best = { idx, rule };
    }

    if (!best) {
      out.push(remaining);
      break;
    }

    if (best.idx > 0) out.push(remaining.slice(0, best.idx));
    const originalPhrase = remaining.slice(best.idx, best.idx + best.rule.phrase.length);
    out.push(
      <InlineLink key={`${prefix}-auto-${key++}`} href={best.rule.href}>
        {originalPhrase}
      </InlineLink>,
    );
    remaining = remaining.slice(best.idx + best.rule.phrase.length);
  }

  return out;
}

/** Anchor for an inline link: internal "/..." hrefs use the router, everything else opens in a new tab. */
function InlineLink({ href, children }: { href: string; children: ReactNode }) {
  if (isInternalHref(href)) {
    return (
      <Link to={href} className={LINK_CLASS}>
        {children}
      </Link>
    );
  }
  if (href.startsWith("#") || href.startsWith("mailto:")) {
    return (
      <a href={href} className={LINK_CLASS}>
        {children}
      </a>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
      {children}
    </a>
  );
}

/** Renders text with [label](href) links. `autoLink` also applies the legacy phrase-to-link rules to plain text. */
function renderRich(text: string, autoLink = false): ReactNode[] {
  const out: ReactNode[] = [];
  tokenizeInline(text).forEach((tok, i) => {
    if (tok.type === "link") out.push(<InlineLink key={`md-${i}`} href={tok.href}>{tok.label}</InlineLink>);
    else if (autoLink) out.push(...autoLinkText(tok.text, `t${i}`));
    else out.push(tok.text);
  });
  return out;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function AiSummaryBar({ canonicalUrl }: { canonicalUrl: string }) {
  return (
    <section aria-labelledby="ai-summary-title" className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-slate-200 pt-5">
      <h2 id="ai-summary-title" className="text-sm font-semibold text-slate-700">
        Summarize article with AI
      </h2>
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="AI summary tools">
        {aiSummaryLinks(canonicalUrl).map((provider) => (
          <a
            key={provider.label}
            href={provider.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Summarize this article with ${provider.label}`}
            title={`Summarize with ${provider.label}`}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
          >
            <img src={provider.logo} alt="" width={22} height={22} className="h-[22px] w-[22px]" loading="lazy" decoding="async" />
          </a>
        ))}
      </div>
    </section>
  );
}

function ShareLinks({ canonicalUrl, title }: { canonicalUrl: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const encodedUrl = encodeURIComponent(canonicalUrl);
  const encodedTitle = encodeURIComponent(title);

  const copyLink = async () => {
    if (!navigator.clipboard) return;
    await navigator.clipboard.writeText(canonicalUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const linkClass =
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-teal-300 hover:text-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600";

  return (
    <div className="flex flex-wrap gap-2" aria-label="Share this article">
      <a className={linkClass} href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`} target="_blank" rel="noopener noreferrer">
        <Share2 className="h-4 w-4" aria-hidden="true" /> LinkedIn
      </a>
      <a className={linkClass} href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`} target="_blank" rel="noopener noreferrer">
        <Link2 className="h-4 w-4" aria-hidden="true" /> X
      </a>
      <a className={linkClass} href={`mailto:?subject=${encodedTitle}&body=${encodedUrl}`}>
        <Mail className="h-4 w-4" aria-hidden="true" /> Email
      </a>
      <button type="button" className={linkClass} onClick={() => void copyLink()}>
        {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}

type TocItem = { id: string; text: string };

function TocLinks({ items }: { items: TocItem[] }) {
  return (
    <ol className="space-y-2.5">
      {items.map((item, index) => (
        <li key={item.id}>
          <a className="group flex gap-3 text-sm leading-5 text-slate-600 hover:text-teal-800" href={`#${item.id}`}>
            <span className="font-mono text-xs text-slate-400 group-hover:text-teal-600">{String(index + 1).padStart(2, "0")}</span>
            <span>{item.text}</span>
          </a>
        </li>
      ))}
    </ol>
  );
}

function QuickSummary({ summary, takeaways }: { summary: string; takeaways?: string[] }) {
  return (
    <section id="short-version" data-speakable="summary" className="scroll-mt-24 rounded-2xl border border-teal-200 bg-teal-50/70 p-5 sm:p-7">
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-800">Here&apos;s the short version</p>
      <p className="mt-3 text-base leading-7 text-slate-700 sm:text-lg">{renderRich(summary)}</p>
      {takeaways?.length ? (
        <div className="mt-6 border-t border-teal-200 pt-5">
          <h2 className="font-display text-xl font-bold text-slate-900">Key Takeaways</h2>
          <ul className="mt-3 space-y-3">
            {takeaways.map((item) => (
              <li key={item} className="flex gap-3 text-base leading-7 text-slate-700">
                <Check className="mt-1 h-5 w-5 shrink-0 text-teal-700" aria-hidden="true" />
                <span>{renderRich(item)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function ScoreBar({ pct, barClass }: { pct: number; barClass: string }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200" aria-hidden="true">
      <div className={`h-full rounded-full ${barClass}`} style={{ width: `${clamped}%` }} />
    </div>
  );
}

function OurTag() {
  return <span className="rounded-full bg-teal-700 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">Our product</span>;
}

function ScoreTable({ block }: { block: Extract<BlogBlock, { kind: "scoreTable" }> }) {
  return (
    <figure className="not-prose mt-8">
      <p className="mb-3 font-display text-base font-bold text-slate-900">{block.caption}</p>

      <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
        <table className="w-full table-fixed border-collapse text-left text-sm">
          <caption className="sr-only">{block.caption}</caption>
          <thead>
            <tr className="bg-slate-900 text-white">
              <th scope="col" className="w-[19%] px-3 py-3 font-semibold !text-white">Feature</th>
              {block.rows.map((row) => {
                const tone = appTone(row.app);
                const ours = isOurProduct(row.app);
                return (
                  <th key={row.app} scope="col" data-ours={ours ? "true" : undefined} className={`px-2 py-3 text-center align-bottom text-xs font-semibold leading-tight !text-white ${ours ? "bg-teal-700" : ""}`}>
                    <span aria-hidden="true" className={`mx-auto mb-1.5 block h-2.5 w-2.5 rounded-full ${tone.dot}`} />
                    {row.app}
                    {ours ? <span className="mt-1 block text-[10px] font-bold uppercase tracking-wide text-teal-100">Our product</span> : null}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {block.columns.map((column, i) => (
              <tr key={column} className="border-t border-slate-100 align-middle">
                <th scope="row" className="px-3 py-2.5 text-left text-sm font-semibold leading-tight text-slate-900">{column}</th>
                {block.rows.map((row) => {
                  const tone = appTone(row.app);
                  const ours = isOurProduct(row.app);
                  const pct = row.scores[i] ?? 0;
                  return (
                    <td key={row.app} className={`px-2 py-2.5 text-center ${ours ? "bg-teal-50" : i % 2 === 0 ? tone.tint : tone.tintAlt}`}>
                      <span className={`block text-sm font-bold tabular-nums ${tone.text}`}>{pct}%</span>
                      <span className="mx-auto mt-1 block max-w-[64px]"><ScoreBar pct={pct} barClass={tone.bar} /></span>
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="border-t-2 border-slate-300 bg-slate-50">
              <th scope="row" className="px-3 py-3 text-left text-sm font-bold text-slate-900">Overall</th>
              {block.rows.map((row) => {
                const tone = appTone(row.app);
                const ours = isOurProduct(row.app);
                return (
                  <td key={row.app} className={`px-2 py-3 text-center text-base font-extrabold tabular-nums ${tone.text} ${ours ? "bg-teal-100" : ""}`}>{overallScore(row.scores)}%</td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 md:hidden" aria-label={block.caption}>
        {block.rows.map((row) => {
          const tone = appTone(row.app);
          const ours = isOurProduct(row.app);
          const overall = overallScore(row.scores);
          return (
            <li key={row.app} data-ours={ours ? "true" : undefined} className={`rounded-2xl border border-l-4 border-slate-200 p-4 ${tone.borderL} ${ours ? "bg-teal-50" : "bg-white"}`}>
              <div className="flex flex-wrap items-center gap-2">
                <span aria-hidden="true" className={`h-3 w-3 shrink-0 rounded-full ${tone.dot}`} />
                <span className="font-display text-base font-bold text-slate-900">{row.app}</span>
                {ours ? <OurTag /> : null}
              </div>
              <dl className="mt-3 space-y-2.5">
                {block.columns.map((column, i) => (
                  <div key={column}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <dt className="text-slate-600">{column}</dt>
                      <dd className="font-semibold tabular-nums text-slate-800">{row.scores[i] ?? 0}%</dd>
                    </div>
                    <div className="mt-1"><ScoreBar pct={row.scores[i] ?? 0} barClass={tone.bar} /></div>
                  </div>
                ))}
              </dl>
              <div className={`mt-3 flex items-baseline justify-between border-t border-slate-200 pt-3 ${tone.text}`}>
                <span className="text-sm font-semibold">Overall</span>
                <span className="text-lg font-bold tabular-nums">{overall}%</span>
              </div>
            </li>
          );
        })}
      </ul>
      {block.note ? <p className="mt-3 text-sm leading-6 text-slate-600">{renderRich(block.note)}</p> : null}
    </figure>
  );
}

/** The post a "/blog/slug" link points to, so a link list can show its picture. */
function postForHref(href: string) {
  if (!isInternalHref(href) || !href.startsWith("/blog/")) return undefined;
  return getPostBySlug(href.replace(/^\/blog\//, "").replace(/[/?#].*$/, ""));
}

function CtaCard({ block }: { block: Extract<BlogBlock, { kind: "cta" }> }) {
  const buttonClass =
    "inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-6 text-sm font-bold text-teal-900 shadow-sm transition hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-teal-700";
  return (
    <aside className="not-prose mt-10 rounded-2xl bg-gradient-to-br from-teal-700 to-teal-800 p-6 text-white shadow-lg sm:p-8">
      <h3 className="font-display text-2xl font-bold !text-white">{block.title}</h3>
      <p className="mt-3 max-w-xl text-base leading-7 text-teal-50">{renderRich(block.text)}</p>
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
        {isInternalHref(block.href) ? (
          <Link to={block.href} className={buttonClass}>{block.label}</Link>
        ) : (
          <a href={block.href} target="_blank" rel="noopener noreferrer" className={buttonClass}>{block.label}</a>
        )}
        {block.note ? <span className="text-sm text-teal-50">{block.note}</span> : null}
      </div>
    </aside>
  );
}

function Block({ block }: { block: BlogBlock }) {
  if (block.kind === "p") return <p className="mt-5 leading-relaxed text-slate-700">{renderRich(block.text, true)}</p>;
  if (block.kind === "h2")
    return (
      <h2
        id={block.id}
        className="mt-12 scroll-mt-20 font-display text-2xl font-bold text-slate-900 sm:text-3xl"
      >
        {block.text}
      </h2>
    );
  if (block.kind === "h3")
    return (
      <h3 id={block.id} className="mt-10 scroll-mt-20 font-display text-xl font-bold text-slate-900">
        {block.text}
      </h3>
    );
  if (block.kind === "h4")
    return (
      <h4 id={block.id} className="mt-8 scroll-mt-20 font-display text-lg font-semibold text-slate-900">
        {block.text}
      </h4>
    );
  if (block.kind === "image") {
    const img = (
      <img
        src={block.src}
        alt={block.alt}
        {...(block.width ? { width: block.width } : {})}
        {...(block.height ? { height: block.height } : {})}
        {...(block.title ? { title: block.title } : {})}
        className="h-auto w-full object-cover"
        loading="lazy"
        decoding="async"
      />
    );
    const wrapClass = "block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-600";
    return (
      <figure className="not-prose mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {block.href ? (
          isInternalHref(block.href) ? (
            <Link to={block.href} className={wrapClass}>{img}</Link>
          ) : (
            <a href={block.href} target="_blank" rel="noopener noreferrer" className={wrapClass}>{img}</a>
          )
        ) : (
          img
        )}
        {block.caption ? <figcaption className="border-t border-slate-100 px-4 py-3 text-sm text-slate-600">{renderRich(block.caption)}</figcaption> : null}
      </figure>
    );
  }
  if (block.kind === "links")
    return (
      <section className="not-prose mt-8 rounded-xl border border-slate-200 bg-slate-50 p-5">
        <h3 className="font-display text-lg font-bold text-slate-900">{block.title}</h3>
        <ul className="mt-3 list-none space-y-2 p-0 [&>li]:m-0 [&>li]:p-0">
          {block.items.map((item) => {
            const target = item.external ? undefined : postForHref(item.href);
            return (
              <li key={`${item.href}-${item.label}`} className="text-sm">
                {item.external ? (
                  <a href={item.href} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
                    {item.label} ↗
                  </a>
                ) : target ? (
                  <Link to={item.href} className="group flex items-center gap-3 p-1 no-underline hover:bg-white">
                    <img
                      src={target.featuredImage}
                      alt=""
                      width={96}
                      height={54}
                      loading="lazy"
                      decoding="async"
                      className="h-[54px] w-24 shrink-0 rounded-md border border-slate-200 object-cover"
                    />
                    <span className={`${LINK_CLASS} min-w-0`}>{item.label}</span>
                  </Link>
                ) : (
                  <Link to={item.href} className={LINK_CLASS}>
                    {item.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    );
  if (block.kind === "ul")
    return (
      <ul className="mt-5 space-y-2 pl-5 text-slate-700 [&>li]:list-disc [&>li]:leading-relaxed">
        {block.items.map((i, idx) => (
          <li key={idx}>{renderRich(i)}</li>
        ))}
      </ul>
    );
  if (block.kind === "ol")
    return (
      <ol className="mt-5 space-y-2 pl-5 text-slate-700 [&>li]:list-decimal [&>li]:leading-relaxed">
        {block.items.map((i, idx) => (
          <li key={idx}>{renderRich(i)}</li>
        ))}
      </ol>
    );
  if (block.kind === "quote")
    return (
      <blockquote className="mt-6 border-l-4 border-teal-600 bg-slate-50 p-5 italic text-slate-700">
        <p>{renderRich(block.text)}</p>
        {block.cite ? <footer className="mt-2 text-sm not-italic text-slate-500">{block.cite}</footer> : null}
      </blockquote>
    );
  if (block.kind === "cta") return <CtaCard block={block} />;
  if (block.kind === "scoreTable") return <ScoreTable block={block} />;
  if (block.kind === "table")
    return (
      <figure className="mt-8">
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="block w-full border-collapse text-left text-sm md:table md:min-w-[640px]">
            <caption className="block w-full border-b border-slate-200 bg-slate-50 px-5 py-4 text-left font-display text-base font-bold text-slate-900 md:table-caption">
              {block.caption}
            </caption>
            <thead className="sr-only md:not-sr-only md:table-header-group">
              <tr className="bg-slate-900 text-white md:table-row">
                {block.columns.map((column) => (
                  <th key={column} scope="col" className="px-5 py-3 font-semibold !text-white">{column}</th>
                ))}
              </tr>
            </thead>
            <tbody className="block md:table-row-group">
              {block.rows.map((row, rowIndex) => {
                const tone = block.tones ? appTone(row[0]) : null;
                const rowClass = tone
                  ? `block border-t border-slate-100 border-l-4 ${tone.borderL} px-5 py-4 align-top ${rowIndex % 2 === 0 ? tone.tint : tone.tintAlt} md:table-row md:border-l-0 md:p-0`
                  : "block border-t border-slate-100 px-5 py-4 align-top even:bg-slate-50/70 md:table-row md:p-0";
                return (
                  <tr key={`${row[0]}-${rowIndex}`} data-tone={tone?.key} className={rowClass}>
                    {row.map((cell, cellIndex) =>
                      cellIndex === 0 ? (
                        <th
                          key={cellIndex}
                          scope="row"
                          className={`block pb-2 text-left font-display text-base font-bold md:table-cell md:px-5 md:py-4 md:font-sans md:text-sm md:font-semibold ${
                            tone ? `${tone.text} md:border-l-4 ${tone.borderL}` : "text-slate-900"
                          }`}
                        >
                          {tone ? <span aria-hidden="true" className={`mr-2 inline-block h-2.5 w-2.5 rounded-full align-middle ${tone.dot}`} /> : null}
                          {renderRich(cell)}
                        </th>
                      ) : (
                        <td key={cellIndex} data-label={block.columns[cellIndex]} className="block py-1.5 leading-6 text-slate-700 before:block before:text-xs before:font-semibold before:uppercase before:tracking-wide before:text-slate-500 before:content-[attr(data-label)] md:table-cell md:px-5 md:py-4 md:before:hidden">{renderRich(cell)}</td>
                      ),
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </figure>
    );
  return (
    <aside className="mt-6 rounded-xl border border-teal-200 bg-teal-50 p-5">
      <h4 className="font-display font-bold text-teal-900">{block.title}</h4>
      <p className="mt-2 text-sm text-teal-900/80">{renderRich(block.text)}</p>
    </aside>
  );
}

type ResourceItem = { label: string; href: string; note?: string };

function ArticleResources({ items }: { items: ResourceItem[] }) {
  return (
    <section className="mt-14 border-t border-slate-200 pt-10" aria-labelledby="resources">
      <h2 id="resources" className="scroll-mt-24 font-display text-2xl font-bold text-slate-900 sm:text-3xl">Resources and sources</h2>
      <ul className="mt-6 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white px-5 sm:px-6">
        {items.map((item) => (
          <li key={`${item.href}-${item.label}`} className="py-4">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <InlineLink href={item.href}>{item.label}</InlineLink>
              <span className="text-xs text-slate-500">{hostnameOf(item.href)}</span>
            </div>
            {item.note ? <p className="mt-1 text-sm leading-6 text-slate-600">{item.note}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function ArticleFaq({ items }: { items: BlogFaqItem[] }) {
  return (
    <section id="frequently-asked-questions" className="mt-14 scroll-mt-24 border-t border-slate-200 pt-10" aria-labelledby="faq-heading">
      <h2 id="faq-heading" className="font-display text-2xl font-bold text-slate-900 sm:text-3xl">Frequently asked questions</h2>
      <div className="mt-6 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white px-5 sm:px-6">
        {items.map((item, index) => (
          <details key={item.question} className="group py-5" open={index === 0}>
            <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-semibold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 [&::-webkit-details-marker]:hidden">
              <span>{item.question}</span>
              <span className="text-xl leading-5 text-teal-700 transition group-open:rotate-45" aria-hidden="true">+</span>
            </summary>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">{renderRich(item.answer)}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  if (!slug) return <Navigate to="/blog" replace />;
  const post = getPostBySlug(slug);
  if (!post) return <Navigate to="/blog" replace />;

  const seo = getBlogPostSeo(slug);
  const related = BLOG_POSTS.filter((p) => p.slug !== slug)
    .map((candidate) => ({ candidate, score: candidate.tags.filter((tag) => post.tags.includes(tag)).length }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ candidate }) => candidate);
  const ogImage = post.featuredImage.startsWith("http") ? post.featuredImage : `${SITE_URL}${post.featuredImage}`;
  const hasInlineImage = post.body.some((b) => b.kind === "image");
  const hasLinksBlock = post.body.some((b) => b.kind === "links");
  const canonicalUrl = `${SITE_URL}/blog/${slug}`;
  const category = post.category ?? blogSection(post);
  const heroWidth = post.featuredImageWidth ?? 1600;
  const heroHeight = post.featuredImageHeight ?? 900;
  const resourceItems: ResourceItem[] = post.resources?.length ? post.resources : (post.citations ?? []);
  const tocItems: TocItem[] = [
    { id: "short-version", text: "Here’s the short version" },
    ...post.body
      .filter((block): block is Extract<BlogBlock, { kind: "h2" }> => block.kind === "h2")
      .map((block) => ({ id: block.id, text: block.text })),
    ...(post.faq?.length ? [{ id: "frequently-asked-questions", text: "Frequently asked questions" }] : []),
    ...(resourceItems.length ? [{ id: "resources", text: "Resources and sources" }] : []),
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {seo ? (
        <Seo
          title={seo.title}
          description={seo.description}
          path={`/blog/${slug}`}
          ogImage={ogImage}
          ogImageAlt={seo.ogImageAlt}
          ogImageWidth={seo.ogImageWidth}
          ogImageHeight={seo.ogImageHeight}
          ogType="article"
          article={seo.article}
          structuredData={seo.structuredData}
        />
      ) : null}

      <CommercialHeader ctaLabel="Start free" ctaHref="/signup" />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="min-w-0">
            <nav className="mb-5 flex min-w-0 items-center text-sm text-slate-500" aria-label="Breadcrumb">
              <Link to="/" className="shrink-0 hover:underline">Home</Link>
              <span className="mx-1.5 shrink-0">/</span>
              <Link to="/blog" className="shrink-0 hover:underline">Blog</Link>
              <span className="mx-1.5 shrink-0">/</span>
              <span className="truncate text-slate-700" aria-current="page">{category}</span>
            </nav>

            <h1 className="font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
              {post.title}
            </h1>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-slate-600" aria-label="Article details">
              <div className="flex items-center gap-2.5">
                <img src="/brand/logo.png" alt="" width={40} height={40} className="h-10 w-10 rounded-full border border-slate-200 bg-white object-contain p-1" />
                <span className="font-semibold text-slate-900">{post.author}</span>
              </div>
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
                <span>Published <time dateTime={post.datePublished}>{formatDate(post.datePublished)}</time></span>
              </span>
              {post.dateModified !== post.datePublished ? (
                <span className="inline-flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  <span>Updated <time dateTime={post.dateModified}>{formatDate(post.dateModified)}</time></span>
                </span>
              ) : null}
              <span className="inline-flex items-center gap-2">
                <Clock3 className="h-4 w-4" aria-hidden="true" />
                {post.readMinutes} min read
              </span>
            </div>

            <AiSummaryBar canonicalUrl={canonicalUrl} />
          </div>

          <div className="rounded-3xl bg-gradient-to-br from-teal-50 via-sky-50 to-slate-50 p-3 ring-1 ring-slate-200/70 sm:p-5">
            <img
              src={post.featuredImage}
              alt={post.featuredImageAlt ?? post.title}
              width={heroWidth}
              height={heroHeight}
              className="h-auto w-full rounded-2xl object-cover shadow-sm"
              loading="eager"
              decoding="async"
              {...{ fetchpriority: "high" }}
            />
          </div>
        </header>

        <details className="mx-auto mt-6 max-w-3xl rounded-xl border border-slate-200 bg-slate-50 p-4 lg:hidden">
          <summary className="cursor-pointer font-semibold text-slate-900">On this page</summary>
          <nav className="mt-4 border-t border-slate-200 pt-4" aria-label="Table of contents">
            <TocLinks items={tocItems} />
          </nav>
          <div className="mt-5 border-t border-slate-200 pt-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Share</p>
            <ShareLinks canonicalUrl={canonicalUrl} title={post.title} />
          </div>
        </details>

        <div className="mt-10 grid min-w-0 gap-10 lg:grid-cols-[220px_minmax(0,768px)] lg:justify-center lg:gap-14">
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <nav aria-label="Table of contents">
                <p className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">On this page</p>
                <TocLinks items={tocItems} />
              </nav>
              <div className="mt-8 border-t border-slate-200 pt-6">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Share</p>
                <ShareLinks canonicalUrl={canonicalUrl} title={post.title} />
              </div>
            </div>
          </aside>

          <div className="min-w-0">

            <QuickSummary summary={post.tldr} takeaways={post.keyTakeaways} />

            <article className="prose prose-slate mt-4 max-w-none text-base sm:text-[17px]">
          {post.body.map((block, i) => (
            <Block key={i} block={block} />
          ))}
          {!hasInlineImage ? (
            <figure className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <img
                src="/landing/hero-phone.png"
                alt="Receipt Cycle app showing receipt and expense tracking workflow"
                width={1376}
                height={768}
                className="h-auto w-full object-cover"
                loading="lazy"
                decoding="async"
              />
              <figcaption className="border-t border-slate-100 px-4 py-3 text-sm text-slate-600">
                A practical receipt-to-ledger workflow helps keep records clean all year.
              </figcaption>
            </figure>
          ) : null}
          {!hasLinksBlock ? (
            <section className="not-prose mt-8 rounded-xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="font-display text-lg font-bold text-slate-900">Related resources</h3>
              <ul className="mt-3 space-y-2">
                <li className="text-sm">
                  <Link to="/blog" className="font-medium text-teal-700 hover:underline">
                    Explore more Receipt Cycle articles
                  </Link>
                </li>
                <li className="text-sm">
                  <Link to="/blog/freelancers-guide-tracking-business-expenses" className="font-medium text-teal-700 hover:underline">
                    Freelancer expense tracking guide
                  </Link>
                </li>
                <li className="text-sm">
                  <a
                    href="https://www.irs.gov/businesses/small-businesses-self-employed/what-kind-of-records-should-i-keep"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-teal-700 hover:underline"
                  >
                    IRS recordkeeping overview ↗
                  </a>
                </li>
              </ul>
            </section>
          ) : null}
          {post.faq?.length ? <ArticleFaq items={post.faq} /> : null}
          {resourceItems.length ? <ArticleResources items={resourceItems} /> : null}
            </article>

        <div className="mt-10 flex flex-wrap gap-2">
          {post.tags.map((t) => (
            <span key={t} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
              #{t}
            </span>
          ))}
        </div>

        <section className="mt-16 rounded-2xl border border-slate-200 bg-gradient-to-br from-teal-50 to-white p-6 sm:p-8">
          <h2 className="font-display text-2xl font-bold text-slate-900">Try Receipt Cycle free</h2>
          <p className="mt-3 text-slate-600">
            Capture receipts, organize expenses, and review saved business activity in one workspace.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/signup"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-teal-700 px-6 text-sm font-semibold text-white shadow-sm hover:bg-teal-800"
            >
              Create free account
            </Link>
            <Link
              to="/pricing"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              See pricing
            </Link>
          </div>
        </section>

        {related.length > 0 ? (
          <section className="mt-16 border-t border-slate-200 pt-10">
            <h2 className="font-display text-2xl font-bold text-slate-900">Keep reading</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-3 grid-cols-1">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  to={`/blog/${r.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                >
                  <img
                    src={r.featuredImage}
                    alt={r.featuredImageAlt ?? r.title}
                    width={r.featuredImageWidth ?? 1600}
                    height={r.featuredImageHeight ?? 900}
                    loading="lazy"
                    decoding="async"
                    className="aspect-video w-full object-cover"
                  />
                  <div className="p-5">
                  <h3 className="font-display text-lg font-bold text-slate-900 group-hover:text-teal-700">
                    {r.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">{r.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
          </div>
        </div>
      </main>

      <CommercialFooter />
    </div>
  );
}
