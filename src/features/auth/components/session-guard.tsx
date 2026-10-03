'use client';

import { useEffect } from 'react';

import { usePathname } from '@/i18n/navigation';
import { isPublicPath } from '@/lib/auth-paths';
import { setUnauthorizedHandler } from '@/services/api-call';

import { useSignOut } from '../use-sign-out';

/**
 * Sends the user to /login when the API says the session is missing or over (no credentials, or the refresh
 * token was rejected), and brings them back to this page after logging in. Renders nothing.
 */
export function SessionGuard() {
  const signOut = useSignOut();
  const pathname = usePathname();

  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (isPublicPath(pathname)) return;
      // Keep the query string too (e.g. the selected month), read at the moment the session ends.
      signOut(`${pathname}${window.location.search}`);
    });
  }, [signOut, pathname]);

  return null;
}
