'use client';

import { Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export type ListToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  onSearchClear: () => void;
  /** Defaults to the common "Search…". */
  searchPlaceholder?: string;
  /** Controls before the search (e.g. status tabs). Full width on phones. */
  leading?: React.ReactNode;
  /** Filter controls next to the search. */
  filters?: React.ReactNode;
  /** Controls on the right (e.g. sort select). */
  actions?: React.ReactNode;
  className?: string;
};

export function ListToolbar({
  search,
  onSearchChange,
  onSearchClear,
  searchPlaceholder,
  leading,
  filters,
  actions,
  className,
}: ListToolbarProps) {
  const t = useTranslations('list');
  const placeholder = searchPlaceholder ?? t('search');

  return (
    <div className={cn('flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center', className)}>
      {leading && <div className="w-full sm:w-auto">{leading}</div>}
      <div className="relative w-full sm:max-w-xs">
        <Search
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          aria-hidden
        />
        <Input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && search && onSearchClear()}
          placeholder={placeholder}
          aria-label={placeholder}
          className="h-11 pr-11 pl-9 text-base md:h-9 md:text-sm [&::-webkit-search-cancel-button]:hidden"
        />
        {search && (
          <Button
            variant="ghost"
            size="icon-touch"
            className="absolute top-0 right-0 md:size-9"
            onClick={onSearchClear}
            aria-label={t('clearSearch')}
          >
            <X aria-hidden />
          </Button>
        )}
      </div>
      {filters && <div className="flex flex-wrap items-center gap-2">{filters}</div>}
      {actions && <div className="flex items-center gap-2 sm:ml-auto">{actions}</div>}
    </div>
  );
}
