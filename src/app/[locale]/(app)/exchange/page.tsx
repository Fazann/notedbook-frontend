import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { ExchangePage } from '@/features/exchange/components/exchange-page';
import type { Locale } from '@/i18n/routing';

export async function generateMetadata({ params }: PageProps<'/[locale]/exchange'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: 'exchange' });
  return { title: t('title') };
}

export default function Page() {
  return <ExchangePage />;
}
