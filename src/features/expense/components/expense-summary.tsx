'use client';

import { Coins, Receipt, Wallet } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import { ErrorState } from '@/components/shared/error-state';
import { MoneyText } from '@/components/shared/money-text';
import { StatCard } from '@/components/shared/stat-card';
import { Card } from '@/components/ui/card';
import type { Currency } from '@/lib/money';

import { useExpenseSummary } from '../hooks';

export type ExpenseSummaryProps = { month: string };

/** Month totals: USD and KHR are always shown separately (never summed), plus the number of expenses. */
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
  const usd = total('USD');
  const khr = total('KHR');

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
      <StatCard
        label={t('summary.spentUsd')}
        icon={<Wallet />}
        isLoading={summary.isPending}
        value={<MoneyText amount={usd.amount} currency="USD" />}
        hint={t('summary.countHint', { count: usd.count })}
      />
      <StatCard
        label={t('summary.spentKhr')}
        icon={<Coins />}
        isLoading={summary.isPending}
        value={<MoneyText amount={khr.amount} currency="KHR" />}
        hint={t('summary.countHint', { count: khr.count })}
      />
      <StatCard
        className="col-span-2 md:col-span-1"
        label={t('summary.count')}
        icon={<Receipt />}
        isLoading={summary.isPending}
        value={format.number(usd.count + khr.count)}
        hint={t('summary.allFilters')}
      />
    </div>
  );
}
