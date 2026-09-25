import { addMonths, format, parseISO } from 'date-fns';

/** Today as a plain `YYYY-MM-DD` date string (browser local time). */
export function todayIso(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/** Current month as `YYYY-MM`. */
export function currentMonth(): string {
  return format(new Date(), 'yyyy-MM');
}

/** Shifts a `YYYY-MM` month by `delta` months. */
export function shiftMonth(month: string, delta: number): string {
  return format(addMonths(parseISO(`${month}-01`), delta), 'yyyy-MM');
}

/** Parses a `YYYY-MM-DD` date string as a local date (for date-fns math; no timezone shift). */
export function parseDate(date: string): Date {
  return parseISO(date);
}

/**
 * Turns a plain `YYYY-MM-DD` (or `YYYY-MM`) into a Date at UTC midnight.
 * Format it with `{ timeZone: 'UTC' }` so the displayed day never shifts, whatever the browser timezone.
 */
export function utcDate(date: string): Date {
  const [y, m, d = '1'] = date.split('-');
  return new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
}
