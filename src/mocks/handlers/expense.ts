import type { Expense, ExpenseInput, ExpenseListParams, ExpenseSummary } from '@/features/expense/types';
import { paginate, parseSort, type Paginated } from '@/lib/list';
import { ApiError } from '@/services/core/api-call';

import { db, nextId } from '../db';
import { copy, delay } from '../delay';

export async function listExpenses(month: string): Promise<Expense[]> {
  await delay();
  const items = db.expenses
    .filter((e) => e.spent_at.startsWith(month))
    .sort((a, b) => b.spent_at.localeCompare(a.spent_at) || b.id - a.id);
  return copy(items);
}

const bySpentAt = (a: Expense, b: Expense) => a.spent_at.localeCompare(b.spent_at) || a.id - b.id;
/** Amounts in different currencies can't be compared, so amount sorting groups by currency first. */
const byAmount = (a: Expense, b: Expense) =>
  a.currency.localeCompare(b.currency) || a.amount - b.amount || bySpentAt(a, b);

/** GET /expenses?month=&page=&pageSize=&q=&sort=&category_id=&currency= */
export async function listExpensesPage(params: ExpenseListParams): Promise<Paginated<Expense>> {
  await delay();
  const query = params.search.trim().toLocaleLowerCase();
  const items = db.expenses.filter(
    (e) =>
      e.spent_at.startsWith(params.month) &&
      (params.categoryId === undefined || e.category_id === params.categoryId) &&
      (params.currency === undefined || e.currency === params.currency) &&
      (!query || e.note.toLocaleLowerCase().includes(query))
  );

  const sort = parseSort(params.sort) ?? { key: 'spent_at', dir: 'desc' };
  const fn = sort.key === 'amount' ? byAmount : bySpentAt;
  items.sort((a, b) => (sort.dir === 'desc' ? -fn(a, b) : fn(a, b)));

  return copy(paginate(items, params.page, params.pageSize));
}

export async function getSummary(month: string): Promise<ExpenseSummary> {
  await delay();
  const items = db.expenses.filter((e) => e.spent_at.startsWith(month));

  const totals = new Map<string, { currency: Expense['currency']; amount: number; count: number }>();
  const byCategory = new Map<string, { category_id: number; currency: Expense['currency']; amount: number }>();
  for (const e of items) {
    const t = totals.get(e.currency) ?? { currency: e.currency, amount: 0, count: 0 };
    t.amount += e.amount;
    t.count += 1;
    totals.set(e.currency, t);

    const key = `${e.category_id}:${e.currency}`;
    const c = byCategory.get(key) ?? { category_id: e.category_id, currency: e.currency, amount: 0 };
    c.amount += e.amount;
    byCategory.set(key, c);
  }

  return { month, totals: [...totals.values()], by_category: [...byCategory.values()] };
}

export async function createExpense(input: ExpenseInput): Promise<Expense> {
  await delay();
  const expense: Expense = { id: nextId(db.expenses), ...input, created_at: new Date().toISOString() };
  db.expenses.push(expense);
  return copy(expense);
}

export async function updateExpense(id: number, input: ExpenseInput): Promise<Expense> {
  await delay();
  const index = db.expenses.findIndex((e) => e.id === id);
  if (index === -1) throw new ApiError(404, 'not_found', 'Expense not found');
  db.expenses[index] = { ...db.expenses[index], ...input };
  return copy(db.expenses[index]);
}

export async function deleteExpense(id: number): Promise<void> {
  await delay();
  db.expenses = db.expenses.filter((e) => e.id !== id);
}
