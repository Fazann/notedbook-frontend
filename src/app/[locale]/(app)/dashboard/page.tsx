import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { DashboardView } from '@/features/dashboard/components/dashboard-view';
import type { Locale } from '@/i18n/routing';

export async function generateMetadata({ params }: PageProps<'/[locale]/dashboard'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: 'nav' });
  return { title: t('dashboard') };
}

export default async function DashboardPage({ params }: PageProps<'/[locale]/dashboard'>) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  return <DashboardView />;
}
