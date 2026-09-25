'use client';

import { SearchX } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Fragment } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

import { DataListRowActions, type RowAction } from './data-list-row-actions';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { ariaSort, SortableHeader } from './sortable-header';

export type DataListColumn<T> = {
  id: string;
  /** Translated text passed in by the caller. */
  header: React.ReactNode;
  cell: (item: T) => React.ReactNode;
  /** When set, the header is sortable. */
  sortKey?: string;
  className?: string;
  align?: 'start' | 'end';
};

/** Table from `md`, card list on phones (the default). */
export type DataListTableProps<T> = {
  layout?: 'table';
  columns: DataListColumn<T>[];
  /** Card layout for phones. */
  renderMobileItem: (item: T) => React.ReactNode;
  /**
   * Phones only: a heading is shown before each run of items with the same group `id` (e.g. one per day).
   * Items must already be ordered by group.
   */
  getMobileGroup?: (item: T) => { id: string; label: React.ReactNode };
  rowActions?: (item: T) => RowAction[];
  onRowClick?: (item: T) => void;
  sort?: string;
  onSortChange?: (sort: string) => void;
  /** Screen-reader caption for the table. */
  caption?: string;
};

/** Card grid: 1 column on phones, 2 from `md`, 3 from `lg`. The caller renders each card, with its own actions. */
export type DataListGridProps<T> = {
  layout: 'grid';
  renderGridItem: (item: T) => React.ReactNode;
  /** Accessible name of the list. */
  'aria-label'?: string;
};

export type DataListBaseProps<T> = {
  items: T[] | undefined;
  getRowId: (item: T) => string | number;
  /** First load → skeleton rows / cards. */
  isLoading?: boolean;
  /** Page / sort change → keep old rows, dimmed, no layout jump. */
  isFetching?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  /** Defaults to the common "Could not load data". */
  errorMessage?: React.ReactNode;
  /** Decides "no results" vs "empty". */
  isFiltered?: boolean;
  /** Shown when there is no data at all. */
  emptyState: React.ReactNode;
  /** Default: "No results for “{searchQuery}”" + a clear button (needs `onClearSearch`). */
  noResultsState?: React.ReactNode;
  searchQuery?: string;
  onClearSearch?: () => void;
  /** Skeleton rows on first load (capped at 10; phones show at most 5 cards; the grid shows at most 6). */
  skeletonCount?: number;
  className?: string;
};

export type DataListProps<T> = DataListBaseProps<T> & (DataListTableProps<T> | DataListGridProps<T>);

const alignClass = (align: 'start' | 'end' | undefined) => (align === 'end' ? 'text-right' : 'text-left');

/**
 * A list that is a table from `md` and a card list on phones, or a card grid (`layout="grid"`).
 * Handles loading, empty, no results and error in both layouts.
 */
