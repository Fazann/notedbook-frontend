import { z } from 'zod';

/** What is shown under each Gregorian day: nothing, the Khmer lunar date, or the Hijri date. */
export const CALENDAR_SYSTEMS = ['gregorian', 'khmer', 'hijri'] as const;
export type CalendarSystem = (typeof CALENDAR_SYSTEMS)[number];

/** Countries whose holidays the calendar can show. */
export const HOLIDAY_COUNTRIES = ['KH', 'MY'] as const;
export type HolidayCountry = (typeof HOLIDAY_COUNTRIES)[number];

/** `national` = public holidays of the country; `islamic` = Islamic holidays observed there. */
export type HolidayKind = 'national' | 'islamic';

export type HolidayQuery = { year: number; country: HolidayCountry; kind: HolidayKind };

export const holidaySchema = z.object({
  /** Plain date `YYYY-MM-DD`; a holiday over several days has one entry per day. */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  /** Stable key translated by the app (`calendar.holidays.<key>`); null for holidays the app has no text for. */
  key: z.string().nullable(),
  /** Name from the API, shown when there is no translation for `key`. */
  name: z.string(),
});
export type Holiday = z.infer<typeof holidaySchema>;

/** Consecutive days of the same holiday, merged for the list under the calendar. */
export type HolidayRange = Pick<Holiday, 'key' | 'name'> & { from: string; to: string };
