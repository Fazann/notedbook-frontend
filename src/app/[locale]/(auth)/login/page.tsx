import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { AuthCard } from '@/features/auth/components/auth-card';
import { LoginForm } from '@/features/auth/components/login-form';
import type { Locale } from '@/i18n/routing';
import { NEXT_PARAM, safeRedirectPath } from '@/lib/auth-paths';

export async function generateMetadata({ params }: PageProps<'/[locale]/login'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: 'auth' });
  return { title: t('loginTitle') };
}

export default async function LoginPage({ searchParams }: PageProps<'/[locale]/login'>) {
  const next = safeRedirectPath((await searchParams)[NEXT_PARAM]);
  const t = await getTranslations('auth');

  return (
    <AuthCard title={t('loginTitle')} description={t('loginDescription')}>
      <LoginForm next={next} />
    </AuthCard>
  );
}
