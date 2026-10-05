'use client';

import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { cn } from '@/lib/utils';

import type { CalendarSystem, Holiday } from '../types';
import { useCalendarFormat } from '../use-calendar-format';
import { monthWeeks } from '../utils';

export type MonthGridProps = {
  /** `YYYY-MM` */
  month: string;
  system: CalendarSystem;
  /** `YYYY-MM-DD` */
  today: string;
  /** Holidays by date (see `holidaysByDate`); days in it are marked red. */
  holidays: Map<string, Holiday[]>;
  /** Accessible name of the table, e.g. "October 2026". */
  label: string;
  className?: string;
};

/**
 * A read-only month: Gregorian day numbers, the Khmer lunar / Hijri date under each, holidays in red with a dot
 * (phones) or their name (tablet+). Every cell has a full text label for screen readers.
 */
export function MonthGrid({ month, system, today, holidays, label, className }: MonthGridProps) {
  const t = useTranslations('calendar');
  const format = useCalendarFormat();
  const weeks = useMemo(() => monthWeeks(month), [month]);
  const weekdays = format.weekdays(weeks[0]);

  return (
    <table className={cn('w-full table-fixed border-collapse', className)}>
      <caption className="sr-only">{label}</caption>
      <thead>
        <tr>
          {weekdays.map((w) => (
            <th key={w.long} scope="col" className="text-muted-foreground py-2 text-xs font-medium">
              <abbr title={w.long} className="no-underline">
                <span className="md:hidden">{w.narrow}</span>
                <span className="hidden md:inline">{w.short}</span>
              </abbr>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {weeks.map((week) => (
          <tr key={week[0]}>
            {week.map((day) => {
              const inMonth = day.startsWith(month);
              const isToday = day === today;
              const dayHolidays = inMonth ? (holidays.get(day) ?? []) : [];
              const names = dayHolidays.map(format.holidayName);
              const note = format.dayNote(day, system);
              const srLabel = [
                format.longDate(day),
                format.fullNote(day, system),
                isToday ? t('today') : null,
                ...names.map((name) => t('holidayLabel', { name })),
              ]
                .filter(Boolean)
                .join(', ');

              return (
                <td
                  key={day}
                  aria-current={isToday ? 'date' : undefined}
                  className={cn('border-border border-t p-0 align-top', dayHolidays.length > 0 && 'bg-holiday/10')}
                >
                  <div
                    aria-hidden
                    className={cn(
                      'flex min-h-16 flex-col items-center gap-0.5 px-0.5 py-1 md:min-h-24 md:items-start md:p-2',
                      !inMonth && 'opacity-40'
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-7 shrink-0 items-center justify-center rounded-full text-sm tabular-nums',
                        dayHolidays.length > 0 && 'text-holiday font-semibold',
                        isToday && 'bg-primary text-primary-foreground font-semibold'
                      )}
                    >
                      {Number(day.slice(8))}
                    </span>
                    {note && (
                      <span
                        className={cn(
                          'text-muted-foreground max-w-full text-center text-[10px] leading-snug break-words',
                          'md:text-left md:text-xs'
                        )}
                      >
                        {note}
                      </span>
                    )}
                    {names.length > 0 && (
                      <>
                        <span className="bg-holiday mt-auto size-1.5 rounded-full md:hidden" />
                        <span
                          className={cn(
                            'text-holiday hidden max-w-full text-xs leading-snug break-words',
                            'md:line-clamp-2'
                          )}
                        >
                          {names.join(', ')}
                        </span>
                      </>
                    )}
                  </div>
                  <span className="sr-only">{srLabel}</span>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
