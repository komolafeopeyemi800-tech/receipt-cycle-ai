import ReceiptCyclePaywall from "@/components/pricing/ReceiptCyclePaywall";
import { CommercialFooter, CommercialHeader } from "@/components/marketing/CommercialLandingLayout";
import { SeoForPath } from "@/components/Seo";

/** Plans: Free (in-app trial), $3.50/mo, $35/yr with 7-day trial — Polar checkout for paid tiers. */
const Pricing = () => <div className="min-h-screen bg-slate-50"><SeoForPath path="/pricing" /><CommercialHeader ctaLabel="Start free" ctaHref="/signup" /><ReceiptCyclePaywall /><CommercialFooter /></div>;

export default Pricing;
