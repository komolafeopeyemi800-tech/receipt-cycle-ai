import { useMemo } from "react";
import { useQuery } from "../../lib/api";
import { api } from "../../lib/api";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { useAuth } from "../../contexts/AuthContext";
import { roundMoney, ymToDateRange } from "../../utils/transactionMath";
import type { DocTx } from "../../types/transaction";
import type { AccountRow, BudgetRow, CategoryRow, MoneyKind } from "./model";

export function useMonthMoneyData(month: string) {
  const { workspace, ready } = useWorkspace();
  const { user } = useAuth();
  const range = useMemo(() => ymToDateRange(month), [month]);
  const categories = useQuery(api.categories.list, ready ? { workspace } : "skip") as CategoryRow[] | undefined;
  const budgets = useQuery(api.budgets.listForMonth, ready ? { workspace, month } : "skip") as BudgetRow[] | undefined;
  const transactions = useQuery(api.transactions.list, ready ? { workspace, userId: user?.id, startDate: range.start, endDate: range.end } : "skip") as DocTx[] | undefined;
  const amountByCategory = useMemo(() => {
    const result = { expense: new Map<string, number>(), income: new Map<string, number>() };
    for (const tx of transactions ?? []) {
      if (tx.type !== "expense" && tx.type !== "income") continue;
      const key = tx.type as MoneyKind;
      result[key].set(tx.category, roundMoney((result[key].get(tx.category) ?? 0) + Math.abs(tx.amount)));
    }
    return result;
  }, [transactions]);
  return { workspace, user, ready, range, categories: categories ?? [], budgets: budgets ?? [], transactions: transactions ?? [], amountByCategory, loading: !ready || categories === undefined || budgets === undefined || transactions === undefined };
}

export function useAccountsData() {
  const { workspace, ready } = useWorkspace();
  const accounts = useQuery(api.accounts.list, ready ? { workspace } : "skip") as AccountRow[] | undefined;
  return { workspace, ready, accounts: accounts ?? [], loading: !ready || accounts === undefined };
}
