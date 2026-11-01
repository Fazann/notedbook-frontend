import type { Budget, BudgetStatus } from './types';

const SEVERITY: Record<BudgetStatus, number> = { ok: 0, near: 1, over: 2 };

/** Budgets near or over their limit, the most urgent first. */
export function budgetAlerts(budgets: Budget[]): Budget[] {
  return budgets
    .filter((b) => b.status !== 'ok')
    .sort((a, b) => SEVERITY[b.status] - SEVERITY[a.status] || b.percent - a.percent);
}

/**
 * Budgets that just got worse because more was spent. A budget that is new, or that only moved because its limit
 * was edited, is left out: there is no spending to warn about.
 */
export function findNewAlerts(previous: Budget[], next: Budget[]): Budget[] {
  const before = new Map(previous.map((b) => [b.id, b]));
  return budgetAlerts(next).filter((b) => {
    const old = before.get(b.id);
    return old !== undefined && b.spent > old.spent && SEVERITY[b.status] > SEVERITY[old.status];
  });
}
