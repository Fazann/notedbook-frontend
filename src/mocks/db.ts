import { isMocked } from '@/lib/env';

import { seedActivities, seedBoards, seedBudgets, seedCategories, seedExpenses, seedGoals } from './seed';

const today = new Date();

/** In-memory "database". It lives for the browser session and resets on reload. */
export const db = {
  categories: seedCategories(today),
  expenses: seedExpenses(today),
  // Compared with the mock expenses, so demo budgets only make sense while expenses are mocked too.
  budgets: isMocked('expense') ? seedBudgets() : [],
  goals: seedGoals(today),
  boards: seedBoards(today),
  activities: seedActivities(today),
};

export function nextId(items: { id: number }[]): number {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}
