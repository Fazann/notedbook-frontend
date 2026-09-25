import createMiddleware from 'next-intl/middleware';

import { routing } from './i18n/routing';

// TODO(api): add the session-cookie auth check (redirect to /[locale]/login) once real auth exists.
export default createMiddleware(routing);

export const config = {
  // Skip Next internals, API routes and files with an extension (images, favicon...).
  matcher: '/((?!api|_next|_vercel|.*\\..*).*)',
};
