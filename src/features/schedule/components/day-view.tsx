'use client';

import { useTranslations } from 'next-intl';
import { useRef } from 'react';

import { addDays, weekDays } from '@/lib/time';
import { cn } from '@/lib/utils';

import { useScheduleFormat } from '../use-schedule-format';
import { summarize } from '../utils';

import { TimeGrid } from './time-grid';
import type { GridViewProps } from './week-view';

export type DayViewProps = GridViewProps & {
  date: string;
  weekStart: string;
  onDateChange: (date: string) => void;
};

/** One day: a week strip to switch days (dots mark days with activities), planned time, and the time grid. */
export function DayView({ date, weekStart, onDateChange, occurrences, ...props }: DayViewProps) {
  const t = useTranslations('schedule');
  const format = useScheduleFormat();
  const touch = useRef<{ x: number; y: number } | null>(null);
  const dayOccurrences = (occurrences ?? []).filter((o) => o.date === date);
  const busyDays = new Set(occurrences?.map((o) => o.date));
  const planned = summarize(dayOccurrences).totalMinutes;

  return (
    <div className="space-y-3">
      <ul className="grid grid-cols-7 gap-1" aria-label={t('weekStrip')}>
        {weekDays(weekStart).map((day) => {
          const selected = day === date;
          return (
            <li key={day}>
              <button
                type="button"
                onClick={() => onDateChange(day)}
                aria-pressed={selected}
                aria-current={day === props.today ? 'date' : undefined}
                aria-label={format.date(day, { weekday: 'long', day: 'numeric', month: 'long' })}
                className={cn(
                  'flex min-h-14 w-full flex-col items-center justify-center gap-0.5 rounded-lg text-xs',
                  'focus-visible:ring-ring/50 outline-none focus-visible:ring-3',
                  selected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                  !selected && day === props.today && 'text-primary font-semibold'
                )}
              >
                <span>{format.date(day, { weekday: 'narrow' })}</span>
                <span className="text-sm font-semibold tabular-nums">{format.date(day, { day: 'numeric' })}</span>
                <span
                  className={cn(
                    'size-1 rounded-full',
                    busyDays.has(day) ? (selected ? 'bg-primary-foreground' : 'bg-primary') : 'bg-transparent'
                  )}
                  aria-hidden
                />
              </button>
            </li>
          );
        })}
      </ul>

      <p className="text-muted-foreground flex gap-2 text-sm">
        <span>{date === props.today ? t('summary.plannedToday') : t('summary.planned')}</span>
        <span className="text-foreground font-medium">{format.duration(planned)}</span>
      </p>

      <div
        // Swipe left / right on the grid changes the day (the ‹ › buttons are the accessible way).
        onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
        onTouchEnd={(e) => {
          const start = touch.current;
          touch.current = null;
          if (!start) return;
          const dx = e.changedTouches[0].clientX - start.x;
          const dy = e.changedTouches[0].clientY - start.y;
          if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) onDateChange(addDays(date, dx < 0 ? 1 : -1));
        }}
      >
        <TimeGrid
          days={[date]}
          occurrences={dayOccurrences}
          showDayHeader={false}
          emptyHint={t('empty.day')}
          className="max-h-[calc(100dvh-20rem)] min-h-80"
          {...props}
        />
      </div>
    </div>
  );
}
