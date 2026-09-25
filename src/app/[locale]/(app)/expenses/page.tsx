import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';

import { ExpensesPage } from '@/features/expense/components/expenses-page';
import type { Locale } from '@/i18n/routing';

export async function generateMetadata({ params }: PageProps<'/[locale]/expenses'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: 'expense' });
  return { title: t('title') };
}

export default async function Page({ params }: PageProps<'/[locale]/expenses'>) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  // The list reads its state from the URL search params, which needs a Suspense boundary.
  return (
    <Suspense>
      <ExpensesPage />
    </Suspense>
  );
}
