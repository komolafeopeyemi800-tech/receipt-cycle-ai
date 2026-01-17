import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface BalanceCardProps {
  totalBalance: number;
  income: number;
  expenses: number;
  savingsRate: number;
  currency?: string;
}

export function BalanceCard({ 
  totalBalance, 
  income, 
  expenses, 
  savingsRate,
  currency = "$" 
}: BalanceCardProps) {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(amount));
  };

  return (
    <div className="card-glass p-6 space-y-5">
      {/* Main Balance */}
      <div className="text-center space-y-1">
        <p className="text-sm text-muted-foreground font-medium">Net Balance</p>
        <h2 className={cn(
          "text-4xl font-display font-bold tracking-tight",
          totalBalance >= 0 ? "text-foreground" : "text-expense"
        )}>
          {totalBalance < 0 && "-"}{currency}{formatAmount(totalBalance)}
        </h2>
        <div className="flex items-center justify-center gap-1.5 text-sm">
          {savingsRate >= 0 ? (
            <>
              <TrendingUp className="w-4 h-4 text-success" />
              <span className="text-success font-medium">{savingsRate}% saved</span>
            </>
          ) : (
            <>
              <TrendingDown className="w-4 h-4 text-expense" />
              <span className="text-expense font-medium">{Math.abs(savingsRate)}% overspent</span>
            </>
          )}
          <span className="text-muted-foreground">this month</span>
        </div>
      </div>

      {/* Income & Expenses */}
      <div className="grid grid-cols-2 gap-3">
        <div className="stat-card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
            <ArrowDownRight className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Income</p>
            <p className="text-lg font-semibold text-success">
              +{currency}{formatAmount(income)}
            </p>
          </div>
        </div>

        <div className="stat-card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Expenses</p>
            <p className="text-lg font-semibold text-destructive">
              -{currency}{formatAmount(expenses)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
