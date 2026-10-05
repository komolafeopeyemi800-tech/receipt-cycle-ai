import { Link } from "react-router-dom";
import { CommercialFooter, CommercialHeader } from "@/components/marketing/CommercialLandingLayout";
import { Seo } from "@/components/Seo";
import { getRouteSeo } from "@/content/routesSeo";
import { BLOG_POSTS } from "@/content/blogPosts";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default function Blog() {
  const seo = getRouteSeo("/blog");
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {seo ? (
        <Seo
          title={seo.title}
          description={seo.description}
          path="/blog"
          structuredData={seo.structuredData}
        />
      ) : null}

      <CommercialHeader ctaLabel="Start free" ctaHref="/signup" />

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="font-display text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
          Practical guides for cleaner business records
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
          Learn how to capture receipts, organize expenses, prepare for tax-time review, and spend less time reconstructing business activity.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {BLOG_POSTS.map((post) => (
            <article
              key={post.slug}
              className="group flex flex-col border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <Link
                to={`/blog/${post.slug}`}
                className="mb-4 block aspect-[16/9] w-full overflow-hidden bg-slate-100"
              >
                <img
                  src={post.featuredImage}
                  alt={post.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                />
              </Link>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <time dateTime={post.datePublished}>{formatDate(post.datePublished)}</time>
                <span>·</span>
                <span>{post.readMinutes} min read</span>
              </div>
              <h2 className="mt-3 font-display text-xl font-bold text-slate-900 group-hover:text-teal-700">
                <Link to={`/blog/${post.slug}`}>{post.title}</Link>
              </h2>
              <p className="mt-3 text-sm text-slate-600">{post.description}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {post.tags.slice(0, 3).map((t) => (
                  <span key={t} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {t}
                  </span>
                ))}
              </div>
              <Link
                to={`/blog/${post.slug}`}
                className="mt-6 inline-flex items-center text-sm font-semibold text-teal-700 hover:underline"
              >
                Read article →
              </Link>
            </article>
          ))}
        </div>

        <section className="mt-16 rounded-2xl border border-slate-200 bg-gradient-to-br from-teal-50 to-white p-6 sm:p-8">
          <h2 className="font-display text-2xl font-bold text-slate-900">Start scanning today</h2>
          <p className="mt-3 text-slate-600">
            Free plan, no credit card. Scan receipts, import statements, and see where your money actually goes.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/signup"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-teal-700 px-6 text-sm font-semibold text-white shadow-sm hover:bg-teal-800"
            >
              Create free account
            </Link>
            <Link
              to="/about"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              About Receipt Cycle
            </Link>
          </div>
        </section>
      </main>

      <CommercialFooter />
    </div>
  );
}
