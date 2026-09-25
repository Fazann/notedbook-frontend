'use client';

import { Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { ErrorState } from '@/components/shared/error-state';
import { SectionCard } from '@/components/shared/section-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from '@/i18n/navigation';
import { toMinutes } from '@/lib/time';
import { cn } from '@/lib/utils';

import { useOccurrences } from '../hooks';
import { useNow } from '../use-now';
import { useScheduleFormat } from '../use-schedule-format';

import { ACTIVITY_TYPE_CLASSES } from './activity-type';

export type TodayScheduleProps = { className?: string };

/** Dashboard widget: what's on now / next, and the rest of today (max 5). Updates every minute. */
export function TodaySchedule({ className }: TodayScheduleProps) {
  const t = useTranslations('schedule');
  const format = useScheduleFormat();
  const { today, nowMinutes } = useNow();
  const occurrences = useOccurrences(today, today);

  const renderBody = () => {
    if (occurrences.isPending) {
      return (
        <div className="space-y-3" aria-hidden>
          <Skeleton className="h-16 w-full" />
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-5 w-3/4" />
          ))}
        </div>
      );
    }
    if (occurrences.isError) {
      return <ErrorState message={t('loadError')} onRetry={() => void occurrences.refetch()} />;
    }

    const list = occurrences.data.filter((o) => o.date === today);
    const current = list.find((o) => toMinutes(o.startTime) <= nowMinutes && nowMinutes < toMinutes(o.endTime));
    const next = list.find((o) => toMinutes(o.startTime) > nowMinutes);
    const remaining = list.filter((o) => toMinutes(o.endTime) > nowMinutes && o !== current).slice(0, 5);
    const highlight = current ?? next;

    return (
      <div className="space-y-4">
        <div
          className={cn(
            'rounded-lg px-3 py-3',
            highlight ? cn('border-l-4', ACTIVITY_TYPE_CLASSES[highlight.type].block) : 'bg-muted'
          )}
          aria-live="polite"
        >
          {highlight ? (
            <>
              <p className="text-xs font-semibold opacity-80">{current ? t('dashboard.now') : t('dashboard.next')}</p>
              <p className="font-medium break-words">{highlight.title}</p>
              <p className="flex items-center gap-1.5 text-xs opacity-80">
                <Clock className="size-3.5" aria-hidden />
                {current
                  ? t('dashboard.endsIn', { time: format.duration(toMinutes(current.endTime) - nowMinutes) })
                  : t('dashboard.startsIn', { time: format.duration(toMinutes(highlight.startTime) - nowMinutes) })}
              </p>
            </>
          ) : (
            <p className="text-sm">{t('dashboard.nothingLeft')}</p>
          )}
        </div>

        {remaining.length > 0 && (
          <ul className="space-y-2">
            {remaining.map((o) => (
              <li key={o.key} className="flex items-center gap-3 text-sm">
                <span className="text-muted-foreground w-24 shrink-0 text-xs tabular-nums">
                  {format.timeRange(o.startTime, o.endTime)}
                </span>
                <span className={cn('size-2 shrink-0 rounded-full', ACTIVITY_TYPE_CLASSES[o.type].dot)} aria-hidden />
                <span className="min-w-0 truncate">{o.title}</span>
                <span className="sr-only">{t(`types.${o.type}`)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  return (
    <SectionCard
      className={className}
      title={t('dashboard.title')}
      action={
        <Button variant="ghost" size="sm" asChild>
          <Link href={{ pathname: '/schedule', query: { view: 'day' } }}>{t('dashboard.viewAll')}</Link>
        </Button>
      }
    >
      {renderBody()}
    </SectionCard>
  );
}
