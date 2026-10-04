/** Pages a signed-out user may open (paths without the locale prefix): auth pages and the help center. */
export const PUBLIC_PATHS = ['/login', '/register', '/forgot-password', '/help'] as const;

/** Pages only for signed-out users: a signed-in user who opens one goes to the app instead. */
export const GUEST_ONLY_PATHS = ['/login', '/register'] as const;

/** Query param on /login holding the page to return to after logging in. */
export const NEXT_PARAM = 'next';

export function isPublicPath(path: string): boolean {
  const pathname = path.split(/[?#]/)[0];
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function isGuestOnlyPath(path: string): boolean {
  const pathname = path.split(/[?#]/)[0];
  return GUEST_ONLY_PATHS.some((p) => pathname === p);
}

/**
 * Returns `value` when it is a safe page to go back to after login: a same-site path (no `//host` or `\`)
 * that is not a public page (auth or help). Anything else gives `undefined`, so `?next=` cannot send the user
 * to another site.
 */
export function safeRedirectPath(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return undefined;
  }
  if (value === '/' || isPublicPath(value)) return undefined;
  return value;
}
