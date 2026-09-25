import { describe, expect, it, vi } from 'vitest';

import type { ExpenseListParams } from '@/features/expense/types';

import { db } from '../db';

import { listExpensesPage } from './expense';

vi.mock('../delay', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../delay')>()),
  delay: () => Promise.resolve(),
}));

const month = db.expenses[0].spent_at.slice(0, 7);
const params: ExpenseListParams = { page: 1, pageSize: 50, search: '', sort: '-spent_at', month };
const inMonth = db.expenses.filter((e) => e.spent_at.startsWith(month));

describe('mock expense list handler', () => {
  it('returns only the month, newest first, with paging meta', async () => {
    const all = await listExpensesPage(params);
    expect(all.meta.total).toBe(inMonth.length);
    expect(all.data.every((e) => e.spent_at.startsWith(month))).toBe(true);
    const dates = all.data.map((e) => e.spent_at);
    expect(dates).toEqual([...dates].sort().reverse());

    const page2 = await listExpensesPage({ ...params, page: 2, pageSize: 5 });
    expect(page2.meta).toEqual({
      page: 2,
      pageSize: 5,
      total: inMonth.length,
      totalPages: Math.ceil(inMonth.length / 5),
    });
  });

  it('filters by category, currency and note', async () => {
    const { category_id } = inMonth[0];
    const byCategory = await listExpensesPage({ ...params, categoryId: category_id });
    expect(byCategory.data.length).toBeGreaterThan(0);
    expect(byCategory.data.every((e) => e.category_id === category_id)).toBe(true);

    const khr = await listExpensesPage({ ...params, currency: 'KHR' });
    expect(khr.data.every((e) => e.currency === 'KHR')).toBe(true);

    const note = inMonth.find((e) => e.note)?.note ?? '';
    const bySearch = await listExpensesPage({ ...params, search: note.toUpperCase() });
    expect(bySearch.data.length).toBeGreaterThan(0);
    expect(bySearch.data.every((e) => e.note.toLowerCase().includes(note.toLowerCase()))).toBe(true);
  });

  it('sorts by amount within each currency, never across currencies', async () => {
    const { data } = await listExpensesPage({ ...params, sort: '-amount' });
    const currencies = data.map((e) => e.currency);
    // Currencies come in one block each.
    expect(currencies.filter((c, i) => i === 0 || c !== currencies[i - 1])).toHaveLength(new Set(currencies).size);
    for (const currency of new Set(currencies)) {
      const amounts = data.filter((e) => e.currency === currency).map((e) => e.amount);
      expect(amounts).toEqual([...amounts].sort((a, b) => b - a));
    }
  });
});
