import { ChevronRight, ShoppingBag, Coffee, Car, Utensils, Home, Zap, Heart, Briefcase, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const categoryIcons: Record<string, React.ElementType> = {
  shopping: ShoppingBag,
  food: Coffee,
  transport: Car,
  dining: Utensils,
  housing: Home,
  utilities: Zap,
  health: Heart,
  income: Briefcase,
  other: MoreHorizontal,
};

const categoryColors: Record<string, string> = {
  shopping: "bg-purple-500/10 text-purple-500",
  food: "bg-amber-500/10 text-amber-500",
  transport: "bg-blue-500/10 text-blue-500",
  dining: "bg-orange-500/10 text-orange-500",
  housing: "bg-emerald-500/10 text-emerald-500",
  utilities: "bg-yellow-500/10 text-yellow-500",
  health: "bg-rose-500/10 text-rose-500",
  income: "bg-success/10 text-success",
  other: "bg-muted text-muted-foreground",
};

interface Transaction {
  id: string;
  merchant: string;
  category: string;
  amount: number;
  date: string;
  type: "income" | "expense";
}

interface RecentTransactionsProps {
  transactions: Transaction[];
  currency?: string;
}

export function RecentTransactions({ transactions, currency = "$" }: RecentTransactionsProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="section-title">Recent Transactions</h3>
        <button className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
          View all <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="card-elevated divide-y divide-border">
        {transactions.map((tx) => {
          const Icon = categoryIcons[tx.category] || categoryIcons.other;
          const colorClass = categoryColors[tx.category] || categoryColors.other;

          return (
            <button
              key={tx.id}
              className="w-full flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors text-left"
            >
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", colorClass)}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{tx.merchant}</p>
                <p className="text-xs text-muted-foreground capitalize">{tx.category}</p>
              </div>
              <div className="text-right">
                <p className={cn(
                  "font-semibold",
                  tx.type === "income" ? "text-success" : "text-foreground"
                )}>
                  {tx.type === "income" ? "+" : "-"}{currency}{tx.amount.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">{formatDate(tx.date)}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
