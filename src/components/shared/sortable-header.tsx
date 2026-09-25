'use client';

import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { parseSort, toggleSort } from '@/lib/list';
import { cn } from '@/lib/utils';

export type SortableHeaderProps = {
  label: React.ReactNode;
  sortKey: string;
  /** Current sort, e.g. "-name". */
  sort?: string;
  onSortChange: (sort: string) => void;
  align?: 'start' | 'end';
};

/** `aria-sort` value for the `<th>` that holds a SortableHeader. */
export function ariaSort(sort: string | undefined, sortKey: string): 'ascending' | 'descending' | 'none' {
  const parsed = parseSort(sort);
  if (parsed?.key !== sortKey) return 'none';
  return parsed.dir === 'asc' ? 'ascending' : 'descending';
}

/** Button inside a table header: click sorts ascending, click again descending. Shows ↑ / ↓. */
export function SortableHeader({ label, sortKey, sort, onSortChange, align = 'start' }: SortableHeaderProps) {
  const t = useTranslations('list');
  const state = ariaSort(sort, sortKey);
  const Icon = state === 'ascending' ? ArrowUp : state === 'descending' ? ArrowDown : ArrowUpDown;

  return (
    <button
      type="button"
      onClick={() => onSortChange(toggleSort(sort, sortKey))}
      className={cn(
        '-mx-2 inline-flex min-h-9 items-center gap-1 rounded-md px-2 font-medium',
        'hover:bg-muted focus-visible:ring-ring/50 outline-none focus-visible:ring-3',
        align === 'end' && 'flex-row-reverse'
      )}
    >
      {label}
      <Icon className={cn('size-3.5', state === 'none' && 'text-muted-foreground/60')} aria-hidden />
      {state !== 'none' && <span className="sr-only">{state === 'ascending' ? t('sortAsc') : t('sortDesc')}</span>}
    </button>
  );
}
