import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { AuthCard } from '@/features/auth/components/auth-card';
import { RegisterForm } from '@/features/auth/components/register-form';
import type { Locale } from '@/i18n/routing';

export async function generateMetadata({ params }: PageProps<'/[locale]/register'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: 'auth' });
  return { title: t('registerTitle') };
}

export default async function RegisterPage() {
  const t = await getTranslations('auth');

  return (
    <AuthCard title={t('registerTitle')} description={t('registerDescription')}>
      <RegisterForm />
    </AuthCard>
  );
}
