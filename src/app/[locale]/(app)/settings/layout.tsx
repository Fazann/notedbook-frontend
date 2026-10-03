import { getTranslations } from 'next-intl/server';

import { PageHeader } from '@/components/shared/page-header';
import { SettingsTabs } from '@/features/auth/components/settings-tabs';

export default async function SettingsLayout({ children }: LayoutProps<'/[locale]/settings'>) {
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
