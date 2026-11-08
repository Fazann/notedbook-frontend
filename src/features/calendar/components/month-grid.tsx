'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef } from 'react';

import { ACTIVITY_TYPE_CLASSES } from '@/features/schedule/components/activity-type';
import type { Occurrence } from '@/features/schedule/types';
import { useFormatTime } from '@/hooks/use-format-time';
import { addDays, isoWeekday } from '@/lib/time';
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
  /** The picked `YYYY-MM-DD`; it is highlighted and is the one day reachable with Tab (arrow keys move it). */
  selected?: string;
  /** Called with a day the user clicks or moves to with the arrow keys (may be outside `month`). */
  onSelect?: (date: string) => void;
  /** Accessible name of the table, e.g. "October 2026". */
  label: string;
  className?: string;
};

/** Activities listed in a cell on tablet+ before "+N more"; dots on phones. */
const MAX_CELL_ITEMS = 2;
const MAX_CELL_DOTS = 3;
const NO_SCHEDULE = new Map<string, Occurrence[]>();

/** Arrow keys move a day / a week; Home / End go to the start / end of the week. */
const KEY_MOVES: Record<string, (date: string) => string> = {
  ArrowLeft: (d) => addDays(d, -1),
  ArrowRight: (d) => addDays(d, 1),
  ArrowUp: (d) => addDays(d, -7),
  ArrowDown: (d) => addDays(d, 7),
  Home: (d) => addDays(d, 1 - isoWeekday(d)),
  End: (d) => addDays(d, 7 - isoWeekday(d)),
};

const isWeekend = (date: string) => isoWeekday(date) >= 6;

/**
 * A month: Gregorian day numbers, the Khmer lunar / Hijri date beside each, holidays in red with a dot (phones) or
 * their name (tablet+), and the user's activities as colored dots (phones) or colored chips (tablet+).
 * Every day is a button that picks it; arrow keys move between days.
 * Each cell has a full text label for screen readers.
 */
export function MonthGrid({
  month,
  system,
  today,
  holidays,
  schedule = NO_SCHEDULE,
  selected,
  onSelect,
  label,
  className,
}: MonthGridProps) {
  const t = useTranslations('calendar');
  const format = useCalendarFormat();
  const formatTime = useFormatTime();
  const weeks = useMemo(() => monthWeeks(month), [month]);
  const weekdays = format.weekdays(weeks[0]);
  const tableRef = useRef<HTMLTableElement>(null);
  // Set by the arrow keys so focus follows the new day, even after the month changes and the grid re-renders.
  const focusPending = useRef(false);
  // Only one day is in the Tab order: the picked one, else today, else the 1st.
  const focusable = [selected, today, `${month}-01`].find((d) => d && weeks.some((w) => w.includes(d)));

  useEffect(() => {
    if (!focusPending.current || !selected) return;
    focusPending.current = false;
    tableRef.current?.querySelector<HTMLButtonElement>(`button[data-date="${selected}"]`)?.focus();
  }, [selected, month]);

  const onKeyDown = (event: React.KeyboardEvent, day: string) => {
    const move = KEY_MOVES[event.key];
    if (!move || !onSelect) return;
    event.preventDefault();
    focusPending.current = true;
    onSelect(move(day));
  };

  return (
    <table ref={tableRef} className={cn('w-full table-fixed border-collapse', className)}>
      <caption className="sr-only">{label}</caption>
      <thead className="bg-muted/50">
        <tr>
          {weekdays.map((w, i) => (
            <th
              key={w.long}
              scope="col"
              className={cn('py-2 text-xs font-medium', i >= 5 ? 'text-muted-foreground/70' : 'text-muted-foreground')}
            >
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
              const isSelected = day === selected;
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
                  className={cn(
                    'border-border h-px border-t border-l p-0 align-top first:border-l-0',
                    isWeekend(day) && 'bg-muted/30',
                    !inMonth && 'bg-muted/50',
                    dayHolidays.length > 0 && 'bg-holiday/10'
                  )}
                >
                  <button
                    type="button"
                    data-date={day}
                    tabIndex={day === focusable ? 0 : -1}
                    aria-pressed={onSelect ? isSelected : undefined}
                    disabled={!onSelect}
                    onClick={() => onSelect?.(day)}
                    onKeyDown={(event) => onKeyDown(event, day)}
                    className={cn(
                      'flex size-full min-h-16 flex-col items-center gap-0.5 px-0.5 py-1 text-left transition-colors',
                      'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                      'enabled:hover:bg-accent/60 disabled:cursor-default',
                      'md:min-h-28 md:items-stretch md:gap-1 md:p-1.5',
                      isSelected && 'bg-primary/5 ring-primary ring-2 ring-inset enabled:hover:bg-primary/10'
                    )}
                  >
                    <span aria-hidden className="flex w-full flex-col items-center gap-0.5 md:flex-row md:items-start">
                      <span
                        className={cn(
                          'flex size-7 shrink-0 items-center justify-center rounded-full text-sm tabular-nums',
                          !inMonth && 'text-muted-foreground',
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
                            'md:ml-auto md:pt-1 md:text-right md:text-xs'
                          )}
                        >
                          {note}
                        </span>
                      )}
                    </span>
                    {(names.length > 0 || activities.length > 0) && (
                      <span aria-hidden className="mt-auto flex flex-wrap justify-center gap-0.5 pt-0.5 md:hidden">
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
                        aria-hidden
                        className={cn(
                          'bg-holiday/15 text-holiday hidden rounded-sm px-1.5 py-0.5 text-xs leading-snug font-medium',
                          'break-words md:line-clamp-2'
                        )}
                      >
                        {names.join(', ')}
                      </span>
                    )}
                    {activities.length > 0 && (
                      <span aria-hidden className="hidden w-full min-w-0 flex-col gap-0.5 md:flex">
                        {activities.slice(0, MAX_CELL_ITEMS).map((o) => (
                          <span
                            key={o.key}
                            className={cn(
                              'truncate rounded-sm border-l-2 px-1.5 py-0.5 text-xs leading-snug',
                              ACTIVITY_TYPE_CLASSES[o.type].block
                            )}
                          >
                            {t('scheduleItem', { time: formatTime.time(o.startTime), title: o.title })}
                          </span>
                        ))}
                        {hiddenCount > 0 && (
                          <span className="text-muted-foreground px-1.5 text-xs leading-snug font-medium">
                            {t('scheduleMore', { count: hiddenCount })}
                          </span>
                        )}
                      </span>
                    )}
                    <span className="sr-only">{srLabel}</span>
                  </button>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
