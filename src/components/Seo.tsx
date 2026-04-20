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
  useEffect(() => {
    applySeo(props);
  }, [
    props.title,
    props.description,
    props.path,
    props.ogImage,
    props.ogType,
    props.noindex,
    JSON.stringify(props.structuredData ?? []),
  ]);

  return null;
}
