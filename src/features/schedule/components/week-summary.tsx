'use client';

import { CalendarClock, GraduationCap, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { ErrorState } from '@/components/shared/error-state';
import { StatCard } from '@/components/shared/stat-card';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { useWeekSummary } from '../hooks';
import { ACTIVITY_TYPES, type Occurrence } from '../types';
import { useScheduleFormat } from '../use-schedule-format';

import { ACTIVITY_TYPE_CLASSES } from './activity-type';

export type WeekSummaryProps = {
  from: string;
  to: string;
  /** The same range's occurrences (already loaded by the view) — to count meetings. */
  occurrences: Occurrence[] | undefined;
  className?: string;
};

/** Planned time · Learning time · Meetings · Time by type (stacked bar with a text legend). */
export function WeekSummary({ from, to, occurrences, className }: WeekSummaryProps) {
  const t = useTranslations('schedule');
  const format = useScheduleFormat();
  const summary = useWeekSummary(from, to);

  if (summary.isError) {
    return (
      <Card className={className}>
        <ErrorState message={t('loadError')} onRetry={() => void summary.refetch()} />
      </Card>
    );
  }

  const data = summary.data;
  const isLoading = summary.isPending;
  const meetings = occurrences?.filter((o) => o.type === 'meeting').length ?? 0;
  const types = ACTIVITY_TYPES.filter((type) => (data?.byType[type] ?? 0) > 0).sort(
    (a, b) => (data?.byType[b] ?? 0) - (data?.byType[a] ?? 0)
  );

  return (
    <div className={cn('grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-5', className)}>
      <StatCard
        label={t('summary.planned')}
        icon={<CalendarClock />}
        isLoading={isLoading}
        value={format.duration(data?.totalMinutes ?? 0)}
      />
      <StatCard
        label={t('summary.learning')}
        icon={<GraduationCap />}
        isLoading={isLoading}
        value={format.duration(data?.byType.learning ?? 0)}
      />
      <StatCard
        label={t('types.meeting')}
        icon={<Users />}
        isLoading={isLoading || !occurrences}
        value={t('summary.meetings', { count: meetings })}
      />
      <Card className="col-span-2 min-w-0 gap-3 px-4 py-4 md:px-5">
        <p className="text-muted-foreground text-sm">{t('summary.byType')}</p>
        {isLoading ? (
          <Skeleton className="h-2.5 w-full" />
        ) : (
          <>
            <div className="bg-muted flex h-2.5 overflow-hidden rounded-full" aria-hidden>
              {types.map((type) => (
                <span
                  key={type}
                  className={ACTIVITY_TYPE_CLASSES[type].dot}
                  // A share of the week: computed width, so an inline style.
                  style={{ width: `${((data?.byType[type] ?? 0) / (data?.totalMinutes || 1)) * 100}%` }}
                />
              ))}
            </div>
            <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
              {types.map((type) => (
                <li key={type} className="flex items-center gap-1.5">
                  <span className={cn('size-2 rounded-full', ACTIVITY_TYPE_CLASSES[type].dot)} aria-hidden />
                  <span>{t(`types.${type}`)}</span>
                  <span className="text-muted-foreground tabular-nums">{format.duration(data?.byType[type] ?? 0)}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
    </div>
  );
}
