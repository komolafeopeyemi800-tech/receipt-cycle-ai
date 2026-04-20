import { Link, useParams, Navigate } from "react-router-dom";
import { ReceiptCycleLogo } from "@/components/brand/ReceiptCycleLogo";
import { Seo } from "@/components/Seo";
import { getBlogPostSeo } from "@/content/routesSeo";
import { getPostBySlug, BLOG_POSTS, type BlogBlock } from "@/content/blogPosts";
import { SITE_URL } from "@/lib/seo";

const primary = "#0f766e";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function Block({ block }: { block: BlogBlock }) {
  if (block.kind === "p") return <p className="mt-5 leading-relaxed text-slate-700">{block.text}</p>;
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
