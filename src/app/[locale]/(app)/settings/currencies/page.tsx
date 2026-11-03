import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { CurrencySettings } from '@/features/expense/components/currency-settings';
import type { Locale } from '@/i18n/routing';

export async function generateMetadata({ params }: PageProps<'/[locale]/settings/currencies'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: 'settings.currencies' });
  return { title: t('title') };
}

export default function Page() {
  return <CurrencySettings />;
}
