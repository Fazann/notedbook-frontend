import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';

import { isGuestOnlyPath, isPublicPath, NEXT_PARAM, safeRedirectPath } from '@/lib/auth-paths';
import { isMocked } from '@/lib/env';
import { REFRESH_TOKEN_COOKIE } from '@/services/core/token-store';

import { type Locale, routing } from './i18n/routing';

const intl = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  // Optimistic check only: no refresh-token cookie means no session. The API still checks every request,
  // and an invalid cookie is cleared by apiCall, which then sends the user to /login.
  if (!isMocked('auth')) {
    const [, first = '', ...rest] = request.nextUrl.pathname.split('/');
    const locale = routing.locales.includes(first as Locale) ? first : undefined;
    const path = `/${(locale ? rest : [first, ...rest]).join('/')}`;
    const signedIn = request.cookies.has(REFRESH_TOKEN_COOKIE);
    if (signedIn && isGuestOnlyPath(path)) {
      // Already signed in (e.g. Back after logging in): open the app instead of the login / register form.
      const target = safeRedirectPath(request.nextUrl.searchParams.get(NEXT_PARAM)) ?? '/dashboard';
      return NextResponse.redirect(new URL(locale ? `/${locale}${target}` : target, request.url));
    }
    if (!signedIn && !isPublicPath(path)) {
      // Without a locale, next-intl picks one on the /login request.
      const login = new URL(locale ? `/${locale}/login` : '/login', request.url);
      // Come back to this page after logging in (path without the locale, so the chosen language is kept).
      if (path !== '/') login.searchParams.set(NEXT_PARAM, `${path}${request.nextUrl.search}`);
      return NextResponse.redirect(login);
    }
  }
  return intl(request);
}

export const config = {
  // Skip Next internals, API routes and files with an extension (images, favicon...).
  matcher: '/((?!api|_next|_vercel|.*\\..*).*)',
};
