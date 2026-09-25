import { describe, expect, it } from 'vitest';

import { parseExpenseFilters } from './utils';

describe('parseExpenseFilters', () => {
  it('reads valid filters', () => {
    expect(parseExpenseFilters({ month: '2026-08', category: '3', currency: 'KHR' }, '2026-09')).toEqual({
      month: '2026-08',
      categoryId: 3,
      currency: 'KHR',
    });
  });

  it('falls back to the current month and "all" for missing or invalid values', () => {
    expect(parseExpenseFilters({ month: '', category: '', currency: '' }, '2026-09')).toEqual({
      month: '2026-09',
      categoryId: undefined,
      currency: undefined,
    });
    expect(parseExpenseFilters({ month: '2026-13', category: '-1', currency: 'EUR' }, '2026-09')).toEqual({
      month: '2026-09',
      categoryId: undefined,
      currency: undefined,
    });
    expect(parseExpenseFilters({ month: '2026-8', category: '1.5', currency: 'usd' }, '2026-09').month).toBe('2026-09');
  });
});
