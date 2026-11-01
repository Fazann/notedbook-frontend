import { z } from 'zod';

import { type Holiday, type HolidayQuery, holidaySchema } from '@/features/calendar/types';

import { apiCall } from '../core/api-call';
import { ApiEndpoint } from '../core/api-endpoints';

/** Holidays of one year for a country, one entry per day. */
export async function listHolidays(query: HolidayQuery): Promise<Holiday[]> {
  return z.array(holidaySchema).parse(await apiCall.get(ApiEndpoint.Holidays, query));
}
