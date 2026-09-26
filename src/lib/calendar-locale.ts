import type { DayPickerLocale } from 'react-day-picker';
import { enUS, km, ms } from 'react-day-picker/locale';

import type { Locale } from '@/i18n/routing';

const CALENDAR_LOCALES: Record<Locale, DayPickerLocale> = { en: enUS, km, ms };

/** The react-day-picker locale (month and weekday names) for an app locale. */
export function calendarLocale(locale: string): DayPickerLocale {
  return CALENDAR_LOCALES[locale as Locale] ?? enUS;
}
