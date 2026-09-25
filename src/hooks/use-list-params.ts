'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { z } from 'zod';

import { usePathname, useRouter } from '@/i18n/navigation';
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS, type ListParams } from '@/lib/list';

import { useDebouncedCallback } from './use-debounce';

export type UseListParamsOptions<K extends string = never> = {
  defaultSort?: string;
  /** Allowed sort keys (without "-"). Other values in the URL fall back to `defaultSort`. Keep it a constant. */
  sortKeys?: readonly string[];
  /**
   * Extra URL params the list is filtered by (e.g. `['month', 'category']`). Read as strings ('' when absent);
   * the caller validates them. Empty values are left out of the URL. Keep it a constant.
   */
  filterKeys?: readonly K[];
  /** Allowed page sizes (default PAGE_SIZE_OPTIONS). Keep it a constant. */
  pageSizeOptions?: readonly number[];
  /** Default DEFAULT_PAGE_SIZE; must be one of `pageSizeOptions`. */
  defaultPageSize?: number;
};

type ParseOptions = Pick<UseListParamsOptions, 'defaultSort' | 'sortKeys' | 'pageSizeOptions' | 'defaultPageSize'>;

const pageSchema = z.coerce.number().int().min(1).catch(1);

/** Reads and validates list params from URL search params. Invalid values fall back to defaults. */
export function parseListParams(
  search: URLSearchParams,
  { defaultSort, sortKeys, pageSizeOptions = PAGE_SIZE_OPTIONS, defaultPageSize = DEFAULT_PAGE_SIZE }: ParseOptions = {}
): ListParams {
  const sort = search.get('sort') ?? undefined;
  const sortKey = sort?.replace(/^-/, '');
  const validSort = sort && sortKey && (!sortKeys || sortKeys.includes(sortKey)) ? sort : defaultSort;

  return {
    page: pageSchema.parse(search.get('page') ?? 1),
    pageSize: z.coerce
      .number()
      .refine((n) => pageSizeOptions.includes(n))
      .catch(defaultPageSize)
      .parse(search.get('pageSize') ?? defaultPageSize),
    search: (search.get('q') ?? '').slice(0, 100),
    sort: validSort,
  };
}

/** Builds the query string for `params` (+ changed `filters`), keeping unrelated keys and leaving out defaults. */
export function buildListQuery(
  current: URLSearchParams,
  params: ListParams,
  { defaultSort, defaultPageSize = DEFAULT_PAGE_SIZE }: Pick<ParseOptions, 'defaultSort' | 'defaultPageSize'> = {},
  filters: Record<string, string> = {}
): Record<string, string> {
  const query = new URLSearchParams(current);
  const set = (key: string, value: string | number | undefined, fallback: string | number | undefined) => {
    if (value === undefined || value === '' || value === fallback) query.delete(key);
    else query.set(key, String(value));
  };
  set('page', params.page, 1);
  set('pageSize', params.pageSize, defaultPageSize);
  set('q', params.search.trim(), '');
  set('sort', params.sort, defaultSort);
  for (const [key, value] of Object.entries(filters)) set(key, value, '');
  return Object.fromEntries(query);
}

/**
 * List state (page, page size, search, sort) kept in the URL, so it can be shared and the back button works.
 * URL: ?page=2&pageSize=20&q=food&sort=-expenseCount — default values are left out.
 * Optional `filterKeys` add feature filters (e.g. ?month=2026-08&category=3); changing one resets to page 1.
 */
export function useListParams<K extends string = never>({
  defaultSort,
  sortKeys,
  filterKeys,
  pageSizeOptions,
  defaultPageSize,
}: UseListParamsOptions<K> = {}) {
  const parseOptions = useMemo(
    () => ({ defaultSort, sortKeys, pageSizeOptions, defaultPageSize }),
    [defaultSort, sortKeys, pageSizeOptions, defaultPageSize]
  );
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const params = useMemo(
    () => parseListParams(new URLSearchParams(searchParams.toString()), parseOptions),
    [searchParams, parseOptions]
  );

  const filters = useMemo(
    () => Object.fromEntries((filterKeys ?? []).map((key) => [key, searchParams.get(key) ?? ''])) as Record<K, string>,
    [searchParams, filterKeys]
  );

  const update = useCallback(
    (patch: Partial<ListParams>, filterPatch: Partial<Record<K, string>> = {}) => {
      // Read the live URL so quick successive updates never work from a stale copy.
      const current = new URLSearchParams(window.location.search);
      const next = { ...parseListParams(current, parseOptions), ...patch };
      const query = buildListQuery(current, next, parseOptions, filterPatch as Record<string, string>);
      router.replace({ pathname, query }, { scroll: false });
    },
    [router, pathname, parseOptions]
  );

  // The input shows what the user types right away; the URL follows 300 ms later.
  const [searchInput, setSearchInput] = useState(params.search);
  const [syncedSearch, setSyncedSearch] = useState(params.search);
  if (syncedSearch !== params.search) {
    // The URL changed from outside (back button, a link): show its value in the input.
    setSyncedSearch(params.search);
    setSearchInput(params.search);
  }
  const commitSearch = useDebouncedCallback((value: string | null) => {
    if (value !== null) update({ search: value, page: 1 });
  }, 300);

  return {
    params,
    filters,
    searchInput,
    setPage: useCallback((page: number) => update({ page }), [update]),
    setPageSize: useCallback((pageSize: number) => update({ pageSize, page: 1 }), [update]),
    setSort: useCallback((sort: string) => update({ sort, page: 1 }), [update]),
    setSearch: useCallback(
      (value: string) => {
        setSearchInput(value);
        commitSearch(value);
      },
      [commitSearch]
    ),
    clearSearch: useCallback(() => {
      setSearchInput('');
      commitSearch(null); // cancels a pending search
      update({ search: '', page: 1 });
    }, [commitSearch, update]),
    /** Sets one filter and goes back to page 1. */
    setFilter: useCallback(
      (key: K, value: string) => update({ page: 1 }, { [key]: value } as Partial<Record<K, string>>),
      [update]
    ),
    /** Clears the search and the given filters (default: all) in one URL update. */
    clearFilters: useCallback(
      (keys: readonly K[] = filterKeys ?? []) => {
        setSearchInput('');
        commitSearch(null);
        update({ search: '', page: 1 }, Object.fromEntries(keys.map((key) => [key, ''])) as Partial<Record<K, string>>);
      },
      [commitSearch, update, filterKeys]
    ),
  };
}
