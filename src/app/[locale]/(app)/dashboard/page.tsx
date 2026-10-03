import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { DashboardView } from '@/features/dashboard/components/dashboard-view';
import type { Locale } from '@/i18n/routing';

export async function generateMetadata({ params }: PageProps<'/[locale]/dashboard'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: 'nav' });
  return { title: t('dashboard') };
}

export default async function DashboardPage() {
  return <DashboardView />;
}
