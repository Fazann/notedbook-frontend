import { getDaysInMonth } from 'date-fns';

import type { Expense, ExpenseSummary } from '@/features/expense/types';
import { parseDate } from '@/lib/dates';
import type { Currency } from '@/lib/money';

export type DayPeriod = 'morning' | 'afternoon' | 'evening';

export function dayPeriod(hour: number): DayPeriod {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  return 'evening';
}

/** Whole-percent change from `previous` to `current`; `null` when there is nothing to compare with. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) * 100) / previous);
}

export function totalFor(summary: ExpenseSummary | undefined, currency: Currency): { amount: number; count: number } {
  const row = summary?.totals.find((t) => t.currency === currency);
  return { amount: row?.amount ?? 0, count: row?.count ?? 0 };
}

/** One bar per day of the month (1…N) with the total spent in one currency, in minor units. */
export function dailyTotals(expenses: Expense[], month: string, currency: Currency): { day: number; amount: number }[] {
  const days = getDaysInMonth(parseDate(`${month}-01`));
  const totals = Array.from({ length: days }, (_, i) => ({ day: i + 1, amount: 0 }));
  for (const e of expenses) {
    if (e.currency !== currency || !e.spent_at.startsWith(month)) continue;
    totals[Number(e.spent_at.slice(8, 10)) - 1].amount += e.amount;
  }
  return totals;
}

export type CategoryShare = { category_id: number | null; amount: number; percent: number };

/**
 * Spending per category in one currency, largest first. Keeps the top `limit` categories and groups the
 * rest into one "others" row (`category_id: null`), so a chart needs at most `limit + 1` colors.
 */
export function categoryShares(summary: ExpenseSummary | undefined, currency: Currency, limit = 4): CategoryShare[] {
  const rows = (summary?.by_category ?? [])
    .filter((r) => r.currency === currency && r.amount > 0)
    .sort((a, b) => b.amount - a.amount);
  const total = rows.reduce((sum, r) => sum + r.amount, 0);
  if (total === 0) return [];

  const toShare = (category_id: number | null, amount: number) => ({
    category_id,
    amount,
    percent: Math.round((amount * 100) / total),
  });
  const top = rows.slice(0, limit).map((r) => toShare(r.category_id, r.amount));
  const rest = rows.slice(limit).reduce((sum, r) => sum + r.amount, 0);
  return rest > 0 ? [...top, toShare(null, rest)] : top;
}
