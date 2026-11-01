import { describe, expect, it } from 'vitest';

import type { Budget } from './types';
import { budgetAlerts, findNewAlerts } from './utils';

const budget = (over: Partial<Budget>): Budget => ({
  id: 1,
  amount: 20000,
  currency: 'USD',
  alert_percent: 80,
  spent: 0,
  percent: 0,
  status: 'ok',
  created_at: '',
  updated_at: '',
  ...over,
});

describe('budgetAlerts', () => {
  it('keeps budgets near or over the limit, the most urgent first', () => {
    const near = budget({ id: 1, status: 'near', percent: 95 });
    const nearer = budget({ id: 2, status: 'near', percent: 99 });
    const over = budget({ id: 3, status: 'over', percent: 120 });
    const fine = budget({ id: 4, status: 'ok', percent: 10 });
    expect(budgetAlerts([near, fine, nearer, over]).map((b) => b.id)).toEqual([3, 2, 1]);
  });
});

describe('findNewAlerts', () => {
  const ok = budget({ spent: 10000, percent: 50 });
  const near = budget({ spent: 17000, percent: 85, status: 'near' });
  const over = budget({ spent: 21000, percent: 105, status: 'over' });

  it('reports a budget when spending pushes it near or over the limit', () => {
    expect(findNewAlerts([ok], [near])).toEqual([near]);
    expect(findNewAlerts([near], [over])).toEqual([over]);
    expect(findNewAlerts([ok], [over])).toEqual([over]);
  });

  it('stays quiet when nothing got worse', () => {
    expect(findNewAlerts([near], [near])).toEqual([]);
    expect(findNewAlerts([near], [budget({ spent: 18000, percent: 90, status: 'near' })])).toEqual([]);
    expect(findNewAlerts([over], [near])).toEqual([]);
  });

  it('ignores a new budget', () => {
    expect(findNewAlerts([], [near])).toEqual([]);
  });

  it('ignores a limit that was lowered with no new spending', () => {
    expect(findNewAlerts([ok], [budget({ amount: 11000, spent: 10000, percent: 90, status: 'near' })])).toEqual([]);
  });
});
