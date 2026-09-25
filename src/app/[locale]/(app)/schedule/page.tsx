import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';

import { SchedulePage } from '@/features/schedule/components/schedule-page';
import type { Locale } from '@/i18n/routing';

export async function generateMetadata({ params }: PageProps<'/[locale]/schedule'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: 'schedule' });
  return { title: t('title') };
}

export default async function Page({ params }: PageProps<'/[locale]/schedule'>) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  // The view and date live in the URL search params, which needs a Suspense boundary.
  return (
    <Suspense>
      <SchedulePage />
    </Suspense>
  );
}
