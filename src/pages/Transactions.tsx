import { AppLayout } from "@/components/layout/AppLayout";
import { Search, Filter, ArrowUpDown } from "lucide-react";

const Transactions = () => {
  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold">Transactions</h1>
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              <Filter className="w-5 h-5" />
            </button>
            <button className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              <ArrowUpDown className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search transactions..."
            className="w-full h-12 pl-12 pr-4 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          />
        </div>

        {/* Placeholder content */}
        <div className="card-elevated p-8 text-center">
          <p className="text-muted-foreground">Transaction list will appear here</p>
          <p className="text-sm text-muted-foreground mt-1">Scan a receipt or upload a statement to get started</p>
        </div>
      </div>
    </AppLayout>
  );
};

export default Transactions;
