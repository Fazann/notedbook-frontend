import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { CalendarSystem, HolidayCountry } from '@/features/calendar/types';
import type { ScheduleView } from '@/features/schedule/types';

type PreferencesState = {
  isSidebarCollapsed: boolean;
  /** Last view chosen on the schedule page (the URL wins when it has one). */
  scheduleView: ScheduleView | null;
  /** Last calendar chosen on the calendar page and the country of its Hijri holidays (the URL wins). */
  calendarSystem: CalendarSystem | null;
  hijriRegion: HolidayCountry | null;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setScheduleView: (view: ScheduleView) => void;
  setCalendarSystem: (system: CalendarSystem) => void;
  setHijriRegion: (region: HolidayCountry) => void;
  reset: () => void;
};

const initial = {
  isSidebarCollapsed: false,
  scheduleView: null as ScheduleView | null,
  calendarSystem: null as CalendarSystem | null,
  hijriRegion: null as HolidayCountry | null,
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      ...initial,
      setSidebarCollapsed: (isSidebarCollapsed) => set({ isSidebarCollapsed }),
      setScheduleView: (scheduleView) => set({ scheduleView }),
      setCalendarSystem: (calendarSystem) => set({ calendarSystem }),
      setHijriRegion: (hijriRegion) => set({ hijriRegion }),
      reset: () => set(initial),
    }),
    {
      name: 'app-preferences-v1',
      version: 1,
      // Rehydrated from a client effect in <Providers> to avoid a server/client mismatch.
      skipHydration: true,
      // The currency settings live in the API (Settings → Currencies), not here. Older saved data may still hold a
      // `defaultCurrency`; it is ignored and dropped on the next save.
      partialize: ({ isSidebarCollapsed, scheduleView, calendarSystem, hijriRegion }) => ({
        isSidebarCollapsed,
        scheduleView,
        calendarSystem,
        hijriRegion,
      }),
    }
  )
);
