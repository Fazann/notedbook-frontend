'use client';

import { CalendarCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { SectionCard } from '@/components/shared/section-card';
import { Skeleton } from '@/components/ui/skeleton';

import type { CalendarSystem, HolidayRange } from '../types';
import { useCalendarFormat } from '../use-calendar-format';

export type HolidayListProps = {
  title: string;
  /** The month's holidays, merged into ranges; undefined while loading. */
  holidays: HolidayRange[] | undefined;
  system: CalendarSystem;
  isError: boolean;
  onRetry: () => void;
};

/** The holidays of the shown month, under the calendar: dates · name · lunar / Hijri date. */
export function HolidayList({ title, holidays, system, isError, onRetry }: HolidayListProps) {
  const t = useTranslations('calendar.holidays');
  const format = useCalendarFormat();

  const renderContent = () => {
    if (isError) return <ErrorState message={t('loadError')} onRetry={onRetry} />;
    if (!holidays) {
      return (
        <ul aria-busy className="divide-border divide-y">
          {Array.from({ length: 3 }, (_, i) => (
            <li key={i} className="flex items-center gap-3 py-3">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 flex-1" />
            </li>
          ))}
        </ul>
      );
    }
    if (holidays.length === 0) {
      return <EmptyState icon={<CalendarCheck aria-hidden />} title={t('empty')} className="py-6" />;
    }
    return (
      <ul className="divide-border divide-y">
        {holidays.map((holiday) => (
          <li key={`${holiday.from}-${holiday.key ?? holiday.name}`} className="flex items-start gap-3 py-3">
            <span className="text-holiday w-24 shrink-0 pt-0.5 text-sm font-semibold tabular-nums">
              {format.holidayDates(holiday)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="leading-relaxed font-medium break-words">{format.holidayName(holiday)}</p>
              <p className="text-muted-foreground text-sm leading-relaxed break-words">
                {format.fullNote(holiday.from, system)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <SectionCard title={title} description={t('note')}>
      {renderContent()}
    </SectionCard>
  );
}
