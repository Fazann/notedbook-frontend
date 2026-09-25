'use client';

import { PieChart as PieIcon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { Cell, Pie, PieChart } from 'recharts';

import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { MoneyText } from '@/components/shared/money-text';
import { SectionCard } from '@/components/shared/section-card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { useCategoryOptions, useExpenseSummary } from '@/features/expense/hooks';
import { useCategoryName } from '@/features/expense/use-category-name';
import { Link, useRouter } from '@/i18n/navigation';
import { formatMoney, type Currency } from '@/lib/money';
import { cn } from '@/lib/utils';
import { usePreferencesStore } from '@/stores/preferences-store';

import { categoryShares } from '../utils';

import { CurrencyTabs } from './currency-tabs';

/** Static class names so Tailwind can see them; index matches `--chart-N`. */
const SWATCH = ['bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5'];

export type CategoryBreakdownChartProps = { month: string; className?: string };

export function CategoryBreakdownChart({ month, className }: CategoryBreakdownChartProps) {
  const t = useTranslations('dashboard.category');
  const td = useTranslations('dashboard');
  const locale = useLocale();
  const router = useRouter();
  const categoryName = useCategoryName();
  const defaultCurrency = usePreferencesStore((s) => s.defaultCurrency);
  const [currency, setCurrency] = useState<Currency>(defaultCurrency);
  const summary = useExpenseSummary(month);
  const categories = useCategoryOptions();

  const renderBody = () => {
    if (summary.isPending || categories.isPending) {
      return (
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="size-40 rounded-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      );
    }
    if (summary.isError || categories.isError) {
      return (
        <ErrorState
          message={td('error')}
          onRetry={() => {
            void summary.refetch();
            void categories.refetch();
          }}
        />
      );
    }

    const slices = categoryShares(summary.data, currency).map((s, i) => {
      const category = categories.data.find((c) => c.id === s.category_id);
      return {
        ...s,
        key: `slice${i}`,
        name: category ? categoryName(category) : t('others'),
        fill: `var(--chart-${i + 1})`,
        swatch: SWATCH[i],
      };
    });
    if (slices.length === 0) {
      return <EmptyState icon={<PieIcon />} title={t('empty')} />;
    }

    const config = Object.fromEntries(slices.map((s) => [s.key, { label: s.name, color: s.fill }])) as ChartConfig;
    const open = (categoryId: number | null) =>
      categoryId !== null && router.push({ pathname: '/expenses', query: { category: String(categoryId) } });

    return (
      <div className="flex flex-col gap-4">
        <ChartContainer config={config} className="mx-auto aspect-square h-44 md:h-48">
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  nameKey="key"
                  hideLabel
                  formatter={(value, _name, item) => (
                    <span className="flex w-full items-center justify-between gap-3">
                      <span>{item.payload?.name}</span>
                      <span className="font-medium tabular-nums">{formatMoney(Number(value), currency, locale)}</span>
                    </span>
                  )}
                />
              }
            />
            <Pie
              data={slices}
              dataKey="amount"
              nameKey="key"
              innerRadius="58%"
              outerRadius="90%"
              strokeWidth={2}
              className="cursor-pointer"
              onClick={(data: { payload?: { category_id: number | null } }) => open(data.payload?.category_id ?? null)}
            >
              {slices.map((s) => (
                <Cell key={s.key} fill={s.fill} className="stroke-card" />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>

        {/* The legend doubles as the accessible way to open a category (the slices are mouse/touch only). */}
        <ul className="space-y-1">
          {slices.map((s) => {
            const row = (
              <>
                <span className={cn('size-2.5 shrink-0 rounded-full', s.swatch)} aria-hidden />
                <span className="min-w-0 flex-1 truncate">{s.name}</span>
                <MoneyText amount={s.amount} currency={currency} className="text-muted-foreground" />
                <span className="w-10 text-right font-medium tabular-nums">{s.percent}%</span>
              </>
            );
            const rowClass = 'flex min-h-10 items-center gap-2 rounded-md px-2 text-sm';
            return (
              <li key={s.key}>
                {s.category_id === null ? (
                  <div className={rowClass}>{row}</div>
                ) : (
                  <Link
                    href={{ pathname: '/expenses', query: { category: String(s.category_id) } }}
                    aria-label={t('openCategory', { category: s.name })}
                    className={cn(
                      rowClass,
                      'hover:bg-muted focus-visible:ring-ring/50 outline-none focus-visible:ring-3'
                    )}
                  >
                    {row}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  return (
    <SectionCard
      className={className}
      title={t('title')}
      description={t('description')}
      action={<CurrencyTabs value={currency} onChange={setCurrency} />}
    >
      {renderBody()}
    </SectionCard>
  );
}
