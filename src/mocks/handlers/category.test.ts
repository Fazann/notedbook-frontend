import { describe, expect, it, vi } from 'vitest';

import { db } from '../db';

import { createCategory, deleteCategory, listCategories, updateCategory } from './category';

vi.mock('../delay', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../delay')>()),
  delay: () => Promise.resolve(),
}));

const params = { page: 1, pageSize: 10, search: '', sort: 'name' };

describe('mock category handler', () => {
  it('pages the 25 seed categories and returns meta', async () => {
    const page3 = await listCategories({ ...params, page: 3 });
    expect(page3.meta).toEqual({ page: 3, pageSize: 10, total: 25, totalPages: 3 });
    expect(page3.data).toHaveLength(5);
  });

  it('searches the displayed (translated) name', async () => {
    const en = await listCategories({ ...params, search: 'food' });
    expect(en.data.map((c) => c.name)).toEqual(['Food', 'Pet food']);
    const km = await listCategories({ ...params, search: 'អាហារ' }, 'km');
    expect(km.data.map((c) => c.key)).toEqual(['food']);
  });

  it('sorts by name, expense count and creation date', async () => {
    const byName = await listCategories({ ...params, pageSize: 50 });
    const names = byName.data.map((c) => c.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'en')));

    const mostUsed = await listCategories({ ...params, pageSize: 50, sort: '-expenseCount' });
    const counts = mostUsed.data.map((c) => c.expenseCount);
    expect(counts).toEqual([...counts].sort((a, b) => b - a));
    expect(counts[0]).toBeGreaterThan(0);

    const newest = await listCategories({ ...params, sort: '-createdAt' });
    expect(newest.data[0].name).toBe('Online courses');
  });

  it('rejects a duplicate name (case-insensitive, trimmed)', async () => {
    await expect(
      createCategory({ name: '  gym ', nameKm: '', icon: 'dumbbell', color: 'green' })
    ).rejects.toMatchObject({
      status: 409,
      code: 'CATEGORY_NAME_TAKEN',
    });
    await expect(updateCategory(12, { name: 'GYM', nameKm: '', icon: 'receipt', color: 'red' })).rejects.toMatchObject({
      code: 'CATEGORY_NAME_TAKEN',
    });
  });

  it('finds user categories by either name, and sorts by the name shown in each language', async () => {
    const byKhmer = await listCategories({ ...params, search: 'ហាត់' });
    expect(byKhmer.data.map((c) => c.name)).toEqual(['Gym']);
    const inKhmerUi = await listCategories({ ...params, search: 'gym' }, 'km');
    expect(inKhmerUi.data.map((c) => c.nameKm)).toEqual(['ហាត់ប្រាណ']);
  });

  it('saves and trims the Khmer name', async () => {
    const created = await createCategory({ name: 'Rice', nameKm: ' អង្ករ ', icon: 'utensils', color: 'green' });
    expect(created).toMatchObject({ name: 'Rice', nameKm: 'អង្ករ' });
    const updated = await updateCategory(created.id, { name: 'Rice', nameKm: '', icon: 'utensils', color: 'green' });
    expect(updated.nameKm).toBe('');
  });

  it('never renames a default category', async () => {
    const updated = await updateCategory(1, { name: 'Snacks', nameKm: '', icon: 'coffee', color: 'red' });
    expect(updated).toMatchObject({ name: 'Food', nameKm: '', icon: 'coffee', color: 'red' });
  });

  it('refuses to delete defaults, and in-use categories without reassignTo', async () => {
    await expect(deleteCategory(1)).rejects.toMatchObject({ code: 'CATEGORY_IS_DEFAULT' });
    await expect(deleteCategory(11)).rejects.toMatchObject({ code: 'CATEGORY_IN_USE', status: 409 });
    await expect(deleteCategory(999)).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 });
  });

  it('moves expenses when deleting with reassignTo', async () => {
    const gymExpenses = db.expenses.filter((e) => e.category_id === 11).length;
    const otherBefore = db.expenses.filter((e) => e.category_id === 10).length;
    expect(gymExpenses).toBeGreaterThan(0);

    await deleteCategory(11, 10);
    expect(db.categories.some((c) => c.id === 11)).toBe(false);
    expect(db.expenses.filter((e) => e.category_id === 11)).toHaveLength(0);
    expect(db.expenses.filter((e) => e.category_id === 10)).toHaveLength(otherBefore + gymExpenses);
  });

  it('deletes an unused category without reassignTo', async () => {
    const created = await createCategory({ name: 'Lottery', nameKm: '', icon: 'gift', color: 'amber' });
    expect(created).toMatchObject({ key: null, isDefault: false, expenseCount: 0 });
    await deleteCategory(created.id);
    expect(db.categories.some((c) => c.id === created.id)).toBe(false);
  });
});
