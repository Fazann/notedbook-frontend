export type SortDir = 'asc' | 'desc';

export type ListParams = {
  /** 1-based */
  page: number;
  /** One of PAGE_SIZE_OPTIONS */
  pageSize: number;
  search: string;
  /** e.g. "name" | "-name" | "-expenseCount" ("-" = desc) */
  sort?: string;
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  /** Total items matching the filter */
  total: number;
  totalPages: number;
};

export type Paginated<T> = { data: T[]; meta: PaginationMeta };

export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
export const DEFAULT_PAGE_SIZE = 10;

/** "-name" → { key: "name", dir: "desc" } */
export function parseSort(sort: string | undefined): { key: string; dir: SortDir } | undefined {
  if (!sort) return undefined;
  return sort.startsWith('-') ? { key: sort.slice(1), dir: 'desc' } : { key: sort, dir: 'asc' };
}

/** Next sort when a column header is clicked: ascending first, then toggles. */
export function toggleSort(current: string | undefined, key: string): string {
  const parsed = parseSort(current);
  return parsed?.key === key && parsed.dir === 'asc' ? `-${key}` : key;
}

/** Slices an array into one page and builds the meta (used by mock handlers). */
export function paginate<T>(items: T[], page: number, pageSize: number): Paginated<T> {
  const total = items.length;
  const start = (page - 1) * pageSize;
  return {
    data: items.slice(start, start + pageSize),
    meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
}

/** The page without the item `id` (for optimistic deletes); returns `page` itself when the item isn't on it. */
export function removeFromPage<T extends { id: number }>(page: Paginated<T>, id: number): Paginated<T> {
  if (!page.data.some((item) => item.id === id)) return page;
  const total = page.meta.total - 1;
  return {
    data: page.data.filter((item) => item.id !== id),
    meta: { ...page.meta, total, totalPages: Math.ceil(total / page.meta.pageSize) },
  };
}

/**
 * Page buttons to show: at most `max` entries, with 'ellipsis' for gaps.
 * getPageItems(5, 12) → [1, 'ellipsis', 4, 5, 6, 'ellipsis', 12]
 */
export function getPageItems(page: number, totalPages: number, max = 7): (number | 'ellipsis')[] {
  if (totalPages <= max) return Array.from({ length: totalPages }, (_, i) => i + 1);

  // Always first and last; the current page sits in a window of `middle` pages between two ellipses.
  const middle = max - 4;
  if (page <= max - 3) {
    return [...Array.from({ length: max - 2 }, (_, i) => i + 1), 'ellipsis', totalPages];
  }
  if (page >= totalPages - middle) {
    return [1, 'ellipsis', ...Array.from({ length: max - 2 }, (_, i) => totalPages - (max - 3) + i)];
  }
  const start = page - Math.floor((middle - 1) / 2);
  return [1, 'ellipsis', ...Array.from({ length: middle }, (_, i) => start + i), 'ellipsis', totalPages];
}
