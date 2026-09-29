import { getTranslations, setRequestLocale } from 'next-intl/server';

import { PageHeader } from '@/components/shared/page-header';
import { SettingsTabs } from '@/features/auth/components/settings-tabs';
import type { Locale } from '@/i18n/routing';

export default async function SettingsLayout({ children, params }: LayoutProps<'/[locale]/settings'>) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations('settings');

  return (
    <div className="max-w-3xl space-y-4 md:space-y-6">
      <div className="space-y-4">
        <PageHeader title={t('title')} description={t('description')} />
        <SettingsTabs />
      </div>
      {children}
    </div>
  );
}
