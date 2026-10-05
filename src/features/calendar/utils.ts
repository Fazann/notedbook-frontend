import { addDays, startOfWeek } from '@/lib/time';

import type { CalendarSystem, Holiday, HolidayQuery, HolidayRange } from './types';

/**
 * The weeks shown for a `YYYY-MM` month: full weeks (Monday first) from the week of the 1st to the week of the last
 * day, so 4–6 rows of 7 `YYYY-MM-DD` dates. Days outside the month are included to fill the rows.
 */
export function monthWeeks(month: string): string[][] {
  const first = `${month}-01`;
  const weeks: string[][] = [];
  let day = startOfWeek(first);
  while (weeks.length === 0 || day.startsWith(month)) {
    weeks.push(Array.from({ length: 7 }, (_, i) => addDays(day, i)));
    day = addDays(day, 7);
  }
  return weeks;
}

/** Which holidays a calendar shows; the plain international calendar shows none. */
export function holidayQuery(system: CalendarSystem, region: HolidayQuery['country'], year: number) {
  if (system === 'khmer') return { year, country: 'KH', kind: 'national' } satisfies HolidayQuery;
  if (system === 'hijri') return { year, country: region, kind: 'islamic' } satisfies HolidayQuery;
  return null;
}

/** Holidays of one `YYYY-MM` month, multi-day ones merged into ranges, sorted by date. */
export function groupHolidays(holidays: Holiday[], month: string): HolidayRange[] {
  const ranges: HolidayRange[] = [];
  const sorted = holidays.filter((h) => h.date.startsWith(month)).sort((a, b) => a.date.localeCompare(b.date));
  for (const holiday of sorted) {
    const last = ranges.at(-1);
    if (last && last.key === holiday.key && last.name === holiday.name && addDays(last.to, 1) === holiday.date) {
      last.to = holiday.date;
    } else {
      ranges.push({ key: holiday.key, name: holiday.name, from: holiday.date, to: holiday.date });
    }
  }
  return ranges;
}

/** Holidays by date, to look up while drawing the grid (a day can have more than one). */
export function holidaysByDate(holidays: Holiday[]): Map<string, Holiday[]> {
  const map = new Map<string, Holiday[]>();
  for (const holiday of holidays) map.set(holiday.date, [...(map.get(holiday.date) ?? []), holiday]);
  return map;
}
