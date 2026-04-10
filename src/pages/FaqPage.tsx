import { Link } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ReceiptCycleLogo } from "@/components/brand/ReceiptCycleLogo";
import { SITE_FAQ_ITEMS } from "@/content/siteFaq";

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 sm:px-6">
          <ReceiptCycleLogo size={32} />
          <Link to="/" className="text-sm font-medium text-slate-600 hover:text-teal-700">
            ← Home
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">FAQ</h1>
        <p className="mt-3 text-slate-600">Quick answers about Receipt Cycle. For legal topics, see our policies linked in the footer.</p>
        <Accordion type="single" collapsible className="mt-10 w-full">
          {SITE_FAQ_ITEMS.map((item, i) => (
            <AccordionItem key={item.q} value={`faq-${i}`}>
              <AccordionTrigger className="text-left font-semibold">{item.q}</AccordionTrigger>
              <AccordionContent className="text-slate-600">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <p className="mt-10 text-center text-sm text-slate-600">
          More questions?{" "}
          <Link to="/contact" className="font-semibold text-teal-700 hover:underline">
            Contact us
          </Link>
        </p>
      </div>
    </div>
  );
}
