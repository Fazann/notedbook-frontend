'use client';

import { Receipt } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import { ErrorState } from '@/components/shared/error-state';
import { MoneyText } from '@/components/shared/money-text';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useExpenseSummary } from '@/features/expense/hooks';
import { useEnabledCurrencies } from '@/hooks/use-currencies';

export type SpendingTotalCardProps = { month: string };

/**
 * The month's expenses in every currency: one line per enabled currency (never summed together — plus a disabled one
 * that still has expenses) and the number of expenses across all currencies.
 */
export function SpendingTotalCard({ month }: SpendingTotalCardProps) {
  const t = useTranslations('budget.spending');
  const tCurrency = useTranslations('currency');
  const format = useFormatter();
  const summary = useExpenseSummary(month);
  const totals = summary.data?.totals ?? [];
  const currencies = useEnabledCurrencies(totals.filter((x) => x.count > 0).map((x) => x.currency));
  const totalOf = (c: (typeof currencies)[number]) => totals.find((x) => x.currency === c) ?? { amount: 0, count: 0 };
  const count = totals.reduce((sum, x) => sum + x.count, 0);

  return (
    <Card className="min-w-0 gap-3 px-4 py-4 md:px-5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <h2 className="font-medium break-words">{t('title')}</h2>
          <p className="text-muted-foreground text-sm break-words">{t('description')}</p>
        </div>
        <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
          <Receipt className="size-4" aria-hidden />
        </span>
      </div>

      {summary.isError ? (
        <ErrorState message={t('loadError')} onRetry={() => void summary.refetch()} />
      ) : summary.isPending ? (
        <div aria-busy className="space-y-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
        </div>
      ) : (
        <>
          <p className="text-xl font-semibold tabular-nums md:text-2xl">
            {t('count', { count, formatted: format.number(count) })}
          </p>
          <dl className="divide-border divide-y text-sm">
            {currencies.map((c) => (
              <div key={c} className="flex items-baseline justify-between gap-3 py-1.5">
                <dt className="text-muted-foreground">
                  {t('currencyLine', { currency: tCurrency(c), count: totalOf(c).count })}
                </dt>
                <dd className="font-medium">
                  <MoneyText amount={totalOf(c).amount} currency={c} />
                </dd>
              </div>
            ))}
          </dl>
        </>
      )}
    </Card>
  );
}
