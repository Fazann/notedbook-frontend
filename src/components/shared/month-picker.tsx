'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { formatMonth } from '@/lib/calendar-locale';
import { shiftMonth } from '@/lib/dates';
import { cn } from '@/lib/utils';

export type MonthPickerProps = Omit<React.ComponentProps<'div'>, 'onChange'> & {
  /** `YYYY-MM` */
  value: string;
  onChange: (month: string) => void;
  /** Latest month that can be picked, `YYYY-MM`. */
  max?: string;
};

export function MonthPicker({ value, onChange, max, className, ...props }: MonthPickerProps) {
  const t = useTranslations('monthPicker');
  const locale = useLocale();
  const label = formatMonth(value, locale, 'short');

  return (
    <div className={cn('bg-card flex items-center rounded-lg border', className)} {...props}>
      <Button
        variant="ghost"
        size="icon-touch"
        onClick={() => onChange(shiftMonth(value, -1))}
        aria-label={t('previous')}
      >
        <ChevronLeft aria-hidden />
      </Button>
      <span className="min-w-24 flex-1 text-center text-sm font-medium tabular-nums" aria-live="polite">
        {label}
      </span>
      <Button
        variant="ghost"
        size="icon-touch"
        onClick={() => onChange(shiftMonth(value, 1))}
        disabled={max !== undefined && value >= max}
        aria-label={t('next')}
      >
        <ChevronRight aria-hidden />
      </Button>
    </div>
  );
}
