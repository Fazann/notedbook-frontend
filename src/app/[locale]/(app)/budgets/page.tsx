import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { BudgetsPage } from '@/features/budget/components/budgets-page';
import type { Locale } from '@/i18n/routing';

export async function generateMetadata({ params }: PageProps<'/[locale]/budgets'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: 'budget' });
  return { title: t('title') };
}

export default function Page() {
  return <BudgetsPage />;
}
