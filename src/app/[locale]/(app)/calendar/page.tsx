import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';

import { CalendarPage } from '@/features/calendar/components/calendar-page';
import type { Locale } from '@/i18n/routing';

export async function generateMetadata({ params }: PageProps<'/[locale]/calendar'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: 'calendar' });
  return { title: t('title') };
}

export default async function Page() {
  // The calendar type, country and month live in the URL search params, which needs a Suspense boundary.
  return (
    <Suspense>
      <CalendarPage />
    </Suspense>
  );
}
