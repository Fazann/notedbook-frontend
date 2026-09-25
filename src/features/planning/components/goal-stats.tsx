'use client';

import { AlertTriangle, Gauge, Target, Trophy } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import { ErrorState } from '@/components/shared/error-state';
import { StatCard } from '@/components/shared/stat-card';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import { useGoalStats } from '../hooks';

/** Active goals · Done this year · Overdue · Average progress. 2×2 on phones, 4 in a row from `lg`. */
export function GoalStats() {
  const t = useTranslations('planning');
  const format = useFormatter();
  const stats = useGoalStats();

  if (stats.isError) {
    return (
      <Card>
        <ErrorState message={t('loadError')} onRetry={() => void stats.refetch()} />
      </Card>
    );
  }

  const data = stats.data;
  const isLoading = stats.isPending;
  const n = (value: number | undefined) => format.number(value ?? 0);

  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
      <StatCard label={t('stats.active')} icon={<Target />} isLoading={isLoading} value={n(data?.active)} />
      <StatCard label={t('stats.doneThisYear')} icon={<Trophy />} isLoading={isLoading} value={n(data?.doneThisYear)} />
      <StatCard
        label={t('stats.overdue')}
        icon={<AlertTriangle />}
        isLoading={isLoading}
        value={<span className={cn(data && data.overdue > 0 && 'text-destructive')}>{n(data?.overdue)}</span>}
      />
      <StatCard
        label={t('stats.averageProgress')}
        icon={<Gauge />}
        isLoading={isLoading}
        value={format.number((data?.averageProgress ?? 0) / 100, { style: 'percent' })}
      />
    </div>
  );
}
