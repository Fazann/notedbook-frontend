'use client';

import { CalendarDays, MapPin, Repeat } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { SectionCard } from '@/components/shared/section-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ActivityTypeBadge } from '@/features/schedule/components/activity-type';
import type { Occurrence } from '@/features/schedule/types';
import { useFormatTime } from '@/hooks/use-format-time';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

export type ScheduleListProps = {
  /** First and last `YYYY-MM-DD` the calendar shows. */
  from: string;
  to: string;
  /** `YYYY-MM-DD` */
  today: string;
  /** The user's activities by date (see `occurrencesByDate`); undefined while loading. */
  schedule: Map<string, Occurrence[]> | undefined;
  isError: boolean;
  onRetry: () => void;
};

/** The user's activities on the dates the calendar shows, grouped by day; each day links to the schedule's day view. */
export function ScheduleList({ from, to, today, schedule, isError, onRetry }: ScheduleListProps) {
  const t = useTranslations('calendar.schedule');
  const formatTime = useFormatTime();

  const renderContent = () => {
    if (isError) return <ErrorState message={t('loadError')} onRetry={onRetry} />;
    if (!schedule) {
      return (
        <div aria-busy className="space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
        </div>
      );
    }
    if (schedule.size === 0) {
      return <EmptyState icon={<CalendarDays aria-hidden />} title={t('empty')} className="py-6" />;
    }
    return (
      <div className="space-y-5">
        {[...schedule].map(([date, items]) => (
          <section key={date} aria-labelledby={`calendar-schedule-${date}`} className="space-y-1">
            <h3 id={`calendar-schedule-${date}`} className="text-sm font-semibold">
              <Link
                href={{ pathname: '/schedule', query: { view: 'day', date } }}
                className={cn(
                  'focus-visible:ring-ring inline-flex min-h-11 items-center rounded-sm outline-none hover:underline',
                  'focus-visible:ring-2 md:min-h-0',
                  date === today ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {formatTime.date(date, { weekday: 'long', day: 'numeric', month: 'long' })}
                {date === today && ` · ${t('today')}`}
              </Link>
            </h3>
            <ul className="divide-border divide-y">
              {items.map((o) => (
                <li key={o.key} className="flex items-start gap-3 py-3">
                  <span className="w-28 shrink-0 pt-0.5 text-sm tabular-nums sm:w-40">
                    {formatTime.timeRange(o.startTime, o.endTime)}
                  </span>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="leading-relaxed font-medium break-words">{o.title}</p>
                    <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                      <ActivityTypeBadge type={o.type} />
                      {o.location && (
                        <span className="flex min-w-0 items-center gap-1">
                          <MapPin className="size-3 shrink-0" aria-hidden />
                          <span className="break-words">{o.location}</span>
                        </span>
                      )}
                      {o.isRecurring && (
                        <span className="flex items-center gap-1">
                          <Repeat className="size-3" aria-hidden />
                          {t('repeats')}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    );
  };

  return (
    <SectionCard
      title={t('title')}
      description={t('description', { range: formatTime.dateRange(from, to) })}
      action={
        <Button asChild variant="outline" size="touch">
          <Link href="/schedule">{t('open')}</Link>
        </Button>
      }
    >
      {renderContent()}
    </SectionCard>
  );
}
