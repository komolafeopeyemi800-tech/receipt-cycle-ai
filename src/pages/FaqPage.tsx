import { Link } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CommercialFooter, CommercialHeader } from "@/components/marketing/CommercialLandingLayout";
import { SITE_FAQ_ITEMS } from "@/content/siteFaq";
import { Seo } from "@/components/Seo";
import { getRouteSeo } from "@/content/routesSeo";

export default function FaqPage() {
  const seo = getRouteSeo("/faq");
  return (
    <div className="min-h-screen bg-white">
      {seo ? (
        <Seo
          title={seo.title}
          description={seo.description}
          path="/faq"
          structuredData={seo.structuredData}
        />
      ) : null}
      <CommercialHeader ctaLabel="Start free" ctaHref="/signup" />
      <main className="bg-slate-50 py-14 sm:py-20"><div className="mx-auto max-w-4xl px-5 sm:px-8">
        <div className="max-w-2xl"><h1 className="font-display text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">Questions before you get started</h1>
        <p className="mt-5 text-lg leading-8 text-slate-600">Find straightforward answers about accounts, receipt capture, billing records, AI-assisted features, and your data.</p></div>
        <Accordion type="single" collapsible className="mt-12 w-full space-y-3">
          {SITE_FAQ_ITEMS.map((item, i) => (
            <AccordionItem key={item.q} value={`faq-${i}`} className="border border-slate-200 bg-white px-5 shadow-sm">
              <AccordionTrigger className="text-left font-bold hover:no-underline">{item.q}</AccordionTrigger>
              <AccordionContent className="leading-7 text-slate-600">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <p className="mt-10 text-center text-sm text-slate-600">
          More questions?{" "}
          <Link to="/contact" className="font-semibold text-teal-700 hover:underline">
            Contact us
          </Link>
        </p>
      </div></main><CommercialFooter />
    </div>
  );
}
