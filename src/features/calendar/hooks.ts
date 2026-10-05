'use client';

import { useQuery } from '@tanstack/react-query';

import { qk } from '@/lib/query-keys';
import * as api from '@/services/calendar/calendar-service';

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
