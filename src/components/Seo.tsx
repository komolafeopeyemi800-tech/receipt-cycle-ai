import { useEffect } from "react";
import { applySeo, type SeoMeta } from "@/lib/seo";

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
