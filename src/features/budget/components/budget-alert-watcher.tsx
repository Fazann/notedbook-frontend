'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { useRouter } from '@/i18n/navigation';
import { currentMonth } from '@/lib/dates';

import { useBudgets } from '../hooks';
import type { Budget } from '../types';
import { useBudgetAlert } from '../use-budget-alert';
import { findNewAlerts } from '../utils';

/** Outlasts the "Expense added" toast, which lands on top of this one. */
const ALERT_DURATION_MS = 10_000;

/**
 * Warns with a toast when spending pushes a budget near or over its limit, wherever the expense was saved: saving
 * one refreshes the budgets, and this compares them with the last ones it saw. Page loads stay quiet; the
 * `BudgetAlerts` banners cover a state that is not new.
 */
export function BudgetAlertWatcher() {
  const t = useTranslations('budget.alert');
  const alertText = useBudgetAlert();
  const router = useRouter();
  const { data } = useBudgets(currentMonth());
  const seen = useRef<Budget[] | undefined>(undefined);

  useEffect(() => {
    const previous = seen.current;
    seen.current = data;
    if (!previous || !data) return;

    for (const budget of findNewAlerts(previous, data)) {
      const { title, description } = alertText(budget);
      const show = budget.status === 'over' ? toast.error : toast.warning;
      show(title, {
        description,
        duration: ALERT_DURATION_MS,
        action: { label: t('view'), onClick: () => router.push('/budgets') },
      });
    }
  }, [data, alertText, router, t]);

  return null;
}
