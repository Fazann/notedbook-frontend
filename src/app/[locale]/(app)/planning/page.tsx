import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';

import { GoalsPage } from '@/features/planning/components/goals-page';
import type { Locale } from '@/i18n/routing';

export async function generateMetadata({ params }: PageProps<'/[locale]/planning'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: 'planning' });
  return { title: t('title') };
}

export default async function Page({ params }: PageProps<'/[locale]/planning'>) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  // The list reads its state from the URL search params, which needs a Suspense boundary.
  return (
    <Suspense>
      <GoalsPage />
    </Suspense>
  );
}
