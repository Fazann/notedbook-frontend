'use client';

import { MapPin, Repeat } from 'lucide-react';
import { forwardRef } from 'react';

import { durationMinutes } from '@/lib/time';
import { cn } from '@/lib/utils';

import type { Occurrence } from '../types';
import { useScheduleFormat } from '../use-schedule-format';

import { ACTIVITY_TYPE_CLASSES } from './activity-type';

export type OccurrenceBlockProps = Omit<React.ComponentProps<'button'>, 'children'> & {
  occurrence: Occurrence;
  /** While dragging: the time it would move to, shown instead of its own. */
  previewTime?: { startTime: string; endTime: string; date?: string };
  isDragging?: boolean;
};

/**
 * The colored block in the time grid: type color (left border + soft background), title, time range, and location /
 * repeat icons. Blocks shorter than 45 min show title + start time on one line. Always a real button with a full label.
 */
export const OccurrenceBlock = forwardRef<HTMLButtonElement, OccurrenceBlockProps>(function OccurrenceBlock(
  { occurrence, previewTime, isDragging, className, ...props },
  ref
) {
  const { time, timeRange, blockLabel } = useScheduleFormat();
  const shown = previewTime ?? occurrence;
  // Under 45 minutes there is no room for two lines: title + start time on one line.
  const isShort = durationMinutes(occurrence.startTime, occurrence.endTime) < 45;

  return (
    <button
      ref={ref}
      type="button"
      aria-label={blockLabel(occurrence)}
      className={cn(
        'flex h-full w-full min-w-0 flex-col overflow-hidden rounded-md border-l-4 px-1.5 text-left text-xs',
        'focus-visible:ring-ring outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
        'hover:brightness-95 dark:hover:brightness-110',
        ACTIVITY_TYPE_CLASSES[occurrence.type].block,
        isShort ? 'justify-center py-0' : 'py-1',
        isDragging && 'z-30 shadow-lg ring-2 ring-primary',
        className
      )}
      {...props}
    >
      {isShort ? (
        <span className="flex min-w-0 items-baseline gap-1 leading-tight">
          <span className="truncate font-semibold">{occurrence.title}</span>
          <span className="shrink-0 tabular-nums opacity-80">{time(shown.startTime)}</span>
        </span>
      ) : (
        <>
          <span className="line-clamp-2 leading-tight font-semibold break-words">{occurrence.title}</span>
          <span className="truncate tabular-nums opacity-80">{timeRange(shown.startTime, shown.endTime)}</span>
          {(occurrence.location || occurrence.isRecurring) && (
            <span className="mt-auto flex min-w-0 items-center gap-1 opacity-80">
              {occurrence.isRecurring && <Repeat className="size-3 shrink-0" aria-hidden />}
              {occurrence.location && (
                <>
                  <MapPin className="size-3 shrink-0" aria-hidden />
                  <span className="truncate">{occurrence.location}</span>
                </>
              )}
            </span>
          )}
        </>
      )}
    </button>
  );
});
