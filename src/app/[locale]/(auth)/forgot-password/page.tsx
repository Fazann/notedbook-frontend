import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { AuthCard } from '@/features/auth/components/auth-card';
import { AuthNotReady } from '@/features/auth/components/auth-not-ready';
import type { Locale } from '@/i18n/routing';

export async function generateMetadata({ params }: PageProps<'/[locale]/forgot-password'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: 'auth' });
  return { title: t('forgotPasswordTitle') };
}

// TODO(api): the API has no password-reset endpoint yet (e.g. POST /auth/forgot-password { username }).
export default async function ForgotPasswordPage() {
  const t = await getTranslations('auth');

  return (
    <AuthCard title={t('forgotPasswordTitle')}>
      <AuthNotReady />
    </AuthCard>
  );
}
