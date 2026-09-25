'use client';

import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { useCallback, useMemo } from 'react';

import { useFormatTime } from '@/hooks/use-format-time';
import { addDays, daysBetween } from '@/lib/time';

import type { Occurrence, Recurrence, Weekday } from './types';

/** A known Monday, to get weekday names from Intl. */
const REFERENCE_MONDAY = '2024-01-01';

/** Schedule-specific text: durations, day names, screen-reader block labels and repeat rules. */
export function useScheduleFormat() {
  const t = useTranslations('schedule');
  const format = useFormatter();
  const locale = useLocale();
  const formatTime = useFormatTime();

  /** 90 → "1 h 30 min" */
  const duration = useCallback(
    (minutes: number) => {
      const hours = Math.floor(minutes / 60);
      const rest = minutes % 60;
      if (hours && rest)
        return t('duration.hoursMinutes', { hours: format.number(hours), minutes: format.number(rest) });
      if (hours) return t('duration.hours', { hours: format.number(hours) });
      return t('duration.minutes', { minutes: format.number(rest) });
    },
    [t, format]
  );

  /** "Today", "Tomorrow", or "Thursday, 1 Oct". */
  const dayHeading = useCallback(
    (date: string, today: string) => {
      const diff = daysBetween(today, date);
      if (diff === 0) return t('today');
      if (diff === 1) return t('tomorrow');
      return formatTime.date(date, { weekday: 'long', day: 'numeric', month: 'short' });
    },
    [t, formatTime]
  );

  /** "Team stand-up meeting, Wednesday 30 September, 10:10 – 10:40 AM, repeats" */
  const blockLabel = useCallback(
    (o: Pick<Occurrence, 'title' | 'date' | 'startTime' | 'endTime' | 'isRecurring'>) =>
      t(o.isRecurring ? 'details.blockLabelRecurring' : 'details.blockLabel', {
        title: o.title,
        date: formatTime.date(o.date, { weekday: 'long', day: 'numeric', month: 'long' }),
        time: formatTime.timeRange(o.startTime, o.endTime),
      }),
    [t, formatTime]
  );

  /** "Every Tue and Thu until 31 Dec 2026" — the weekday list is built with Intl.ListFormat. */
  const repeatText = useCallback(
    (recurrence: Recurrence) => {
      if (recurrence.kind === 'none') return '';
      let rule: string;
      if (recurrence.kind === 'weekly') {
        const names = recurrence.days.map((day: Weekday) =>
          formatTime.date(addDays(REFERENCE_MONDAY, day - 1), { weekday: 'short' })
        );
        rule = t('repeatDescription.weekly', {
          days: new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' }).format(names),
        });
      } else {
        rule = t(`repeatDescription.${recurrence.kind}`);
      }
      return recurrence.until ? t('repeatDescription.until', { rule, date: formatTime.date(recurrence.until) }) : rule;
    },
    [t, locale, formatTime]
  );

  return useMemo(
    () => ({ ...formatTime, duration, dayHeading, blockLabel, repeatText }),
    [formatTime, duration, dayHeading, blockLabel, repeatText]
  );
}
