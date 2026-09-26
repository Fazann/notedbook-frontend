'use client';

import { Banknote, Coins, Receipt, Wallet } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import { ErrorState } from '@/components/shared/error-state';
import { MoneyText } from '@/components/shared/money-text';
import { StatCard } from '@/components/shared/stat-card';
import { Card } from '@/components/ui/card';
import { CURRENCIES, type Currency } from '@/lib/money';

import { useExpenseSummary } from '../hooks';

export type ExpenseSummaryProps = { month: string };

const CURRENCY_CARDS = {
  USD: { label: 'summary.spentUsd', icon: <Wallet /> },
  KHR: { label: 'summary.spentKhr', icon: <Coins /> },
  MYR: { label: 'summary.spentMyr', icon: <Banknote /> },
} as const satisfies Record<Currency, { label: string; icon: React.ReactNode }>;

/** Month totals: each currency is always shown separately (never summed), plus the number of expenses. */
export function ExpenseSummary({ month }: ExpenseSummaryProps) {
  const t = useTranslations('expense');
  const format = useFormatter();
  const summary = useExpenseSummary(month);

  if (summary.isError) {
    return (
      <Card>
        <ErrorState message={t('loadError')} onRetry={() => void summary.refetch()} />
      </Card>
    );
  }

  const total = (currency: Currency) =>
    summary.data?.totals.find((x) => x.currency === currency) ?? { amount: 0, count: 0 };
  const count = CURRENCIES.reduce((sum, c) => sum + total(c).count, 0);

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
      {CURRENCIES.map((c) => (
        <StatCard
          key={c}
          label={t(CURRENCY_CARDS[c].label)}
          icon={CURRENCY_CARDS[c].icon}
          isLoading={summary.isPending}
          value={<MoneyText amount={total(c).amount} currency={c} />}
          hint={t('summary.countHint', { count: total(c).count })}
        />
      ))}
      <StatCard
        label={t('summary.count')}
        icon={<Receipt />}
        isLoading={summary.isPending}
        value={format.number(count)}
        hint={t('summary.allFilters')}
      />
    </div>
  );
}
