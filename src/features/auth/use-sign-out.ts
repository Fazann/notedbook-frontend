'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useRouter } from '@/i18n/navigation';
import { NEXT_PARAM, safeRedirectPath } from '@/lib/auth-paths';
import { logout } from '@/services/auth/auth-service';
import { usePreferencesStore } from '@/stores/preferences-store';
import { useUiStore } from '@/stores/ui-store';

/**
 * Forgets the session on this device, resets all client state and goes to /login.
 * `returnTo` (a path without the locale) is opened again after the next login.
 */
export function useSignOut() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useCallback(
    (returnTo?: string) => {
      logout();
      useUiStore.getState().reset();
      usePreferencesStore.getState().reset();
      queryClient.clear();
      const next = safeRedirectPath(returnTo);
      router.replace(next ? { pathname: '/login', query: { [NEXT_PARAM]: next } } : '/login');
    },
    [queryClient, router]
  );
}
