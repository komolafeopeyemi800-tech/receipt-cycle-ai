import { AppLayout } from "@/components/layout/AppLayout";
import { TrendingUp, Lightbulb, Target } from "lucide-react";

const Insights = () => {
  return (
    <AppLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-display font-bold">Insights</h1>

        {/* AI Summary Card */}
        <div className="card-glass p-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-semibold">AI Summary</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Your AI-powered financial insights will appear here. Upload transactions to get personalized recommendations.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="stat-card">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-success" />
              <span className="text-xs text-muted-foreground">Savings Trend</span>
            </div>
            <p className="text-2xl font-bold">+12%</p>
            <p className="text-xs text-muted-foreground">vs last month</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Budget Progress</span>
            </div>
            <p className="text-2xl font-bold">68%</p>
            <p className="text-xs text-muted-foreground">of monthly limit</p>
          </div>
        </div>

        {/* Chart Placeholder */}
        <div className="card-elevated p-6 text-center min-h-[200px] flex items-center justify-center">
          <p className="text-muted-foreground">Spending trends chart will appear here</p>
        </div>
      </div>
    </AppLayout>
  );
};

export default Insights;
