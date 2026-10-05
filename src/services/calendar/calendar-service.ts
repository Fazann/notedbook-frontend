import { z } from 'zod';

import { type Holiday, type HolidayQuery, holidaySchema } from '@/features/calendar/types';
import { isMocked } from '@/lib/env';
import * as mock from '@/mocks/handlers/calendar';

import { apiCall } from '../core/api-call';
import { ApiEndpoint } from '../core/api-endpoints';

/** Holidays of one year for a country, one entry per day. */
export async function listHolidays(query: HolidayQuery): Promise<Holiday[]> {
  if (isMocked('calendar')) return mock.listHolidays(query);
  // TODO(api): the backend has no holiday route yet; expected GET /holidays?year=2026&country=KH&kind=national.
  return z.array(holidaySchema).parse(await apiCall.get(ApiEndpoint.Holidays, query));
}
