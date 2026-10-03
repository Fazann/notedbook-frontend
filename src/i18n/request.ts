import { locale as rootLocale } from 'next/root-params';
import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';

import { APP_TIME_ZONE } from '@/lib/time';

import { routing } from './routing';

export default getRequestConfig(async ({ locale: override }) => {
  // An explicit `getTranslations({ locale })` wins; otherwise the `[locale]` root segment of the route.
  const requested = override ?? (await rootLocale());
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    // All dates and times are formatted in the user's timezone (activities are wall-clock times there).
    timeZone: APP_TIME_ZONE,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
