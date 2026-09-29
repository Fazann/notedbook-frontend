'use client';

import { useTranslations } from 'next-intl';

import { LinkTabs } from '@/components/shared/link-tabs';

/** "Expenses | Categories" switch. These are links between pages, styled like tabs. */
export function ExpenseTabs() {
  const t = useTranslations('category');
  return (
    <LinkTabs
      label={t('title')}
      tabs={[
        { href: '/expenses', label: t('tabExpenses') },
        { href: '/expenses/categories', label: t('tabCategories') },
      ]}
    />
  );
}
