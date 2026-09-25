import { describe, expect, it } from 'vitest';

import { getCategoryName, parseExpenseFilters } from './utils';

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

describe('getCategoryName', () => {
  const t = Object.assign((key: string) => (key === 'category.defaults.food' ? 'អាហារ' : key), {
    has: (key: string) => key === 'category.defaults.food',
  });
  const gym = { key: null, name: 'Gym', nameKm: 'ហាត់ប្រាណ' };

  it('shows the Khmer name in the Khmer UI and the name otherwise', () => {
    expect(getCategoryName(gym, t, 'km')).toBe('ហាត់ប្រាណ');
    expect(getCategoryName(gym, t, 'en')).toBe('Gym');
  });

  it('falls back to the name when there is no Khmer name', () => {
    expect(getCategoryName({ ...gym, nameKm: '  ' }, t, 'km')).toBe('Gym');
    expect(getCategoryName({ key: null, name: 'Netflix' }, t, 'km')).toBe('Netflix');
  });

  it('translates default categories by key', () => {
    expect(getCategoryName({ key: 'food', name: 'Food', nameKm: '' }, t, 'km')).toBe('អាហារ');
  });
});
