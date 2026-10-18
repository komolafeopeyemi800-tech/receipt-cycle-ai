import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { applySeo, type SeoMeta } from "@/lib/seo";
import { getRouteSeo } from "@/content/routesSeo";

/**
 * Client-side SEO wrapper. Drop near the top of each page component:
 *   <Seo title="..." description="..." path="/about" structuredData={[...]} />
 *
 * Prerendered HTML (from scripts/prerender.mjs) already has the right tags
 * for initial page load + crawlers; this keeps SPA navigation in sync too.
 */
export function Seo(props: SeoMeta): null {
  const serialized = JSON.stringify(props);

  useEffect(() => {
    applySeo(JSON.parse(serialized) as SeoMeta);
  }, [serialized]);

  return null;
}

/** Applies the SEO data registered for `path` in src/content/routesSeo.ts (title, meta, JSON-LD, noindex). */
export function SeoForPath({ path }: { path: string }): JSX.Element | null {
  const seo = getRouteSeo(path);
  if (!seo) return null;
  return (
    <Seo
      title={seo.title}
      description={seo.description}
      path={seo.path}
      ogImage={seo.ogImage}
      ogImageAlt={seo.ogImageAlt}
      ogType={seo.ogType}
      structuredData={seo.structuredData}
      noindex={seo.noindex}
    />
  );
}

/** Signed-in app and auth screens: keep them out of search results and carry no structured data. */
export function PrivateRouteSeo(): JSX.Element | null {
  const { pathname } = useLocation();
  // /pricing lives in the app shell but is a public, indexable page that sets its own SEO.
  if (pathname === "/pricing") return null;
  return (
    <Seo
      title="Receipt Cycle app"
      description="Sign in to Receipt Cycle to manage receipts, expenses, estimates, invoices, payments, budgets, and reports."
      path={pathname}
      noindex
    />
  );
}
