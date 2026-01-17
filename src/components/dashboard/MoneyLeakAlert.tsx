import { AlertTriangle, ChevronRight, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface MoneyLeak {
  id: string;
  title: string;
  amount: number;
  type: "subscription" | "fee" | "duplicate" | "spike";
}

interface MoneyLeakAlertProps {
  leaks: MoneyLeak[];
  currency?: string;
}

export function MoneyLeakAlert({ leaks, currency = "$" }: MoneyLeakAlertProps) {
  if (leaks.length === 0) return null;

  const totalLeaks = leaks.reduce((sum, leak) => sum + leak.amount, 0);

  return (
    <div className="card-elevated p-4 border-warning/30 bg-warning/5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center flex-shrink-0">
          <Zap className="w-5 h-5 text-warning" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-foreground">Money Leaks Detected</h3>
            <span className="text-sm font-bold text-warning">
              -{currency}{totalLeaks.toFixed(2)}/mo
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {leaks.length} potential savings found
          </p>
          <div className="mt-3 space-y-2">
            {leaks.slice(0, 2).map((leak) => (
              <button
                key={leak.id}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-card hover:bg-secondary transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <span className="text-sm font-medium truncate">{leak.title}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-muted-foreground">
                    -{currency}{leak.amount.toFixed(2)}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
          {leaks.length > 2 && (
            <button className="mt-2 text-sm text-primary font-medium hover:underline">
              View all {leaks.length} leaks
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
