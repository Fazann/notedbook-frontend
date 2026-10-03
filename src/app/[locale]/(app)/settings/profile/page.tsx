import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { ProfileSettings } from '@/features/auth/components/profile-settings';
import type { Locale } from '@/i18n/routing';

export async function generateMetadata({ params }: PageProps<'/[locale]/settings/profile'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: 'settings.profile' });
  return { title: t('title') };
}

export default async function Page() {
  return <ProfileSettings />;
}
