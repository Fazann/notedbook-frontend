import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { SectionCard } from '@/components/shared/section-card';
import { ChangePasswordForm } from '@/features/auth/components/change-password-form';
import type { Locale } from '@/i18n/routing';

export async function generateMetadata({ params }: PageProps<'/[locale]/settings/password'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: 'settings.password' });
  return { title: t('title') };
}

export default async function Page({ params }: PageProps<'/[locale]/settings/password'>) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations('settings.password');

  return (
    <SectionCard title={t('title')} description={t('description')}>
      <ChangePasswordForm />
    </SectionCard>
  );
}
