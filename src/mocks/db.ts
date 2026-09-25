import { seedActivities, seedBoards, seedCategories, seedExpenses, seedGoals } from './seed';

const today = new Date();

/** In-memory "database". It lives for the browser session and resets on reload. */
export const db = {
  categories: seedCategories(today),
  expenses: seedExpenses(today),
  goals: seedGoals(today),
  boards: seedBoards(today),
  activities: seedActivities(today),
};

export function nextId(items: { id: number }[]): number {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}
