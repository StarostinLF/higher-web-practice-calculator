import { calculateMetrics } from '../services/budget-calculator';

import {
  addTransaction as dbAddTransaction,
  clearAllTransactions,
  clearBudget,
  deleteTransaction as dbDeleteTransaction,
  getAllTransactions,
  getBudget,
  saveBudget,
} from './db';

import type { Budget, Transaction } from '../models/schemas';

export type Route = 'start' | 'main' | 'history' | 'edit';

export interface AppState {
  route: Route;
  budget: Budget | null;
  transactions: Transaction[];
  loaded: boolean;
}

type Listener = (state: AppState) => void;

const state: AppState = {
  route: 'start',
  budget: null,
  transactions: [],
  loaded: false,
};

const listeners = new Set<Listener>();

function emit(): void {
  for (const listener of listeners) {
    listener(state);
  }
}

export function getState(): AppState {
  return state;
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function loadInitial(): Promise<void> {
  const [budget, transactions] = await Promise.all([getBudget(), getAllTransactions()]);
  state.budget = budget ?? null;
  state.transactions = transactions;
  state.route = budget ? 'main' : 'start';
  state.loaded = true;
  emit();
}

export function navigate(route: Route): void {
  state.route = route;
  emit();
}

export async function setBudget(budget: Budget): Promise<void> {
  await saveBudget(budget);
  state.budget = budget;
  state.route = 'main';
  emit();
}

export async function resetBudget(): Promise<void> {
  await clearBudget();
  await clearAllTransactions();
  state.budget = null;
  state.transactions = [];
  state.route = 'start';
  emit();
}

export async function addTransaction(tx: Transaction): Promise<void> {
  if (tx.type === 'expense') {
    if (tx.amount <= 0) {
      throw new Error('Сумма траты должна быть больше 0');
    }
    if (state.budget) {
      const { totalBalance } = calculateMetrics(state.budget, state.transactions);
      if (tx.amount > totalBalance) {
        throw new Error('Сумма превышает остаток баланса');
      }
    }
  }
  await dbAddTransaction(tx);
  state.transactions = [tx, ...state.transactions].sort((a, b) => b.date.localeCompare(a.date));
  emit();
}

export async function removeTransaction(id: string): Promise<void> {
  await dbDeleteTransaction(id);
  state.transactions = state.transactions.filter(t => t.id !== id);
  emit();
}
