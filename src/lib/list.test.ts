import { describe, expect, it } from 'vitest';

import { getPageItems, paginate, parseSort, removeFromPage, toggleSort } from './list';

describe('getPageItems', () => {
  it('shows every page when there are few', () => {
    expect(getPageItems(1, 1)).toEqual([1]);
    expect(getPageItems(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('uses ellipses on both sides in the middle', () => {
    expect(getPageItems(5, 12)).toEqual([1, 'ellipsis', 4, 5, 6, 'ellipsis', 12]);
  });

  it('keeps the start or end together', () => {
    expect(getPageItems(1, 12)).toEqual([1, 2, 3, 4, 5, 'ellipsis', 12]);
    expect(getPageItems(4, 12)).toEqual([1, 2, 3, 4, 5, 'ellipsis', 12]);
    expect(getPageItems(9, 12)).toEqual([1, 'ellipsis', 8, 9, 10, 11, 12]);
    expect(getPageItems(12, 12)).toEqual([1, 'ellipsis', 8, 9, 10, 11, 12]);
  });

  it('never shows more than 7 entries', () => {
    for (let page = 1; page <= 30; page++) expect(getPageItems(page, 30).length).toBeLessThanOrEqual(7);
  });
});

describe('sort helpers', () => {
  it('parses direction from the "-" prefix', () => {
    expect(parseSort('-name')).toEqual({ key: 'name', dir: 'desc' });
    expect(parseSort('name')).toEqual({ key: 'name', dir: 'asc' });
    expect(parseSort(undefined)).toBeUndefined();
  });

  it('toggles asc → desc, and starts a new column ascending', () => {
    expect(toggleSort('name', 'name')).toBe('-name');
    expect(toggleSort('-name', 'name')).toBe('name');
    expect(toggleSort('-name', 'expenseCount')).toBe('expenseCount');
  });
});

describe('paginate', () => {
  it('slices a page and builds the meta', () => {
    const items = Array.from({ length: 25 }, (_, i) => i);
    expect(paginate(items, 3, 10)).toEqual({
      data: [20, 21, 22, 23, 24],
      meta: { page: 3, pageSize: 10, total: 25, totalPages: 3 },
    });
    expect(paginate([], 1, 10).meta).toEqual({ page: 1, pageSize: 10, total: 0, totalPages: 0 });
  });
});

describe('removeFromPage', () => {
  const page = paginate([{ id: 1 }, { id: 2 }, { id: 3 }], 1, 2);

  it('removes the item and updates the meta', () => {
    expect(removeFromPage(page, 2)).toEqual({
      data: [{ id: 1 }],
      meta: { page: 1, pageSize: 2, total: 2, totalPages: 1 },
    });
  });

  it('returns the same page when the item is not on it', () => {
    expect(removeFromPage(page, 3)).toBe(page);
  });
});
