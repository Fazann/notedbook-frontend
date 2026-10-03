import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';

import { CategoriesPage } from '@/features/expense/components/categories-page';
import type { Locale } from '@/i18n/routing';

export async function generateMetadata({ params }: PageProps<'/[locale]/expenses/categories'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: 'category' });
  return { title: t('title') };
}

export default async function Page() {
  // The list reads its state from the URL search params, which needs a Suspense boundary.
  return (
    <Suspense>
      <CategoriesPage />
    </Suspense>
  );
}
