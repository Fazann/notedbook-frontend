'use client';

import { useFormatter, type DateTimeFormatOptions } from 'next-intl';
import { useCallback, useMemo } from 'react';

import { toZonedDateTime } from '@/lib/time';

const TIME: DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
/** Any date works for formatting a time of day. */
const ANY_DAY = '2000-01-03';

/**
 * Locale-aware formatting of wall-clock times (`HH:mm`) and dates (`YYYY-MM-DD`) in the app timezone:
 * `en` "10:10 AM", "10:10 – 10:40 AM"; `km` uses the Khmer format. Never build these strings by hand.
 */
export function useFormatTime() {
  const format = useFormatter();

  const time = useCallback((value: string) => format.dateTime(toZonedDateTime(ANY_DAY, value), TIME), [format]);

  /** "6 AM" / Khmer equivalent — hour labels of a time grid. */
  const hour = useCallback(
    (value: string) => format.dateTime(toZonedDateTime(ANY_DAY, value), { hour: 'numeric' }),
    [format]
  );

  const timeRange = useCallback(
    (start: string, end: string) =>
      format.dateTimeRange(toZonedDateTime(ANY_DAY, start), toZonedDateTime(ANY_DAY, end), TIME),
    [format]
  );

  const date = useCallback(
    (value: string, options: DateTimeFormatOptions = { dateStyle: 'medium' }) =>
      format.dateTime(toZonedDateTime(value), options),
    [format]
  );

  const dateRange = useCallback(
    (from: string, to: string, options: DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) =>
      format.dateTimeRange(toZonedDateTime(from), toZonedDateTime(to), options),
    [format]
  );

  return useMemo(() => ({ time, hour, timeRange, date, dateRange }), [time, hour, timeRange, date, dateRange]);
}
