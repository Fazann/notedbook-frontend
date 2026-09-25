'use client';

import { useTranslations } from 'next-intl';

import { weekDays } from '@/lib/time';

import type { Occurrence } from '../types';

import { TimeGrid } from './time-grid';

export type GridViewProps = {
  occurrences: Occurrence[] | undefined;
  isLoading: boolean;
  isFetching: boolean;
  today: string;
  nowMinutes: number;
  onSlotClick: (date: string, time: string) => void;
  onOccurrenceClick: (occurrence: Occurrence, anchor: HTMLElement) => void;
  /** Drag to move; left out on touch devices. */
  onMove?: (occurrence: Occurrence, date: string, startTime: string) => void;
};

export type WeekViewProps = GridViewProps & { weekStart: string };

/** Seven day columns, Monday first (md+). */
export function WeekView({ weekStart, occurrences, ...props }: WeekViewProps) {
  const t = useTranslations('schedule');
  return (
    <TimeGrid
      days={weekDays(weekStart)}
      occurrences={occurrences ?? []}
      emptyHint={t('empty.week')}
      className="max-h-[calc(100dvh-14rem)] min-h-96"
      {...props}
    />
  );
}
