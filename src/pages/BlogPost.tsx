import { Link, useParams, Navigate } from "react-router-dom";
import { ReceiptCycleLogo } from "@/components/brand/ReceiptCycleLogo";
import { Seo } from "@/components/Seo";
import { getBlogPostSeo } from "@/content/routesSeo";
import { getPostBySlug, BLOG_POSTS, type BlogBlock } from "@/content/blogPosts";
import { SITE_URL } from "@/lib/seo";
import type { ReactNode } from "react";

const primary = "#0f766e";

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

function renderInlineLinkedText(text: string): ReactNode[] {
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
    if (best.rule.external) {
      out.push(
        <a
          key={`inline-link-${key++}`}
          href={best.rule.href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-teal-700 hover:underline"
        >
          {originalPhrase}
        </a>,
      );
    } else {
      out.push(
        <Link key={`inline-link-${key++}`} to={best.rule.href} className="font-medium text-teal-700 hover:underline">
          {originalPhrase}
        </Link>,
      );
    }
    remaining = remaining.slice(best.idx + best.rule.phrase.length);
  }

  return out;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function Block({ block }: { block: BlogBlock }) {
  if (block.kind === "p") return <p className="mt-5 leading-relaxed text-slate-700">{renderInlineLinkedText(block.text)}</p>;
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
  if (block.kind === "image")
    return (
      <figure className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <img src={block.src} alt={block.alt} className="h-auto w-full object-cover" loading="lazy" />
        {block.caption ? <figcaption className="border-t border-slate-100 px-4 py-3 text-sm text-slate-600">{block.caption}</figcaption> : null}
      </figure>
    );
  if (block.kind === "links")
    return (
      <section className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-5">
        <h3 className="font-display text-lg font-bold text-slate-900">{block.title}</h3>
        <ul className="mt-3 space-y-2">
          {block.items.map((item) => (
            <li key={`${item.href}-${item.label}`} className="text-sm">
              {item.external ? (
                <a href={item.href} target="_blank" rel="noopener noreferrer" className="font-medium text-teal-700 hover:underline">
                  {item.label} ↗
                </a>
              ) : (
                <Link to={item.href} className="font-medium text-teal-700 hover:underline">
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </section>
    );
  if (block.kind === "ul")
    return (
      <ul className="mt-5 space-y-2 pl-5 text-slate-700 [&>li]:list-disc [&>li]:leading-relaxed">
        {block.items.map((i, idx) => (
          <li key={idx}>{i}</li>
        ))}
      </ul>
    );
  if (block.kind === "ol")
    return (
      <ol className="mt-5 space-y-2 pl-5 text-slate-700 [&>li]:list-decimal [&>li]:leading-relaxed">
        {block.items.map((i, idx) => (
          <li key={idx}>{i}</li>
        ))}
      </ol>
    );
  if (block.kind === "quote")
    return (
      <blockquote className="mt-6 border-l-4 border-teal-600 bg-slate-50 p-5 italic text-slate-700">
        <p>{block.text}</p>
        {block.cite ? <footer className="mt-2 text-sm not-italic text-slate-500">{block.cite}</footer> : null}
      </blockquote>
    );
  return (
    <aside className="mt-6 rounded-xl border border-teal-200 bg-teal-50 p-5">
      <h4 className="font-display font-bold text-teal-900">{block.title}</h4>
      <p className="mt-2 text-sm text-teal-900/80">{block.text}</p>
    </aside>
  );
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  if (!slug) return <Navigate to="/blog" replace />;
  const post = getPostBySlug(slug);
  if (!post) return <Navigate to="/blog" replace />;

  const seo = getBlogPostSeo(slug);
  const related = BLOG_POSTS.filter((p) => p.slug !== slug).slice(0, 2);
  const ogImage = post.featuredImage.startsWith("http") ? post.featuredImage : `${SITE_URL}${post.featuredImage}`;
  const hasInlineImage = post.body.some((b) => b.kind === "image");
  const hasLinksBlock = post.body.some((b) => b.kind === "links");

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {seo ? (
        <Seo
          title={seo.title}
          description={seo.description}
          path={`/blog/${slug}`}
          ogImage={ogImage}
          ogType="article"
          structuredData={seo.structuredData}
        />
      ) : null}

      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 sm:px-6">
          <ReceiptCycleLogo size={32} />
          <Link to="/blog" className="text-sm font-medium text-slate-600 hover:text-teal-700">
            ← Blog
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <nav className="mb-6 text-xs text-slate-500" aria-label="Breadcrumb">
          <Link to="/" className="hover:underline">Home</Link>
          <span className="mx-1.5">/</span>
          <Link to="/blog" className="hover:underline">Blog</Link>
          <span className="mx-1.5">/</span>
          <span className="text-slate-700">{post.title}</span>
        </nav>

        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <time dateTime={post.datePublished}>{formatDate(post.datePublished)}</time>
          <span>·</span>
          <span>{post.readMinutes} min read</span>
          <span>·</span>
          <span>{post.author}</span>
        </div>

        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {post.title}
        </h1>
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
          <img
            src={post.featuredImage}
            alt={post.title}
            className="h-auto w-full object-cover"
            loading="eager"
          />
        </div>

        <p className="mt-6 rounded-xl bg-slate-50 p-5 text-slate-700">
          <span className="mr-2 font-semibold uppercase tracking-wider text-teal-700">TL;DR</span>
          {post.tldr}
        </p>

        <article className="prose prose-slate mt-4 max-w-none">
          {post.body.map((block, i) => (
            <Block key={i} block={block} />
          ))}
          {!hasInlineImage ? (
            <figure className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <img
                src="/landing/hero-phone.png"
                alt="Receipt Cycle app showing receipt and expense tracking workflow"
                className="h-auto w-full object-cover"
                loading="lazy"
              />
              <figcaption className="border-t border-slate-100 px-4 py-3 text-sm text-slate-600">
                A practical receipt-to-ledger workflow helps keep records clean all year.
              </figcaption>
            </figure>
          ) : null}
          {!hasLinksBlock ? (
            <section className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-5">
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
            Scan receipts, import statements, chat with an AI finance coach — all in one app.
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
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  to={`/blog/${r.slug}`}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <h3 className="font-display text-lg font-bold text-slate-900 group-hover:text-teal-700">
                    {r.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">{r.description}</p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </main>

      <footer className="border-t border-slate-100 py-10">
        <div className="mx-auto max-w-3xl px-4 text-center text-sm text-slate-500 sm:px-6">
          <Link to="/" className="hover:underline" style={{ color: primary }}>Home</Link>
          <span className="mx-2">·</span>
          <Link to="/about" className="hover:underline" style={{ color: primary }}>About</Link>
          <span className="mx-2">·</span>
          <Link to="/blog" className="hover:underline" style={{ color: primary }}>Blog</Link>
          <span className="mx-2">·</span>
          <Link to="/faq" className="hover:underline" style={{ color: primary }}>FAQ</Link>
          <span className="mx-2">·</span>
          <Link to="/contact" className="hover:underline" style={{ color: primary }}>Contact</Link>
        </div>
      </footer>
    </div>
  );
}
