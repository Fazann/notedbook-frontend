import { describe, expect, it } from 'vitest';

import type { Expense, ExpenseSummary } from '@/features/expense/types';

import { categoryShares, dailyTotals, dayPeriod, percentChange, totalFor } from './utils';

const expense = (spent_at: string, amount: number, currency: Expense['currency']): Expense => ({
  id: 1,
  amount,
  currency,
  category_id: 1,
  note: '',
  spent_at,
  created_at: `${spent_at}T00:00:00Z`,
});

describe('dayPeriod', () => {
  it('maps hours to a greeting', () => {
    expect(dayPeriod(6)).toBe('morning');
    expect(dayPeriod(13)).toBe('afternoon');
    expect(dayPeriod(20)).toBe('evening');
    expect(dayPeriod(2)).toBe('evening');
  });
});

describe('percentChange', () => {
  it('returns whole percent change', () => {
    expect(percentChange(112, 100)).toBe(12);
    expect(percentChange(50, 100)).toBe(-50);
    expect(percentChange(100, 100)).toBe(0);
  });

  it('returns null without a previous value', () => {
    expect(percentChange(100, 0)).toBeNull();
  });
});

describe('dailyTotals', () => {
  it('sums one currency per day and fills every day of the month', () => {
    const rows = dailyTotals(
      [
        expense('2026-09-01', 225, 'USD'),
        expense('2026-09-01', 450, 'USD'),
        expense('2026-09-01', 8000, 'KHR'),
        expense('2026-09-30', 100, 'USD'),
        expense('2026-08-31', 999, 'USD'),
      ],
      '2026-09',
      'USD'
    );
    expect(rows).toHaveLength(30);
    expect(rows[0]).toEqual({ day: 1, amount: 675 });
    expect(rows[29]).toEqual({ day: 30, amount: 100 });
    expect(rows.reduce((s, r) => s + r.amount, 0)).toBe(775);
  });
});

describe('summary helpers', () => {
  const summary: ExpenseSummary = {
    month: '2026-09',
    totals: [{ currency: 'USD', amount: 1000, count: 3 }],
    by_category: [
      { category_id: 1, currency: 'USD', amount: 500 },
      { category_id: 2, currency: 'USD', amount: 200 },
      { category_id: 3, currency: 'USD', amount: 150 },
      { category_id: 4, currency: 'USD', amount: 100 },
      { category_id: 5, currency: 'USD', amount: 50 },
      { category_id: 1, currency: 'KHR', amount: 40000 },
    ],
  };

  it('reads totals per currency', () => {
    expect(totalFor(summary, 'USD')).toEqual({ amount: 1000, count: 3 });
    expect(totalFor(summary, 'KHR')).toEqual({ amount: 0, count: 0 });
  });

  it('keeps the top categories and groups the rest', () => {
    const shares = categoryShares(summary, 'USD', 3);
    expect(shares.map((s) => s.category_id)).toEqual([1, 2, 3, null]);
    expect(shares[3]).toEqual({ category_id: null, amount: 150, percent: 15 });
    expect(shares[0].percent).toBe(50);
  });

  it('never mixes currencies', () => {
    expect(categoryShares(summary, 'KHR')).toEqual([{ category_id: 1, amount: 40000, percent: 100 }]);
  });

  it('returns nothing for an empty month', () => {
    expect(categoryShares(undefined, 'USD')).toEqual([]);
  });
});
