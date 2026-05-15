import { differenceInCalendarDays, parseISO, startOfDay } from 'date-fns';

import type { Budget, Transaction } from '../models/schemas';

export interface BudgetMetrics {
  totalBalance: number;
  daysRemaining: number;
  dailyBudget: number;
  todaySpent: number;
  todayRemaining: number;
  averageDailySpending: number;
  totalSpent: number;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function sumExpenses(transactions: Transaction[]): number {
  return transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
}

function sumTopups(transactions: Transaction[]): number {
  return transactions.filter(t => t.type === 'topup').reduce((acc, t) => acc + t.amount, 0);
}

function sumExpensesOnDate(transactions: Transaction[], dateISO: string): number {
  return transactions
    .filter(t => t.type === 'expense' && t.date.slice(0, 10) === dateISO)
    .reduce((acc, t) => acc + t.amount, 0);
}

function countSpendingDays(transactions: Transaction[]): number {
  const dates = new Set<string>();
  for (const t of transactions) {
    if (t.type === 'expense') {
      dates.add(t.date.slice(0, 10));
    }
  }
  return dates.size;
}

export function calculateMetrics(budget: Budget, transactions: Transaction[]): BudgetMetrics {
  const today = startOfDay(new Date());
  const end = startOfDay(parseISO(budget.endDate));

  const daysRemainingRaw = differenceInCalendarDays(end, today) + 1;
  const daysRemaining = Math.max(daysRemainingRaw, 0);

  const totalSpent = sumExpenses(transactions);
  const totalTopups = sumTopups(transactions);
  const totalBalance = Math.max(budget.startBalance + totalTopups - totalSpent, 0);

  const todayKey = todayISO();
  const todaySpent = sumExpensesOnDate(transactions, todayKey);

  const dailyBudget =
    daysRemaining > 0 ? Math.floor((totalBalance + todaySpent) / daysRemaining) : 0;

  const todayRemaining = Math.max(dailyBudget - todaySpent, 0);

  const spendingDays = countSpendingDays(transactions);
  const averageDailySpending = spendingDays > 0 ? Math.round(totalSpent / spendingDays) : 0;

  return {
    totalBalance,
    daysRemaining,
    dailyBudget,
    todaySpent,
    todayRemaining,
    averageDailySpending,
    totalSpent,
  };
}
