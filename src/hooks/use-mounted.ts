'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/** `false` during server render and hydration, `true` after. Use for values that differ per client (time, storage). */
export function useMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
