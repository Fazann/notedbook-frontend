'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { qk } from '@/lib/query-keys';
import * as api from '@/services/calendar/calendar-service';
import { listOccurrences } from '@/services/schedule/schedule-service';

import type { HolidayQuery } from './types';

/** Holidays of a whole year (cached, so moving between months of that year needs no request). `null` = none. */
export function useHolidays(query: HolidayQuery | null) {
  return useQuery({
    queryKey: query ? qk.calendar.holidays(query.year, query.country, query.kind) : qk.calendar.all,
    queryFn: () => (query ? api.listHolidays(query) : Promise.resolve([])),
    enabled: query !== null,
    // Holidays rarely change.
    staleTime: 60 * 60 * 1000,
  });
}

/**
 * The user's schedule between `from` and `to` (inclusive `YYYY-MM-DD`, the dates the grid shows — at most 42 days).
 * Shares the schedule module's query key, so adding / moving an activity there refreshes the calendar too.
 */
export function useScheduleOccurrences(from: string, to: string) {
  return useQuery({
    queryKey: qk.schedule.occurrences(from, to),
    queryFn: () => listOccurrences(from, to),
    placeholderData: keepPreviousData,
  });
}