export function DataList<T>(props: DataListProps<T>) {
  const {
    items,
    getRowId,
    isLoading,
    isFetching,
    isError,
    onRetry,
    errorMessage,
    isFiltered,
    emptyState,
    noResultsState,
    searchQuery,
    onClearSearch,
    skeletonCount = 10,
    className,
  } = props;
  const t = useTranslations('list');
  const rows = Math.min(skeletonCount, 10);

  if (isError && !items) {
    return (
      <Card className={className}>
        <ErrorState message={errorMessage ?? t('errorTitle')} onRetry={onRetry} />
      </Card>
    );
  }

  if (!isLoading && items && items.length === 0) {
    return (
      <Card className={className}>
        {isFiltered
          ? (noResultsState ?? (
              <EmptyState
                icon={<SearchX />}
                title={t('noResults', { query: searchQuery ?? '' })}
                action={
                  onClearSearch && (
                    <Button variant="outline" size="touch" onClick={onClearSearch}>
                      {t('clearSearch')}
                    </Button>
                  )
                }
              />
            ))
          : emptyState}
      </Card>
    );
  }

  const busy = isFetching && !isLoading;
  const wrapperClass = cn('transition-opacity', busy && 'pointer-events-none opacity-60', className);

  if (props.layout === 'grid') {
    return (
      <div className={wrapperClass} aria-busy={isLoading || isFetching}>
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3" aria-label={props['aria-label']}>
          {isLoading || !items
            ? Array.from({ length: Math.min(rows, 6) }, (_, i) => (
                <li key={i} aria-hidden>
                  <Card className="gap-3 px-4 py-4">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-2 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                  </Card>
                </li>
              ))
            : items.map((item) => (
                <li key={getRowId(item)} className="flex min-w-0 flex-col">
                  {props.renderGridItem(item)}
                </li>
              ))}
        </ul>
      </div>
    );
  }

  const { columns, renderMobileItem, getMobileGroup, rowActions, onRowClick, sort, onSortChange, caption } = props;

  return (
    <div className={wrapperClass} aria-busy={isLoading || isFetching}>
      {/* Table: md and up */}
      <Card className="hidden py-0 md:block">
        <Table>
          {caption && <TableCaption className="sr-only">{caption}</TableCaption>}
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.id}
                  className={cn('h-11 px-4', alignClass(col.align), col.className)}
                  aria-sort={col.sortKey ? ariaSort(sort, col.sortKey) : undefined}
                >
                  {col.sortKey && onSortChange ? (
                    <SortableHeader
                      label={col.header}
                      sortKey={col.sortKey}
                      sort={sort}
                      onSortChange={onSortChange}
                      align={col.align}
                    />
                  ) : (
                    col.header
                  )}
                </TableHead>
              ))}
              {rowActions && (
                <TableHead className="w-14 px-4">
                  <span className="sr-only">{t('actions')}</span>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading || !items
              ? Array.from({ length: rows }, (_, i) => (
                  <TableRow key={i} aria-hidden>
                    {columns.map((col) => (
                      <TableCell key={col.id} className="px-4 py-3">
                        <Skeleton className={cn('h-5', col.align === 'end' ? 'ml-auto w-12' : 'w-32')} />
                      </TableCell>
                    ))}
                    {rowActions && <TableCell className="px-4" />}
                  </TableRow>
                ))
              : items.map((item) => (
                  <TableRow
                    key={getRowId(item)}
                    onClick={onRowClick && (() => onRowClick(item))}
                    className={cn(onRowClick && 'cursor-pointer')}
                  >
                    {columns.map((col) => (
                      <TableCell
                        key={col.id}
                        className={cn('px-4 py-2 whitespace-normal', alignClass(col.align), col.className)}
                      >
                        {col.cell(item)}
                      </TableCell>
                    ))}
                    {rowActions && (
                      <TableCell className="px-4 py-1 text-right">
                        <DataListRowActions actions={rowActions(item)} />
                      </TableCell>
                    )}
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </Card>

      {/* Card list: phones */}
      <ul className="space-y-2 md:hidden">
        {isLoading || !items
          ? Array.from({ length: Math.min(rows, 5) }, (_, i) => (
              <li key={i} aria-hidden>
                <Card className="gap-2 px-4 py-4">
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                </Card>
              </li>
            ))
          : items.map((item, i) => {
              const group = getMobileGroup?.(item);
              const isNewGroup = group && (i === 0 || getMobileGroup?.(items[i - 1]).id !== group.id);
              return (
                <Fragment key={getRowId(item)}>
                  {isNewGroup && (
                    <li className="text-muted-foreground px-1 pt-2 text-sm font-medium first:pt-0">{group.label}</li>
                  )}
                  <li>
                    <Card className="flex-row items-start gap-2 py-3 pr-1 pl-4">
                      <div
                        className={cn('min-w-0 flex-1 self-center', onRowClick && 'cursor-pointer')}
                        onClick={onRowClick && (() => onRowClick(item))}
                      >
                        {renderMobileItem(item)}
                      </div>
                      {rowActions && <DataListRowActions actions={rowActions(item)} />}
                    </Card>
                  </li>
                </Fragment>
              );
            })}
      </ul>
    </div>
  );
}
