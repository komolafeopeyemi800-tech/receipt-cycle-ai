import { AppLayout } from "@/components/layout/AppLayout";
import { Plus, ShoppingBag, Utensils, Car, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const budgets = [
  { id: "1", name: "Shopping", icon: ShoppingBag, spent: 280, limit: 400, color: "bg-purple-500" },
  { id: "2", name: "Dining", icon: Utensils, spent: 120, limit: 200, color: "bg-orange-500" },
  { id: "3", name: "Transport", icon: Car, spent: 180, limit: 250, color: "bg-blue-500" },
  { id: "4", name: "Housing", icon: Home, spent: 850, limit: 900, color: "bg-emerald-500" },
];

const Budgets = () => {
  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold">Budgets</h1>
          <button className="btn-primary-gradient flex items-center gap-2 text-sm py-2 px-4">
            <Plus className="w-4 h-4" />
            Add Budget
          </button>
        </div>

        {/* Budget Cards */}
        <div className="space-y-3">
          {budgets.map((budget) => {
            const percentage = (budget.spent / budget.limit) * 100;
            const isOverBudget = percentage > 100;
            
            return (
              <div key={budget.id} className="card-elevated p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white", budget.color)}>
                    <budget.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{budget.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      ${budget.spent} of ${budget.limit}
                    </p>
                  </div>
                  <span className={cn(
                    "text-sm font-semibold",
                    isOverBudget ? "text-destructive" : "text-muted-foreground"
                  )}>
                    {percentage.toFixed(0)}%
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all",
                      isOverBudget ? "bg-destructive" : budget.color
                    )}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
};

export default Budgets;
