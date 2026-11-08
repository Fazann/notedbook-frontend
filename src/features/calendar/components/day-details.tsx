'use client';

import { CalendarDays, Flag, MapPin, Plus, Repeat } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { SectionCard } from '@/components/shared/section-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ACTIVITY_TYPE_CLASSES, ActivityTypeBadge } from '@/features/schedule/components/activity-type';
import type { Occurrence } from '@/features/schedule/types';
import { useFormatTime } from '@/hooks/use-format-time';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

import type { CalendarSystem, Holiday } from '../types';
import { useCalendarFormat } from '../use-calendar-format';

export type DayDetailsProps = {
  /** The picked `YYYY-MM-DD`. */
  date: string;
  /** `YYYY-MM-DD` */
  today: string;
  system: CalendarSystem;
  /** The day's holidays (empty for none). */
  holidays: Holiday[];
  /** The day's activities, sorted by time; undefined while loading. */
  activities: Occurrence[] | undefined;
  isError: boolean;
  onRetry: () => void;
  /** Opens the activity form for this day; the button is hidden without it. */
  onAddActivity?: () => void;
  className?: string;
};

/**
 * The picked day: its date (and lunar / Hijri date), holidays and the user's activities, with "Add activity" for that
 * day and a link to the schedule.
 */
export function DayDetails({
  date,
  today,
  system,
  holidays,
  activities,
  isError,
  onRetry,
  onAddActivity,
  className,
}: DayDetailsProps) {
  const t = useTranslations('calendar.schedule');
  const format = useCalendarFormat();
  const formatTime = useFormatTime();
  const note = system === 'gregorian' ? null : format.fullNote(date, system);

  const renderActivities = () => {
    if (isError) return <ErrorState message={t('loadError')} onRetry={onRetry} />;
    if (!activities) {
      return (
        <div aria-busy className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      );
    }
    if (activities.length === 0) {
      return <EmptyState icon={<CalendarDays aria-hidden />} title={t('empty')} className="py-6" />;
    }
    return (
      <ul className="space-y-2">
        {activities.map((o) => (
          <li
            key={o.key}
            className={cn('bg-card space-y-1.5 rounded-lg border border-l-4 p-3', ACTIVITY_TYPE_CLASSES[o.type].block)}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <p className="min-w-0 leading-relaxed font-medium break-words">{o.title}</p>
              <span className="text-sm tabular-nums opacity-80">{formatTime.timeRange(o.startTime, o.endTime)}</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs opacity-90">
              <ActivityTypeBadge type={o.type} className="bg-background/70" />
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
          </li>
        ))}
      </ul>
    );
  };

  return (
    <SectionCard
      aria-live="polite"
      className={className}
      title={
        <span className="flex flex-wrap items-center gap-2">
          {formatTime.date(date, { weekday: 'long', day: 'numeric', month: 'long' })}
          {date === today && <Badge>{t('today')}</Badge>}
        </span>
      }
      description={note && <span className="leading-relaxed break-words">{note}</span>}
    >
      <div className="space-y-5">
        {holidays.length > 0 && (
          <section aria-labelledby="calendar-day-holidays" className="space-y-2">
            <h3 id="calendar-day-holidays" className="text-muted-foreground text-sm font-medium">
              {t('holidays')}
            </h3>
            <ul className="space-y-2">
              {holidays.map((h) => (
                <li
                  key={h.key ?? h.name}
                  className="bg-holiday/10 text-holiday flex items-start gap-2 rounded-lg p-3 text-sm font-medium"
                >
                  <Flag className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <span className="leading-relaxed break-words">{format.holidayName(h)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="calendar-day-activities" className="space-y-2">
          <h3 id="calendar-day-activities" className="text-muted-foreground text-sm font-medium">
            {t('activities')}
          </h3>
          {renderActivities()}
        </section>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {onAddActivity && (
            <Button size="touch" onClick={onAddActivity}>
              <Plus aria-hidden />
              {t('add')}
            </Button>
          )}
          <Button asChild variant="outline" size="touch" className={cn(!onAddActivity && 'col-span-full')}>
            <Link href={{ pathname: '/schedule', query: { view: 'day', date } }}>{t('open')}</Link>
          </Button>
        </div>
      </div>
    </SectionCard>
  );
}
