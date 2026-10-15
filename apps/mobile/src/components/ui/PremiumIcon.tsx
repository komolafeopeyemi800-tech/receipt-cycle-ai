import { memo, type ComponentProps } from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import {
  siAliexpress,
  siAdidas,
  siApple,
  siBurgerking,
  siDoordash,
  siEbay,
  siMastercard,
  siMcdonalds,
  siNike,
  siNetflix,
  siPaypal,
  siShopify,
  siStripe,
  siStarbucks,
  siTarget,
  siUber,
  siUbereats,
  siVisa,
} from "simple-icons";
import { defaultCategoryIcon } from "../../features/money/model";
import { colors } from "../../theme/tokens";

type IconName = ComponentProps<typeof Ionicons>["name"];
export type IconTone = "mint" | "blue" | "rose" | "amber" | "purple";
type BrandIcon = { title: string; hex: string; path: string };

const accents: Record<IconTone, string> = {
  mint: colors.primary,
  blue: colors.blue600,
  rose: colors.rose600,
  amber: colors.amber600,
  purple: colors.purple600,
};

export const PremiumIcon = memo(function PremiumIcon({
  icon,
  tone = "mint",
  size = 38,
  accent,
  shape = "rounded",
}: {
  icon: IconName;
  tone?: IconTone;
  size?: number;
  accent?: string;
  shape?: "rounded" | "circle";
}) {
  const highlight = accent ?? accents[tone];
  const glyph = filledIcon(icon);
  return (
    <View
      style={[
        styles.shell,
        {
          width: size,
          height: size,
          borderRadius: shape === "circle" ? size / 2 : Math.round(size * 0.27),
          backgroundColor: highlight,
        },
      ]}
    >
      <View
        style={[
          styles.illustrationShade,
          { width: size * 0.82, height: size * 0.58 },
        ]}
      />
      <Ionicons name={glyph} size={Math.round(size * 0.52)} color="#ffffff" />
      <View style={styles.highlightDot} />
    </View>
  );
});

const filledIcons: Partial<Record<IconName, IconName>> = {
  "home-outline": "home",
  "restaurant-outline": "restaurant",
  "car-outline": "car-sport",
  "bag-outline": "bag-handle",
  "receipt-outline": "receipt",
  "game-controller-outline": "game-controller",
  "heart-outline": "heart",
  "airplane-outline": "airplane",
  "school-outline": "school",
  "gift-outline": "gift",
  "business-outline": "business",
  "cash-outline": "cash",
  "card-outline": "card",
  "wallet-outline": "wallet",
  "document-outline": "document",
  "document-text-outline": "document-text",
  "calculator-outline": "calculator",
  "camera-outline": "camera",
  "scan-outline": "scan",
  "pie-chart-outline": "pie-chart",
  "people-outline": "people",
  "pricetags-outline": "pricetags",
  "bar-chart-outline": "bar-chart",
  "happy-outline": "happy",
  "flower-outline": "flower",
  "shirt-outline": "shirt",
  "phone-portrait-outline": "phone-portrait",
  "call-outline": "call",
  "shield-checkmark-outline": "shield-checkmark",
  "football-outline": "football",
  "cut-outline": "cut",
  "trophy-outline": "trophy",
  "hand-left-outline": "hand-left",
  "key-outline": "key",
  "pricetag-outline": "pricetag",
};

function filledIcon(icon: IconName): IconName {
  return filledIcons[icon] ?? icon;
}

const brandMatchers: { terms: string[]; icon: BrandIcon }[] = [
  { terms: ["paypal"], icon: siPaypal },
  { terms: ["aliexpress", "ali express"], icon: siAliexpress },
  { terms: ["burger king", "burgerking"], icon: siBurgerking },
  { terms: ["king burger"], icon: siBurgerking },
  { terms: ["mcdonald", "mc donald"], icon: siMcdonalds },
  { terms: ["starbucks"], icon: siStarbucks },
  { terms: ["apple", "app store", "itunes"], icon: siApple },
  { terms: ["nike"], icon: siNike },
  { terms: ["adidas"], icon: siAdidas },
  { terms: ["target"], icon: siTarget },
  { terms: ["ebay"], icon: siEbay },
  { terms: ["doordash", "door dash"], icon: siDoordash },
  { terms: ["uber eats", "ubereats"], icon: siUbereats },
  { terms: ["mastercard", "master card"], icon: siMastercard },
  { terms: ["visa"], icon: siVisa },
  { terms: ["netflix"], icon: siNetflix },
  { terms: ["uber"], icon: siUber },
  { terms: ["shopify"], icon: siShopify },
  { terms: ["stripe"], icon: siStripe },
];

function matchedBrand(value: string) {
  const normalized = value.toLocaleLowerCase();
  return brandMatchers.find(({ terms }) =>
    terms.some((term) => normalized.includes(term)),
  )?.icon;
}

function semanticIcon(
  merchant: string,
  category: string,
  type: string,
): IconName {
  const value = `${merchant} ${category}`.toLocaleLowerCase();
  if (value.includes("invoice")) return "document-text-outline";
  if (value.includes("estimate") || value.includes("quote"))
    return "calculator-outline";
  if (value.includes("tax")) return "receipt-outline";
  if (value.includes("refund")) return "return-down-back-outline";
  if (value.includes("transfer") || value.includes("send"))
    return "arrow-up-outline";
  if (value.includes("payment") || value.includes("paid"))
    return "card-outline";
  if (type === "income") return "arrow-down-outline";
  return defaultCategoryIcon(category);
}

export const TransactionGlyph = memo(function TransactionGlyph({
  merchant = "",
  category = "",
  type,
  size = 38,
}: {
  merchant?: string | null;
  category?: string | null;
  type: string;
  size?: number;
}) {
  const merchantName = merchant ?? "";
  const categoryName = category ?? "";
  const brand = matchedBrand(merchantName);
  if (!brand)
    return (
      <PremiumIcon
        icon={semanticIcon(merchantName, categoryName, type)}
        tone={type === "income" ? "mint" : "amber"}
        size={size}
      />
    );
  return (
    <View
      style={[
        styles.shell,
        styles.brandShell,
        { width: size, height: size, borderRadius: Math.round(size * 0.3) },
      ]}
      accessibilityLabel={`${brand.title} logo`}
    >
      <Svg
        width={Math.round(size * 0.58)}
        height={Math.round(size * 0.58)}
        viewBox="0 0 24 24"
      >
        <Path d={brand.path} fill={`#${brand.hex}`} />
      </Svg>
    </View>
  );
});

const styles = StyleSheet.create({
  shell: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.72)",
    overflow: "hidden",
  },
  brandShell: { backgroundColor: "#ffffff", borderColor: "#dfe9e8" },
  illustrationShade: {
    position: "absolute",
    backgroundColor: "rgba(8,47,45,0.2)",
    bottom: -8,
    right: -10,
    borderRadius: 12,
    transform: [{ rotate: "-28deg" }],
  },
  highlightDot: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: 2,
    right: 6,
    top: 6,
    backgroundColor: "rgba(255,255,255,0.76)",
  },
});
