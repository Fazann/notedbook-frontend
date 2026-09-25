'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

import { useMediaQuery } from '@/hooks/use-media-query';
import { usePathname, useRouter } from '@/i18n/navigation';
import { usePreferencesStore } from '@/stores/preferences-store';

import { SCHEDULE_VIEWS, type ScheduleView } from './types';

const isView = (value: string | null): value is ScheduleView => SCHEDULE_VIEWS.includes(value as ScheduleView);
const isDate = (value: string | null): value is string =>
  !!value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));

/**
 * `?view=week|day|agenda&date=YYYY-MM-DD` in the URL (shareable, back button works). The URL wins; otherwise the last
 * chosen view (preferences), otherwise week on desktop / day on phones. Phones never show the week grid (too narrow).
 * `date` is any day of the shown week / day; default today.
 */
export function useScheduleParams(today: string) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const savedView = usePreferencesStore((s) => s.scheduleView);
  const saveView = usePreferencesStore((s) => s.setScheduleView);

  const urlView = searchParams.get('view');
  const urlDate = searchParams.get('date');
  let view: ScheduleView = isView(urlView) ? urlView : (savedView ?? (isDesktop ? 'week' : 'day'));
  if (view === 'week' && !isDesktop) view = 'day';
  const date = isDate(urlDate) ? urlDate : today;

  const update = useCallback(
    (patch: { view?: ScheduleView; date?: string }) => {
      const query = new URLSearchParams(window.location.search);
      if (patch.view) query.set('view', patch.view);
      if (patch.date !== undefined) {
        if (patch.date === today) query.delete('date');
        else query.set('date', patch.date);
      }
      router.replace({ pathname, query: Object.fromEntries(query) }, { scroll: false });
    },
    [router, pathname, today]
  );

  const setView = useCallback(
    (next: ScheduleView) => {
      saveView(next);
      update({ view: next });
    },
    [saveView, update]
  );
  const setDate = useCallback((next: string) => update({ date: next }), [update]);

  return { view, date, isDesktop, setView, setDate };
}
