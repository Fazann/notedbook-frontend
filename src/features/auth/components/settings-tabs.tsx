'use client';

import { useTranslations } from 'next-intl';

import { LinkTabs } from '@/components/shared/link-tabs';

/** "Profile | Password" switch between the settings pages. */
export function SettingsTabs() {
  const t = useTranslations('settings');
  return (
    <LinkTabs
      label={t('navLabel')}
      tabs={[
        { href: '/settings/profile', label: t('tabProfile') },
        { href: '/settings/password', label: t('tabPassword') },
      ]}
    />
  );
}
