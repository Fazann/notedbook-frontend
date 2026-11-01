'use client';

import { CircleAlert, CircleCheck, TriangleAlert } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { DataListRowActions, type RowAction } from '@/components/shared/data-list-row-actions';
import { ProgressBar, type ProgressBarProps } from '@/components/shared/progress-bar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { formatMoney } from '@/lib/money';

import type { Budget, BudgetStatus } from '../types';

const STATUS: Record<
  BudgetStatus,
  { badge: 'secondary' | 'warning' | 'destructive'; tone: ProgressBarProps['tone']; icon: React.ReactNode }
> = {
  ok: { badge: 'secondary', tone: 'default', icon: <CircleCheck aria-hidden /> },
  near: { badge: 'warning', tone: 'warning', icon: <TriangleAlert aria-hidden /> },
  over: { badge: 'destructive', tone: 'destructive', icon: <CircleAlert aria-hidden /> },
};

export type BudgetCardProps = { budget: Budget; actions: RowAction[] };

export function BudgetCard({ budget, actions }: BudgetCardProps) {
  const t = useTranslations('budget');
  const tCurrency = useTranslations('currency');
  const locale = useLocale();
  const { amount, currency, spent, percent, status } = budget;
  const money = (value: number) => formatMoney(value, currency, locale);
  const style = STATUS[status];
  const title = t('cardTitle', { currency: tCurrency(currency) });

  return (
    <Card className="min-w-0 gap-3 px-4 py-4 md:px-5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <h2 className="font-medium break-words">{title}</h2>
          <Badge variant={style.badge} className="h-auto">
            {style.icon}
            {t(`status.${status}`)}
          </Badge>
        </div>
        <DataListRowActions actions={actions} label={t('actions', { budget: title })} />
      </div>

      <p className="text-xl font-semibold tabular-nums md:text-2xl">{money(spent)}</p>
      <ProgressBar value={percent} label={title} size="md" tone={style.tone} />

      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm">
        <span className="text-muted-foreground break-words">{t('limit', { amount: money(amount) })}</span>
        <span className="font-medium break-words tabular-nums">
          {spent > amount
            ? t('overBy', { amount: money(spent - amount) })
            : t('left', { amount: money(amount - spent) })}
        </span>
      </div>
      <p className="text-muted-foreground text-xs break-words">
        {t('used', { percent })} · {t('alertAt', { percent: budget.alert_percent })}
      </p>
    </Card>
  );
}
