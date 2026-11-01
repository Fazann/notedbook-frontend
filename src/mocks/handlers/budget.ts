import type { Budget, BudgetInput, BudgetStatus } from '@/features/budget/types';
import { ApiError } from '@/services/core/api-call';

import { db, nextId } from '../db';
import { copy, delay } from '../delay';
import type { StoredBudget } from '../seed';

/** Same rule as `budgetStatus` in the Go API. */
function statusOf(spent: number, { amount, alert_percent }: StoredBudget): BudgetStatus {
  if (spent > amount) return 'over';
  return spent * 100 >= amount * alert_percent ? 'near' : 'ok';
}

function withSpending(budget: StoredBudget, month: string): Budget {
  const spent = db.expenses
    .filter((e) => e.currency === budget.currency && e.spent_at.startsWith(month))
    .reduce((sum, e) => sum + e.amount, 0);
  return { ...budget, spent, percent: Math.floor((spent * 100) / budget.amount), status: statusOf(spent, budget) };
}

function checkCurrencyFree(input: BudgetInput, id?: number) {
  if (db.budgets.some((b) => b.currency === input.currency && b.id !== id)) {
    throw new ApiError(409, 'BUDGET_EXISTS', 'You already have a budget in this currency.');
  }
}

/** GET /budgets?month= */
export async function listBudgets(month: string): Promise<Budget[]> {
  await delay();
  return copy(db.budgets.map((b) => withSpending(b, month)));
}

/** POST /budgets */
export async function createBudget(input: BudgetInput): Promise<void> {
  await delay();
  checkCurrencyFree(input);
  const now = new Date().toISOString();
  db.budgets.push({ id: nextId(db.budgets), ...input, created_at: now, updated_at: now });
}

/** PUT /budgets/:id */
export async function updateBudget(id: number, input: BudgetInput): Promise<void> {
  await delay();
  const index = db.budgets.findIndex((b) => b.id === id);
  if (index === -1) throw new ApiError(404, 'RECORD_NOT_FOUND', 'Budget not found');
  checkCurrencyFree(input, id);
  db.budgets[index] = { ...db.budgets[index], ...input, updated_at: new Date().toISOString() };
}

/** DELETE /budgets/:id */
export async function deleteBudget(id: number): Promise<void> {
  await delay();
  db.budgets = db.budgets.filter((b) => b.id !== id);
}
