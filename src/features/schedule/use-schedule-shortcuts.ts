'use client';

import { useEffect, useRef } from 'react';

export type ScheduleShortcuts = {
  previous: () => void;
  next: () => void;
  today: () => void;
  create: () => void;
  week: () => void;
  day: () => void;
  agenda: () => void;
};

/** Keys (shown in tooltips): ←/→ previous/next, T today, N new, W/D/A switch view. */
export const SHORTCUT_KEYS = { previous: '←', next: '→', today: 'T', create: 'N', week: 'W', day: 'D', agenda: 'A' };

const KEY_ACTIONS: Record<string, keyof ScheduleShortcuts> = {
  ArrowLeft: 'previous',
  ArrowRight: 'next',
  t: 'today',
  n: 'create',
  w: 'week',
  d: 'day',
  a: 'agenda',
};

/** True while the user is typing or a dialog / menu / popover has focus — shortcuts must not fire then. */
function isBusy(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return true;
  return !!target.closest('[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"]');
}

/** Desktop keyboard shortcuts for the schedule page. Ignored while typing or with a modifier key. */
export function useScheduleShortcuts(handlers: ScheduleShortcuts, enabled: boolean) {
  const latest = useRef(handlers);
  useEffect(() => {
    latest.current = handlers;
  });

  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || isBusy(e.target)) return;
      // Arrow keys on a focused block belong to drag-and-drop, not to navigation.
      if (e.key.startsWith('Arrow') && e.target instanceof HTMLElement && e.target.closest('[data-movable]')) {
        return;
      }
      const action = KEY_ACTIONS[e.key.length === 1 ? e.key.toLowerCase() : e.key];
      if (!action) return;
      e.preventDefault();
      latest.current[action]();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled]);
}
