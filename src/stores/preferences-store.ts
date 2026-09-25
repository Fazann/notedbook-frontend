import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { ScheduleView } from '@/features/schedule/types';
import type { Currency } from '@/lib/money';

type PreferencesState = {
  isSidebarCollapsed: boolean;
  defaultCurrency: Currency;
  /** Last view chosen on the schedule page (the URL wins when it has one). */
  scheduleView: ScheduleView | null;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setDefaultCurrency: (currency: Currency) => void;
  setScheduleView: (view: ScheduleView) => void;
  reset: () => void;
};

const initial = {
  isSidebarCollapsed: false,
  defaultCurrency: 'USD' as Currency,
  scheduleView: null as ScheduleView | null,
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      ...initial,
      setSidebarCollapsed: (isSidebarCollapsed) => set({ isSidebarCollapsed }),
      setDefaultCurrency: (defaultCurrency) => set({ defaultCurrency }),
      setScheduleView: (scheduleView) => set({ scheduleView }),
      reset: () => set(initial),
    }),
    {
      name: 'app-preferences-v1',
      version: 1,
      // Rehydrated from a client effect in <Providers> to avoid a server/client mismatch.
      skipHydration: true,
      partialize: ({ isSidebarCollapsed, defaultCurrency, scheduleView }) => ({
        isSidebarCollapsed,
        defaultCurrency,
        scheduleView,
      }),
    }
  )
);
