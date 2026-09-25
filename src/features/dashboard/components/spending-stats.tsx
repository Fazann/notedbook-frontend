'use client';

import { ArrowDownRight, ArrowUpRight, CalendarClock, Coins, Minus, TrendingUp, Wallet } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { ErrorState } from '@/components/shared/error-state';
import { MoneyText } from '@/components/shared/money-text';
import { StatCard } from '@/components/shared/stat-card';
import { Card } from '@/components/ui/card';
import { useDueCards } from '@/features/board/hooks';
import { useExpenseSummary } from '@/features/expense/hooks';
import { shiftMonth, todayIso } from '@/lib/dates';
import { CURRENCIES, type Currency } from '@/lib/money';
import { cn } from '@/lib/utils';

import { percentChange, totalFor } from '../utils';

export type SpendingStatsProps = { month: string };

export function SpendingStats({ month }: SpendingStatsProps) {
  const t = useTranslations('dashboard');
  const summary = useExpenseSummary(month);
  const previous = useExpenseSummary(shiftMonth(month, -1));
  const dueCards = useDueCards(7);

  if (summary.isError || previous.isError) {
    return (
      <Card className="col-span-full">
        <ErrorState
          message={t('error')}
          onRetry={() => {
            void summary.refetch();
            void previous.refetch();
          }}
        />
      </Card>
    );
  }

  const isLoading = summary.isPending || previous.isPending;
  const usd = totalFor(summary.data, 'USD');
  const khr = totalFor(summary.data, 'KHR');
  const today = todayIso();
  const overdue = dueCards.data?.filter((c) => c.due_date !== null && c.due_date < today).length ?? 0;

  return (
    <div className="col-span-full grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
      <StatCard
        label={t('stats.spentUsd')}
        icon={<Wallet />}
        isLoading={isLoading}
        value={<MoneyText amount={usd.amount} currency="USD" />}
        hint={t('stats.expenseCount', { count: usd.count })}
      />
      <StatCard
        label={t('stats.spentKhr')}
        icon={<Coins />}
        isLoading={isLoading}
        value={<MoneyText amount={khr.amount} currency="KHR" />}
        hint={t('stats.expenseCount', { count: khr.count })}
      />
      <StatCard
        label={t('stats.vsLastMonth')}
        icon={<TrendingUp />}
        isLoading={isLoading}
        value={
          <span className="flex flex-col gap-1 text-sm font-medium">
            {CURRENCIES.map((c) => (
              <Trend
                key={c}
                currency={c}
                change={percentChange(totalFor(summary.data, c).amount, totalFor(previous.data, c).amount)}
              />
            ))}
          </span>
        }
      />
      <StatCard
        label={t('stats.tasksDue')}
        icon={<CalendarClock />}
        isLoading={dueCards.isPending}
        value={dueCards.isError ? '—' : (dueCards.data?.length ?? 0)}
        hint={
          <span className={cn(overdue > 0 && 'text-destructive font-medium')}>
            {t('stats.overdueCount', { count: overdue })}
          </span>
        }
      />
    </div>
  );
}

/** Spending going up is shown in the expense color, going down in the income color — always with text too. */
function Trend({ currency, change }: { currency: Currency; change: number | null }) {
  const t = useTranslations();
  let icon = <Minus className="size-4" aria-hidden />;
  let text = t('dashboard.stats.noCompare');
  let tone = 'text-muted-foreground';

  if (change !== null && change > 0) {
    icon = <ArrowUpRight className="size-4" aria-hidden />;
    text = t('dashboard.stats.up', { percent: change });
    tone = 'text-expense';
  } else if (change !== null && change < 0) {
    icon = <ArrowDownRight className="size-4" aria-hidden />;
    text = t('dashboard.stats.down', { percent: Math.abs(change) });
    tone = 'text-income';
  } else if (change === 0) {
    text = t('dashboard.stats.same');
  }

  return (
    <span className="flex items-center gap-1.5">
      <span className="text-muted-foreground w-10 shrink-0 text-xs">{t(`currency.${currency}`)}</span>
      <span className={cn('flex min-w-0 items-center gap-0.5 truncate', tone)}>
        {icon}
        {text}
      </span>
    </span>
  );
}
