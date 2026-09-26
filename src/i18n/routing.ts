import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  // Also the order of the language switcher menu. The default stays English.
  locales: ['km', 'en', 'ms'],
  defaultLocale: 'en',
});

export type Locale = (typeof routing.locales)[number];
