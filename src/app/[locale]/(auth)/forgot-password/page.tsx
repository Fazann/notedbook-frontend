import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { ForgotPasswordFlow } from '@/features/auth/components/forgot-password-flow';
import type { Locale } from '@/i18n/routing';

export async function generateMetadata({ params }: PageProps<'/[locale]/forgot-password'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: 'auth' });
  return { title: t('forgotPasswordTitle') };
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordFlow />;
}
