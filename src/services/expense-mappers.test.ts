import { describe, expect, it } from 'vitest';

import {
  type ApiCategory,
  decimalToMinor,
  toApiSort,
  toCategory,
  toCategoryBody,
  toExpense,
  toExpenseBody,
  toExpenseSummary,
} from './expense-mappers';

const apiCategory = (over: Partial<ApiCategory> = {}): ApiCategory => ({
  id: 1,
  name: 'Food',
  display_name: 'អាហារ',
  translations: { km: 'អាហារ', ms: 'Makanan' },
  is_default: true,
  expense_count: 3,
  icon: 'utensils',
  color: 'chart-1',
  created_at: '2026-09-28T23:14:20+07:00',
  updated_at: '2026-09-28T23:14:20+07:00',
  ...over,
});

describe('toCategory', () => {
  it('maps a default category to its translation key', () => {
    expect(toCategory(apiCategory())).toEqual({
      id: 1,
      key: 'food',
      name: 'Food',
      nameKm: 'អាហារ',
      icon: 'utensils',
      color: 'chart-1',
      isDefault: true,
      expenseCount: 3,
      createdAt: '2026-09-28T23:14:20+07:00',
      updatedAt: '2026-09-28T23:14:20+07:00',
    });
    expect(toCategory(apiCategory({ name: 'Phone & Internet' })).key).toBe('phoneInternet');
  });

  it('keeps user categories as typed, with the Khmer name from translations', () => {
    const gym = toCategory(apiCategory({ name: 'Gym', display_name: 'Gym', translations: {}, is_default: false }));
    expect(gym).toMatchObject({ key: null, name: 'Gym', nameKm: '', isDefault: false });
  });

  it('shows an unknown default by its translated name, and falls back on unknown icons / colors', () => {
    const c = toCategory(apiCategory({ name: 'Pets', display_name: 'សត្វចិញ្ចឹម', icon: 'cat', color: 'gold' }));
    expect(c).toMatchObject({ key: null, name: 'សត្វចិញ្ចឹម', icon: 'ellipsis', color: 'slate' });
  });
});

describe('toCategoryBody', () => {
  it('sends the Khmer name as a translation and keeps the other languages', () => {
    const input = { name: 'Gym', nameKm: 'ហាត់ប្រាណ', icon: 'dumbbell', color: 'green' } as const;
    expect(toCategoryBody(input, { ms: 'Gim', km: 'old' })).toEqual({
      name: 'Gym',
      translations: { ms: 'Gim', km: 'ហាត់ប្រាណ' },
      icon: 'dumbbell',
      color: 'green',
    });
  });
});

describe('money conversion', () => {
  it('reads API decimal strings as integer minor units', () => {
    expect(decimalToMinor('12.50', 'USD')).toBe(1250);
    expect(decimalToMinor('40000', 'KHR')).toBe(40000);
    expect(decimalToMinor('0.05', 'MYR')).toBe(5);
    expect(() => decimalToMinor('12.5x', 'USD')).toThrow();
  });

  it('round-trips an expense', () => {
    const expense = toExpense({
      id: 9,
      amount: '1234.05',
      currency: 'USD',
      category_id: 2,
      spent_at: '2026-10-06',
      note: 'Lunch',
      created_at: '2026-10-06T12:00:00+07:00',
      updated_at: '2026-10-06T12:00:00+07:00',
    });
    expect(expense).toEqual({
      id: 9,
      amount: 123405,
      currency: 'USD',
      category_id: 2,
      spent_at: '2026-10-06',
      note: 'Lunch',
      created_at: '2026-10-06T12:00:00+07:00',
    });
    expect(toExpenseBody(expense)).toMatchObject({ amount: '1234.05', currency: 'USD', category_id: 2 });
    expect(toExpenseBody({ ...expense, amount: 40000, currency: 'KHR' }).amount).toBe('40000');
  });

  it('maps the summary per currency without mixing them', () => {
    expect(
      toExpenseSummary({
        month: '2026-10',
        totals: [
          { currency: 'USD', amount: '16.50', count: 3 },
          { currency: 'KHR', amount: '40000', count: 1 },
        ],
        by_category: [{ category_id: 1, currency: 'KHR', amount: '40000', count: 1 }],
      })
    ).toEqual({
      month: '2026-10',
      totals: [
        { currency: 'USD', amount: 1650, count: 3 },
        { currency: 'KHR', amount: 40000, count: 1 },
      ],
      by_category: [{ category_id: 1, currency: 'KHR', amount: 40000 }],
    });
  });
});

describe('toApiSort', () => {
  it('converts camelCase sort keys and keeps the direction', () => {
    expect(toApiSort('-expenseCount')).toBe('-expense_count');
    expect(toApiSort('createdAt')).toBe('created_at');
    expect(toApiSort('-spent_at')).toBe('-spent_at');
  });
});
