'use client';

import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { ACTIVITY_TYPE_CLASSES } from '@/features/schedule/components/activity-type';
import type { Occurrence } from '@/features/schedule/types';
import { useFormatTime } from '@/hooks/use-format-time';
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
  /** The user's schedule by date (see `occurrencesByDate`), shown on every day of the grid. */
  schedule?: Map<string, Occurrence[]>;
  /** Accessible name of the table, e.g. "October 2026". */
  label: string;
  className?: string;
};

/** Activities listed in a cell on tablet+ before "+N more"; dots on phones. */
const MAX_CELL_ITEMS = 2;
const MAX_CELL_DOTS = 3;
const NO_SCHEDULE = new Map<string, Occurrence[]>();

/**
 * A read-only month: Gregorian day numbers, the Khmer lunar / Hijri date under each, holidays in red with a dot
 * (phones) or their name (tablet+), and the user's activities as colored dots (phones) or time + title (tablet+).
 * Every cell has a full text label for screen readers.
 */
export function MonthGrid({
  month,
  system,
  today,
  holidays,
  schedule = NO_SCHEDULE,
  label,
  className,
}: MonthGridProps) {
  const t = useTranslations('calendar');
  const format = useCalendarFormat();
  const formatTime = useFormatTime();
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
              const activities = schedule.get(day) ?? [];
              const hiddenCount = activities.length - MAX_CELL_ITEMS;
              const note = format.dayNote(day, system);
              const srLabel = [
                format.longDate(day),
                format.fullNote(day, system),
                isToday ? t('today') : null,
                ...names.map((name) => t('holidayLabel', { name })),
                activities.length > 0 ? t('scheduleCount', { count: activities.length }) : null,
                ...activities.map((o) =>
                  t('scheduleItem', { time: formatTime.timeRange(o.startTime, o.endTime), title: o.title })
                ),
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
                    {(names.length > 0 || activities.length > 0) && (
                      <span className="mt-auto flex flex-wrap justify-center gap-0.5 pt-0.5 md:hidden">
                        {names.length > 0 && <span className="bg-holiday size-1.5 rounded-full" />}
                        {activities.slice(0, MAX_CELL_DOTS).map((o) => (
                          <span
                            key={o.key}
                            className={cn('size-1.5 rounded-full', ACTIVITY_TYPE_CLASSES[o.type].dot)}
                          />
                        ))}
                      </span>
                    )}
                    {names.length > 0 && (
                      <span
                        className={cn(
                          'text-holiday hidden max-w-full text-xs leading-snug break-words',
                          'md:line-clamp-2'
                        )}
                      >
                        {names.join(', ')}
                      </span>
                    )}
                    {activities.length > 0 && (
                      <span className="hidden w-full min-w-0 flex-col gap-0.5 md:flex">
                        {activities.slice(0, MAX_CELL_ITEMS).map((o) => (
                          <span key={o.key} className="flex min-w-0 items-center gap-1 text-xs leading-snug">
                            <span className={cn('size-1.5 shrink-0 rounded-full', ACTIVITY_TYPE_CLASSES[o.type].dot)} />
                            <span className="truncate">
                              {t('scheduleItem', { time: formatTime.time(o.startTime), title: o.title })}
                            </span>
                          </span>
                        ))}
                        {hiddenCount > 0 && (
                          <span className="text-muted-foreground text-xs leading-snug">
                            {t('scheduleMore', { count: hiddenCount })}
                          </span>
                        )}
                      </span>
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
