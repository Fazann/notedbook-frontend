import { format } from 'date-fns';
import type { DayPickerLocale } from 'react-day-picker';
import { enUS, km, ms } from 'react-day-picker/locale';

import type { Locale } from '@/i18n/routing';

const CALENDAR_LOCALES: Record<Locale, DayPickerLocale> = { en: enUS, km, ms };

/** The react-day-picker locale (month and weekday names) for an app locale. */
export function calendarLocale(locale: string): DayPickerLocale {
  return CALENDAR_LOCALES[locale as Locale] ?? enUS;
}

/**
 * A `YYYY-MM` month as "October 2026" (`long`) or "Oct 2026" (`short`) in the app locale.
 * Uses date-fns locale data instead of `Intl`: Chrome has no Khmer date data (it falls back to English) while Node
 * does, so `Intl` output would differ between the server render and the browser and break hydration.
 */
export function formatMonth(month: string, locale: string, style: 'long' | 'short' = 'long'): string {
  const [year, monthIndex] = month.split('-').map(Number);
  // A local date (not UTC) so date-fns never shifts it into the previous month.
  return format(new Date(year, monthIndex - 1, 1), style === 'long' ? 'LLLL yyyy' : 'LLL yyyy', {
    locale: calendarLocale(locale),
  });
}
