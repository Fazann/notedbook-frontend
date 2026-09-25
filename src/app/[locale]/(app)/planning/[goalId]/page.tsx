import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { GoalDetailPage } from '@/features/planning/components/goal-detail-page';
import type { Locale } from '@/i18n/routing';

/** The goal is loaded in the browser (session cookie); its title replaces this one once loaded. */
export async function generateMetadata({ params }: PageProps<'/[locale]/planning/[goalId]'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: 'planning' });
  return { title: t('title') };
}

export default async function Page({ params }: PageProps<'/[locale]/planning/[goalId]'>) {
  const { locale, goalId } = await params;
  setRequestLocale(locale as Locale);
  const id = Number(goalId);
  if (!Number.isInteger(id) || id <= 0) notFound();
  return <GoalDetailPage id={id} />;
}
