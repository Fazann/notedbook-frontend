'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

import { usePathname, useRouter } from '@/i18n/navigation';
import { usePreferencesStore } from '@/stores/preferences-store';

import { CALENDAR_SYSTEMS, type CalendarSystem, HOLIDAY_COUNTRIES, type HolidayCountry } from './types';

const isSystem = (value: string | null): value is CalendarSystem => CALENDAR_SYSTEMS.includes(value as CalendarSystem);
const isRegion = (value: string | null): value is HolidayCountry => HOLIDAY_COUNTRIES.includes(value as HolidayCountry);
const isMonth = (value: string | null): value is string => !!value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);

type Patch = { system?: CalendarSystem; region?: HolidayCountry; month?: string };

/**
 * `?system=gregorian|khmer|hijri&region=KH|MY&month=YYYY-MM` in the URL (shareable, back button works).
 * The URL wins; otherwise the last choice (preferences), otherwise the international calendar, Cambodia and
 * `currentMonth`.
 */
export function useCalendarParams(currentMonth: string) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const savedSystem = usePreferencesStore((s) => s.calendarSystem);
  const savedRegion = usePreferencesStore((s) => s.hijriRegion);
  const saveSystem = usePreferencesStore((s) => s.setCalendarSystem);
  const saveRegion = usePreferencesStore((s) => s.setHijriRegion);

  const urlSystem = searchParams.get('system');
  const urlRegion = searchParams.get('region');
  const urlMonth = searchParams.get('month');
  const system = isSystem(urlSystem) ? urlSystem : (savedSystem ?? 'gregorian');
  const region = isRegion(urlRegion) ? urlRegion : (savedRegion ?? 'KH');
  const month = isMonth(urlMonth) ? urlMonth : currentMonth;

  const update = useCallback(
    (patch: Patch) => {
      const query = new URLSearchParams(window.location.search);
      if (patch.system) query.set('system', patch.system);
      if (patch.region) query.set('region', patch.region);
      if (patch.month !== undefined) {
        if (patch.month === currentMonth) query.delete('month');
        else query.set('month', patch.month);
      }
      router.replace({ pathname, query: Object.fromEntries(query) }, { scroll: false });
    },
    [router, pathname, currentMonth]
  );

  const setSystem = useCallback(
    (next: CalendarSystem) => {
      saveSystem(next);
      update({ system: next });
    },
    [saveSystem, update]
  );
  const setRegion = useCallback(
    (next: HolidayCountry) => {
      saveRegion(next);
      update({ region: next });
    },
    [saveRegion, update]
  );
  const setMonth = useCallback((next: string) => update({ month: next }), [update]);

  return { system, region, month, setSystem, setRegion, setMonth };
}
