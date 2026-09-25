'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';

import { ErrorState } from '@/components/shared/error-state';
import { SectionCard } from '@/components/shared/section-card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { useExpenses } from '@/features/expense/hooks';
import { formatMoney, type Currency } from '@/lib/money';
import { usePreferencesStore } from '@/stores/preferences-store';

import { dailyTotals } from '../utils';

import { CurrencyTabs } from './currency-tabs';

export type DailySpendingChartProps = { month: string; className?: string };

export function DailySpendingChart({ month, className }: DailySpendingChartProps) {
  const t = useTranslations('dashboard.daily');
  const td = useTranslations('dashboard');
  const locale = useLocale();
  const defaultCurrency = usePreferencesStore((s) => s.defaultCurrency);
  const [currency, setCurrency] = useState<Currency>(defaultCurrency);
  const expenses = useExpenses(month);

  const config = { amount: { label: t('title'), color: 'var(--chart-1)' } } satisfies ChartConfig;

  return (
    <SectionCard
      className={className}
      title={t('title')}
      description={t('description')}
      action={<CurrencyTabs value={currency} onChange={setCurrency} />}
    >
      {expenses.isPending ? (
        <Skeleton className="h-56 w-full md:h-64" />
      ) : expenses.isError ? (
        <ErrorState message={td('error')} onRetry={() => void expenses.refetch()} />
      ) : (
        <ChartContainer config={config} className="aspect-auto h-56 w-full md:h-64">
          <BarChart data={dailyTotals(expenses.data, month, currency)} margin={{ left: 0, right: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} minTickGap={16} />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) => t('day', { day: String(payload?.[0]?.payload?.day ?? '') })}
                  formatter={(value) => (
                    <span className="font-medium tabular-nums">{formatMoney(Number(value), currency, locale)}</span>
                  )}
                />
              }
            />
            <Bar dataKey="amount" fill="var(--color-amount)" radius={4} />
          </BarChart>
        </ChartContainer>
      )}
    </SectionCard>
  );
}
