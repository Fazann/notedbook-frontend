/** Pages a signed-out user may open (paths without the locale prefix). */
export const PUBLIC_PATHS = ['/login', '/register', '/forgot-password'] as const;

/** Query param on /login holding the page to return to after logging in. */
export const NEXT_PARAM = 'next';

export function isPublicPath(path: string): boolean {
  const pathname = path.split(/[?#]/)[0];
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Returns `value` when it is a safe page to go back to after login: a same-site path (no `//host` or `\`)
 * that is not an auth page. Anything else gives `undefined`, so `?next=` cannot send the user to another site.
 */
export function safeRedirectPath(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return undefined;
  }
  if (value === '/' || isPublicPath(value)) return undefined;
  return value;
}
