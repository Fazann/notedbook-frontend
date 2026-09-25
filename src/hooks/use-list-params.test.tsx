import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildListQuery, parseListParams, useListParams } from './use-list-params';

const replace = vi.fn();
let currentSearch = '';

vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams(currentSearch) }));
vi.mock('@/i18n/navigation', () => ({
  usePathname: () => '/expenses/categories',
  useRouter: () => ({ replace }),
}));

const SORT_KEYS = ['name', 'expenseCount', 'createdAt'] as const;
const options = { defaultSort: 'name', sortKeys: SORT_KEYS };

function setUrl(search: string) {
  currentSearch = search;
  window.history.replaceState(null, '', `/en/expenses/categories${search ? `?${search}` : ''}`);
}

describe('parseListParams', () => {
  it('reads valid params', () => {
    expect(parseListParams(new URLSearchParams('page=2&pageSize=20&q=food&sort=-expenseCount'), options)).toEqual({
      page: 2,
      pageSize: 20,
      search: 'food',
      sort: '-expenseCount',
    });
  });

  it('falls back to defaults for invalid values', () => {
    expect(parseListParams(new URLSearchParams('page=-3&pageSize=13&sort=-password'), options)).toEqual({
      page: 1,
      pageSize: 10,
      search: '',
      sort: 'name',
    });
    expect(parseListParams(new URLSearchParams('page=abc'), options).page).toBe(1);
  });
});

describe('custom page sizes', () => {
  const grid = { ...options, pageSizeOptions: [12, 24, 48], defaultPageSize: 12 };

  it('accepts only the given sizes and falls back to the given default', () => {
    expect(parseListParams(new URLSearchParams('pageSize=24'), grid).pageSize).toBe(24);
    expect(parseListParams(new URLSearchParams('pageSize=10'), grid).pageSize).toBe(12);
    expect(parseListParams(new URLSearchParams(''), grid).pageSize).toBe(12);
  });

  it('leaves the default size out of the URL', () => {
    const params = { page: 1, pageSize: 12, search: '', sort: 'name' };
    expect(buildListQuery(new URLSearchParams(), params, grid)).toEqual({});
    expect(buildListQuery(new URLSearchParams(), { ...params, pageSize: 24 }, grid)).toEqual({ pageSize: '24' });
  });
});

describe('buildListQuery', () => {
  it('leaves default values out of the URL and keeps other params', () => {
    const current = new URLSearchParams('category=3');
    expect(buildListQuery(current, { page: 1, pageSize: 10, search: ' ', sort: 'name' }, options)).toEqual({
      category: '3',
    });
    expect(buildListQuery(current, { page: 2, pageSize: 20, search: 'gym', sort: '-name' }, options)).toEqual({
      category: '3',
      page: '2',
      pageSize: '20',
      q: 'gym',
      sort: '-name',
    });
  });
});

describe('useListParams', () => {
  beforeEach(() => {
    replace.mockClear();
    setUrl('page=3&q=food');
  });
  afterEach(() => vi.useRealTimers());

  const lastQuery = () => replace.mock.calls.at(-1)?.[0].query;

  it('changes page without touching other params', () => {
    const { result } = renderHook(() => useListParams(options));
    act(() => result.current.setPage(4));
    expect(lastQuery()).toEqual({ page: '4', q: 'food' });
    expect(replace.mock.calls.at(-1)?.[1]).toEqual({ scroll: false });
  });

  it('resets to page 1 when sort or page size changes', () => {
    const { result } = renderHook(() => useListParams(options));
    act(() => result.current.setSort('-expenseCount'));
    expect(lastQuery()).toEqual({ q: 'food', sort: '-expenseCount' });
    act(() => result.current.setPageSize(20));
    expect(lastQuery()).toEqual({ pageSize: '20', q: 'food' });
  });

  it('debounces search by 300 ms and resets to page 1', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useListParams(options));
    act(() => result.current.setSearch('gy'));
    act(() => result.current.setSearch('gym'));
    expect(result.current.searchInput).toBe('gym');
    expect(replace).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(300));
    expect(replace).toHaveBeenCalledTimes(1);
    expect(lastQuery()).toEqual({ q: 'gym' });
  });

  it('clears search right away and cancels a pending one', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useListParams(options));
    act(() => result.current.setSearch('gym'));
    act(() => result.current.clearSearch());
    act(() => vi.advanceTimersByTime(300));
    expect(replace).toHaveBeenCalledTimes(1);
    expect(lastQuery()).toEqual({});
    expect(result.current.searchInput).toBe('');
  });

  describe('filters', () => {
    const withFilters = { ...options, filterKeys: ['month', 'category'] as const };

    it('reads filter values from the URL ("" when absent)', () => {
      setUrl('month=2026-08');
      const { result } = renderHook(() => useListParams(withFilters));
      expect(result.current.filters).toEqual({ month: '2026-08', category: '' });
    });

    it('sets a filter, resets to page 1 and drops empty values', () => {
      setUrl('page=3&q=food&month=2026-08');
      const { result } = renderHook(() => useListParams(withFilters));
      act(() => result.current.setFilter('category', '4'));
      expect(lastQuery()).toEqual({ q: 'food', month: '2026-08', category: '4' });
      act(() => result.current.setFilter('month', ''));
      expect(lastQuery()).toEqual({ q: 'food' });
    });

    it('clears search and the given filters in one update', () => {
      setUrl('page=2&q=food&month=2026-08&category=4');
      const { result } = renderHook(() => useListParams(withFilters));
      act(() => result.current.clearFilters(['category']));
      expect(replace).toHaveBeenCalledTimes(1);
      expect(lastQuery()).toEqual({ month: '2026-08' });
      expect(result.current.searchInput).toBe('');
    });
  });
});
