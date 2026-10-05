import type { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme/tokens";

export type MoneyIcon = ComponentProps<typeof Ionicons>["name"];
export type MoneyKind = "expense" | "income";
export type CategoryRow = { id: string; name: string; kind: MoneyKind; color: string };
export type AccountRow = { id: string; name: string; balance: number; iconKey: string };
export type BudgetRow = { id: string; category: string; month: string; limitAmount: number };

export const appearanceColors = [colors.primary, "#3999e8", "#9468e8", "#f0628b", "#fa8947", "#f2be2c", "#9aaabc"] as const;

export const accountTypes: { key: string; label: string; icon: MoneyIcon; tone: string }[] = [
  { key: "money-bill-wave", label: "Cash", icon: "cash-outline", tone: colors.mintSoft },
  { key: "credit-card", label: "Card", icon: "card-outline", tone: colors.blueSoft },
  { key: "bank", label: "Bank", icon: "business-outline", tone: colors.blueSoft },
  { key: "piggy-bank", label: "Savings", icon: "wallet-outline", tone: colors.blueSoft },
  { key: "transfer", label: "Transfer", icon: "swap-horizontal-outline", tone: colors.blueSoft },
  { key: "wallet", label: "Other", icon: "ellipsis-horizontal", tone: colors.blueSoft },
];

export const categoryIcons: { key: MoneyIcon; label: string }[] = [
  { key: "home-outline", label: "Home" }, { key: "restaurant-outline", label: "Food" },
  { key: "car-outline", label: "Transport" }, { key: "bag-outline", label: "Shopping" },
  { key: "receipt-outline", label: "Bills" }, { key: "game-controller-outline", label: "Fun" },
  { key: "heart-outline", label: "Health" }, { key: "airplane-outline", label: "Travel" },
  { key: "school-outline", label: "Education" }, { key: "gift-outline", label: "Gifts" },
  { key: "business-outline", label: "Business" }, { key: "ellipsis-horizontal", label: "Other" },
];

export function accountType(iconKey: string) {
  return accountTypes.find((item) => item.key === iconKey) ?? accountTypes[5]!;
}

export function defaultCategoryIcon(name: string): MoneyIcon {
  const value = name.toLowerCase();
  if (value.includes("food") || value.includes("din") || value.includes("restaurant")) return "restaurant-outline";
  if (value.includes("shop")) return "bag-outline";
  if (value.includes("transport") || value.includes("car")) return "car-outline";
  if (value.includes("bill") || value.includes("utilit")) return "receipt-outline";
  if (value.includes("entertain") || value.includes("game")) return "game-controller-outline";
  if (value.includes("health")) return "heart-outline";
  if (value.includes("travel")) return "airplane-outline";
  if (value.includes("educat")) return "school-outline";
  if (value.includes("home")) return "home-outline";
  if (value.includes("gift")) return "gift-outline";
  if (value.includes("salary") || value.includes("income")) return "cash-outline";
  if (value.includes("business")) return "business-outline";
  return "pricetag-outline";
}
