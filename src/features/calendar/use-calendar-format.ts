'use client';

import { format as formatDate } from 'date-fns';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback } from 'react';

import { calendarLocale } from '@/lib/calendar-locale';
import { parseDate } from '@/lib/dates';
import { addDays } from '@/lib/time';

import { HIJRI_MONTHS, hijriDate } from './hijri';
import { buddhistEraYear, khmerLunarDate } from './khmer-lunar';
import type { CalendarSystem, Holiday, HolidayRange } from './types';

/** Distinct values in first-seen order. */
const distinct = <T>(values: T[]) => [...new Set(values)];

/** All `YYYY-MM-DD` days of a `YYYY-MM` month. */
function daysOf(month: string): string[] {
  const days: string[] = [];
  for (let day = `${month}-01`; day.startsWith(month); day = addDays(day, 1)) days.push(day);
  return days;
}

/**
 * Calendar text: the Khmer lunar / Hijri date under each day, the lunar months a Gregorian month covers, holiday
 * names and dates. Dates are formatted with date-fns locale data (Chrome has no Khmer `Intl` data, see
 * `formatMonth`), so render them in the browser only.
 */
export function useCalendarFormat() {
  const t = useTranslations('calendar');
  const locale = useLocale();

  const hijriMonthName = useCallback((month: number) => t(`hijriMonths.${HIJRI_MONTHS[month - 1]}`), [t]);

  /** The short second date under a day: "9 Roach" / "24", or null on the international calendar. */
  const dayNote = useCallback(
    (date: string, system: CalendarSystem): string | null => {
      if (system === 'khmer') {
        const lunar = khmerLunarDate(date);
        return t('lunarDay', { day: lunar.day, phase: lunar.phase });
      }
      if (system === 'hijri') {
        const hijri = hijriDate(date);
        return hijri.day === 1 ? t('hijriDayMonth', { day: 1, month: hijriMonthName(hijri.month) }) : `${hijri.day}`;
      }
      return null;
    },
    [t, hijriMonthName]
  );

  /** The full second date, for screen readers and the holiday list: "9 Roach, Photrobot" / "24 Rabi' al-Thani 1448". */
  const fullNote = useCallback(
    (date: string, system: CalendarSystem): string | null => {
      if (system === 'khmer') {
        const lunar = khmerLunarDate(date);
        return t('lunarDate', { day: lunar.day, phase: lunar.phase, month: t(`lunarMonths.${lunar.month}`) });
      }
      if (system === 'hijri') {
        const hijri = hijriDate(date);
        return t('hijriDate', { day: hijri.day, month: hijriMonthName(hijri.month), year: hijri.year });
      }
      return null;
    },
    [t, hijriMonthName]
  );

  /** The lunar / Hijri months a Gregorian month covers: "Photrobot – Assuj · 2570 BE". */
  const monthNote = useCallback(
    (month: string, system: CalendarSystem): string | null => {
      const days = daysOf(month);
      if (system === 'khmer') {
        const months = distinct(days.map((d) => t(`lunarMonths.${khmerLunarDate(d).month}`)));
        const years = distinct(days.map(buddhistEraYear));
        return t('khmerMonthNote', { months: months.join(' – '), year: years.join('–') });
      }
      if (system === 'hijri') {
        const dates = days.map(hijriDate);
        const months = distinct(dates.map((d) => hijriMonthName(d.month)));
        const years = distinct(dates.map((d) => d.year));
        return t('hijriMonthNote', { months: months.join(' – '), year: years.join('–') });
      }
      return null;
    },
    [t, hijriMonthName]
  );

  /** Translated name for holidays the app knows, otherwise the name from the API. */
  const holidayName = useCallback(
    (holiday: Pick<Holiday, 'key' | 'name'>) =>
      holiday.key && t.has(`holidayNames.${holiday.key}`) ? t(`holidayNames.${holiday.key}`) : holiday.name,
    [t]
  );

  /** "Wed 14 Apr" or "14 – 16 Apr". */
  const holidayDates = useCallback(
    ({ from, to }: Pick<HolidayRange, 'from' | 'to'>) => {
      const options = { locale: calendarLocale(locale) };
      if (from === to) return formatDate(parseDate(from), 'EEE d MMM', options);
      return t('dateRange', {
        from: formatDate(parseDate(from), 'd', options),
        to: formatDate(parseDate(to), 'd MMM', options),
      });
    },
    [t, locale]
  );

  /** Weekday names for the grid header, Monday first: `short` "Mon", `narrow` "Mo". */
  const weekdays = useCallback(
    (week: string[]) =>
      week.map((day) => ({
        short: formatDate(parseDate(day), 'EEE', { locale: calendarLocale(locale) }),
        narrow: formatDate(parseDate(day), 'EEEEEE', { locale: calendarLocale(locale) }),
        long: formatDate(parseDate(day), 'EEEE', { locale: calendarLocale(locale) }),
      })),
    [locale]
  );

  /** "Monday, 5 October 2026" for screen readers. */
  const longDate = useCallback(
    (date: string) => formatDate(parseDate(date), 'EEEE, d MMMM yyyy', { locale: calendarLocale(locale) }),
    [locale]
  );

  return { dayNote, fullNote, monthNote, holidayName, holidayDates, weekdays, longDate };
}
