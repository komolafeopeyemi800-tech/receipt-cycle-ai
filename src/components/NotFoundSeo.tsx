import { useLocation } from "react-router-dom";
import { Seo } from "./Seo";

export default function NotFoundSeo() {
  const { pathname } = useLocation();
  return <Seo title="Page not found | Receipt Cycle" description="This page could not be found. Go to the Receipt Cycle home page." path={pathname} noindex canonical={false} />;
}
