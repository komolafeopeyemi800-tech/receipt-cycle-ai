import {
  siAliexpress,
  siBurgerking,
  siNetflix,
  siPaypal,
  siShopify,
  siStripe,
  siUber,
} from "simple-icons";
import { IconBox } from "./DesktopWorkspaceUI";

type BrandIcon = { title: string; hex: string; path: string };
const brands: { terms: string[]; icon: BrandIcon }[] = [
  { terms: ["paypal"], icon: siPaypal },
  { terms: ["aliexpress", "ali express"], icon: siAliexpress },
  { terms: ["burger king", "burgerking"], icon: siBurgerking },
  { terms: ["netflix"], icon: siNetflix },
  { terms: ["uber"], icon: siUber },
  { terms: ["shopify"], icon: siShopify },
  { terms: ["stripe"], icon: siStripe },
];

function semanticIcon(
  merchant: string,
  category: string,
  type: "expense" | "income",
) {
  const value = `${merchant} ${category}`.toLowerCase();
  if (value.includes("invoice")) return "fa-file-invoice";
  if (value.includes("estimate") || value.includes("quote"))
    return "fa-calculator";
  if (value.includes("tax")) return "fa-percent";
  if (value.includes("refund")) return "fa-rotate-left";
  if (value.includes("transfer") || value.includes("send"))
    return "fa-arrow-up";
  if (value.includes("food") || value.includes("restaurant"))
    return "fa-utensils";
  if (value.includes("transport") || value.includes("travel")) return "fa-car";
  if (value.includes("shopping")) return "fa-bag-shopping";
  return type === "income" ? "fa-arrow-down" : "fa-receipt";
}

export function MerchantIconBox({
  merchant = "",
  category = "",
  type,
  className,
}: {
  merchant?: string | null;
  category?: string | null;
  type: "expense" | "income";
  className?: string;
}) {
  const value = merchant.toLowerCase();
  const brand = brands.find(({ terms }) =>
    terms.some((term) => value.includes(term)),
  )?.icon;
  if (!brand)
    return (
      <IconBox
        icon={semanticIcon(merchant, category, type)}
        tone={type === "income" ? "teal" : "amber"}
        className={className}
      />
    );
  return (
    <div
      className={`relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${className ?? ""}`}
      title={brand.title}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-6 w-6"
        role="img"
        aria-label={`${brand.title} logo`}
      >
        <path d={brand.path} fill={`#${brand.hex}`} />
      </svg>
    </div>
  );
}
