import { AppLayout } from "@/components/layout/AppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { BalanceCard } from "@/components/dashboard/BalanceCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { MoneyLeakAlert } from "@/components/dashboard/MoneyLeakAlert";
import { SpendingChart } from "@/components/dashboard/SpendingChart";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";

// Sample data - will be replaced with real data from API
const sampleData = {
  balance: {
    totalBalance: 4250.75,
    income: 6500.00,
    expenses: 2249.25,
    savingsRate: 34.6,
  },
  moneyLeaks: [
    { id: "1", title: "Unused Netflix subscription", amount: 15.99, type: "subscription" as const },
    { id: "2", title: "Duplicate Spotify charges", amount: 9.99, type: "duplicate" as const },
    { id: "3", title: "Bank transfer fees", amount: 12.50, type: "fee" as const },
  ],
  spendingByCategory: [
    { name: "housing", value: 850, color: "#10b981" },
    { name: "food", value: 420, color: "#f59e0b" },
    { name: "transport", value: 280, color: "#3b82f6" },
    { name: "shopping", value: 350, color: "#8b5cf6" },
    { name: "utilities", value: 180, color: "#eab308" },
    { name: "dining", value: 169.25, color: "#f97316" },
  ],
  recentTransactions: [
    { id: "1", merchant: "Whole Foods Market", category: "food", amount: 87.43, date: "2024-01-17", type: "expense" as const },
    { id: "2", merchant: "Salary Deposit", category: "income", amount: 3250.00, date: "2024-01-15", type: "income" as const },
    { id: "3", merchant: "Shell Gas Station", category: "transport", amount: 52.80, date: "2024-01-15", type: "expense" as const },
    { id: "4", merchant: "Amazon", category: "shopping", amount: 129.99, date: "2024-01-14", type: "expense" as const },
    { id: "5", merchant: "Starbucks", category: "dining", amount: 6.75, date: "2024-01-14", type: "expense" as const },
  ],
};

const Index = () => {
  const totalSpent = sampleData.spendingByCategory.reduce((sum, cat) => sum + cat.value, 0);

  return (
    <AppLayout>
      <div className="space-y-6">
        <AppHeader userName="Alex" notificationCount={3} />
        
        <BalanceCard {...sampleData.balance} />
        
        <QuickActions />
        
        <MoneyLeakAlert leaks={sampleData.moneyLeaks} />
        
        <SpendingChart 
          data={sampleData.spendingByCategory} 
          totalSpent={totalSpent}
        />
        
        <RecentTransactions transactions={sampleData.recentTransactions} />
      </div>
    </AppLayout>
  );
};

export default Index;
