'use client';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { FloatingActionButton } from '@/components/shared/floating-action-button';
import { usePathname } from '@/i18n/navigation';
import { useUiStore } from '@/stores/ui-store';

import { isActive } from './nav-items';

/**
 * Pages with their own floating "+" that opens their own form (schedule → new activity, planning → new goal,
 * categories → new category). Sub-pages are included, so a goal's detail page shows no expense "+" either.
 */
const OWN_FAB_ROUTES = ['/schedule', '/planning', '/expenses/categories'];

/** Floating "+" on phones, above the bottom nav: opens quick-add expense (pages with their own "+" hide it). */
export function QuickAddFab() {
  const t = useTranslations('expense');
  const openQuickAdd = useUiStore((s) => s.openQuickAdd);
  const pathname = usePathname();

  if (OWN_FAB_ROUTES.some((route) => isActive(pathname, route))) return null;

  return (
    <FloatingActionButton onClick={openQuickAdd} aria-label={t('quickAdd')}>
      <Plus aria-hidden />
    </FloatingActionButton>
  );
}
