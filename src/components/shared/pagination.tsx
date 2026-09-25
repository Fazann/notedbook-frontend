'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useId } from 'react';

import { Button } from '@/components/ui/button';
import { getPageItems, PAGE_SIZE_OPTIONS, type PaginationMeta } from '@/lib/list';
import { cn } from '@/lib/utils';

import { OptionSelect } from './option-select';

export type PaginationProps = {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: readonly number[];
  disabled?: boolean;
  /** Scrolled into view (smoothly) after a page change — usually the top of the list. */
  scrollTargetRef?: React.RefObject<HTMLElement | null>;
  className?: string;
};

/**
 * Desktop: "Showing 11–20 of 47 · Rows per page [10] · ‹ Prev 1 … 4 5 6 … 12 Next ›".
 * Phone: "‹  Page 2 of 5  ›". Hidden when there are no items.
 */
export function Pagination({
  meta,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  disabled,
  scrollTargetRef,
  className,
}: PaginationProps) {
  const t = useTranslations('list.pagination');
  const format = useFormatter();
  const rowsLabelId = useId();
  const { page, pageSize, total, totalPages } = meta;

  if (total === 0) return null;

  const n = (value: number) => format.number(value);
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const goTo = (next: number) => {
    onPageChange(next);
    scrollTargetRef?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav aria-label={t('label')} className={cn('flex flex-wrap items-center gap-x-6 gap-y-2', className)}>
      <p className="text-muted-foreground hidden text-sm md:block">
        {t('showing', { from: n(from), to: n(to), total: n(total) })}
      </p>

      {onPageSizeChange && (
        <div className="hidden items-center gap-2 md:ml-auto md:flex">
          <span className="text-muted-foreground text-sm" id={rowsLabelId}>
            {t('rowsPerPage')}
          </span>
          <OptionSelect
            options={pageSizeOptions.map((size) => ({ value: String(size), label: n(size) }))}
            value={String(pageSize)}
            onValueChange={(v) => onPageSizeChange(Number(v))}
            disabled={disabled}
            aria-labelledby={rowsLabelId}
            className="w-20 md:h-9"
          />
        </div>
      )}

      <div
        className={cn('flex w-full items-center justify-between gap-1 md:w-auto', !onPageSizeChange && 'md:ml-auto')}
      >
        <Button
          variant="ghost"
          size="touch"
          onClick={() => goTo(page - 1)}
          disabled={disabled || page <= 1}
          aria-label={t('previous')}
        >
          <ChevronLeft aria-hidden />
          <span className="hidden md:inline">{t('previous')}</span>
        </Button>

        <p className="text-muted-foreground text-sm md:hidden" aria-live="polite">
          {t('pageOf', { page: n(page), totalPages: n(totalPages) })}
        </p>

        {totalPages > 1 && (
          <ul className="hidden items-center gap-1 md:flex">
            {getPageItems(page, totalPages).map((item, i) =>
              item === 'ellipsis' ? (
                <li key={`ellipsis-${i}`} className="text-muted-foreground w-6 text-center" aria-hidden>
                  …
                </li>
              ) : (
                <li key={item}>
                  <Button
                    variant={item === page ? 'outline' : 'ghost'}
                    size="icon-touch"
                    onClick={() => goTo(item)}
                    disabled={disabled}
                    aria-current={item === page ? 'page' : undefined}
                    aria-label={t('goToPage', { page: n(item) })}
                  >
                    {n(item)}
                  </Button>
                </li>
              )
            )}
          </ul>
        )}

        <Button
          variant="ghost"
          size="touch"
          onClick={() => goTo(page + 1)}
          disabled={disabled || page >= totalPages}
          aria-label={t('next')}
        >
          <span className="hidden md:inline">{t('next')}</span>
          <ChevronRight aria-hidden />
        </Button>
      </div>
    </nav>
  );
}
