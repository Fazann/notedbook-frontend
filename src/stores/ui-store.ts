import { create } from 'zustand';

import { currentMonth } from '@/lib/dates';

type UiState = {
  /** Month shown on the dashboard, `YYYY-MM`. */
  month: string;
  isQuickAddOpen: boolean;
  isSearchOpen: boolean;
  setMonth: (month: string) => void;
  openQuickAdd: () => void;
  closeQuickAdd: () => void;
  setSearchOpen: (open: boolean) => void;
  reset: () => void;
};

const initial = () => ({ month: currentMonth(), isQuickAddOpen: false, isSearchOpen: false });

export const useUiStore = create<UiState>()((set) => ({
  ...initial(),
  setMonth: (month) => set({ month }),
  openQuickAdd: () => set({ isQuickAddOpen: true }),
  closeQuickAdd: () => set({ isQuickAddOpen: false }),
  setSearchOpen: (isSearchOpen) => set({ isSearchOpen }),
  reset: () => set(initial()),
}));
