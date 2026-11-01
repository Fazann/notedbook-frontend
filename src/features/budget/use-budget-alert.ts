'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useCallback } from 'react';

import { formatMoney } from '@/lib/money';

import type { Budget } from './types';

/** The title and text that warn about a budget near or over its limit. */
export function useBudgetAlert() {
  const t = useTranslations('budget.alert');
  const tCurrency = useTranslations('currency');
  const locale = useLocale();
  return useCallback(
    (budget: Budget) => {
      const money = (amount: number) => formatMoney(amount, budget.currency, locale);
      const name = tCurrency(budget.currency);
      return budget.status === 'over'
        ? {
            title: t('overTitle'),
            description: t('over', { amount: money(budget.spent - budget.amount), budget: name }),
          }
        : {
            title: t('nearTitle'),
            description: t('near', {
              amount: money(budget.amount - budget.spent),
              budget: name,
              percent: budget.percent,
            }),
          };
    },
    [t, tCurrency, locale]
  );
}
