import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Expense } from '@/features/expense/types';

import { db } from '../db';

import { createBudget, deleteBudget, listBudgets, updateBudget } from './budget';

vi.mock('../delay', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../delay')>()),
  delay: () => Promise.resolve(),
}));

const expense = (amount: number, currency: Expense['currency'], spent_at: string, id: number): Expense => ({
  id,
  amount,
  currency,
  category_id: 1,
  note: '',
  spent_at,
  created_at: '',
});

describe('budgets (mock)', () => {
  beforeEach(() => {
    db.budgets = [{ id: 1, amount: 20000, currency: 'USD', alert_percent: 80, created_at: '', updated_at: '' }];
    db.expenses = [];
  });

  it.each([
    [15999, 'ok', 79],
    [16000, 'near', 80],
    [20000, 'near', 100],
    [20001, 'over', 100],
  ])('spending %i of 20000 at 80%% is %s', async (spent, status, percent) => {
    db.expenses = [expense(spent, 'USD', '2026-11-05', 1)];
    expect(await listBudgets('2026-11')).toMatchObject([{ spent, status, percent }]);
  });

  it('totals only that month and currency', async () => {
    db.expenses = [
      expense(1000, 'USD', '2026-11-01', 1),
      expense(2000, 'USD', '2026-11-30', 2),
      expense(9000, 'USD', '2026-10-31', 3),
      expense(40000, 'KHR', '2026-11-05', 4),
    ];
    expect(await listBudgets('2026-11')).toMatchObject([{ spent: 3000 }]);
  });

  it('allows one budget per currency', async () => {
    const input = { amount: 100, currency: 'USD', alert_percent: 80 } as const;
    await expect(createBudget(input)).rejects.toMatchObject({ code: 'BUDGET_EXISTS' });
    await createBudget({ ...input, currency: 'KHR' });
    await expect(updateBudget(2, input)).rejects.toMatchObject({ code: 'BUDGET_EXISTS' });
    await expect(updateBudget(1, { ...input, amount: 500 })).resolves.toBeUndefined();
  });

  it('deletes a budget', async () => {
    await deleteBudget(1);
    expect(await listBudgets('2026-11')).toEqual([]);
  });
});
