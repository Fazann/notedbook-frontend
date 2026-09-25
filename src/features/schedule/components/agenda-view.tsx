'use client';

import { CalendarRange, MapPin, Repeat } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { useOccurrenceChunks } from '../hooks';
import { AGENDA_DAYS, type Occurrence } from '../types';
import { useScheduleFormat } from '../use-schedule-format';

import { ACTIVITY_TYPE_CLASSES } from './activity-type';

export type AgendaViewProps = {
  /** First day of the list. */
  from: string;
  today: string;
  onOccurrenceClick: (occurrence: Occurrence, anchor: HTMLElement) => void;
};

/** The next 14 days as a list grouped by day (empty days skipped) — the simplest view for phones and screen readers. */
export function AgendaView({ from, today, onOccurrenceClick }: AgendaViewProps) {
  const t = useTranslations('schedule');
  const format = useScheduleFormat();
  const [chunks, setChunks] = useState({ from, count: 1 });
  // A new start date resets "load more".
  if (chunks.from !== from) setChunks({ from, count: 1 });
  const query = useOccurrenceChunks(from, AGENDA_DAYS, chunks.from === from ? chunks.count : 1);

  if (query.isError) {
    return (
      <Card>
        <ErrorState message={t('loadError')} onRetry={() => void query.refetch()} />
      </Card>
    );
  }
  if (!query.data) {
    return (
      <div className="space-y-4" aria-busy>
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ))}
      </div>
    );
  }

  const groups = new Map<string, Occurrence[]>();
  for (const o of query.data) groups.set(o.date, [...(groups.get(o.date) ?? []), o]);

  if (groups.size === 0 && chunks.count === 1) {
    return (
      <Card>
        <EmptyState icon={<CalendarRange />} title={t('agenda.noMore')} />
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {[...groups].map(([date, items]) => (
        <section key={date} aria-labelledby={`agenda-${date}`} className="space-y-2">
          <h3
            id={`agenda-${date}`}
            className={cn('text-sm font-semibold', date === today ? 'text-primary' : 'text-muted-foreground')}
          >
            {format.dayHeading(date, today)}
          </h3>
          <ul className="space-y-2">
            {items.map((o) => (
              <li key={o.key}>
                <button
                  type="button"
                  onClick={(e) => onOccurrenceClick(o, e.currentTarget)}
                  aria-label={format.blockLabel(o)}
                  className={cn(
                    'bg-card flex w-full items-start gap-3 rounded-xl px-4 py-3 text-left ring-1 ring-foreground/10',
                    'hover:bg-muted/50 focus-visible:ring-ring outline-none focus-visible:ring-2'
                  )}
                >
                  <span className="w-28 shrink-0 text-sm tabular-nums sm:w-40">
                    {format.timeRange(o.startTime, o.endTime)}
                  </span>
                  <span className="min-w-0 flex-1 space-y-0.5">
                    <span className="block font-medium break-words">{o.title}</span>
                    <span className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
                      <span className="flex items-center gap-1.5">
                        <span className={cn('size-2 rounded-full', ACTIVITY_TYPE_CLASSES[o.type].dot)} aria-hidden />
                        {t(`types.${o.type}`)}
                      </span>
                      {o.location && (
                        <span className="flex min-w-0 items-center gap-1">
                          <MapPin className="size-3 shrink-0" aria-hidden />
                          <span className="break-words">{o.location}</span>
                        </span>
                      )}
                      {o.isRecurring && <Repeat className="size-3" aria-hidden />}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <div className="flex flex-col items-center gap-2">
        {groups.size === 0 && <p className="text-muted-foreground text-sm">{t('agenda.noMore')}</p>}
        <Button
          variant="outline"
          size="touch"
          disabled={query.isFetchingMore}
          onClick={() => setChunks((c) => ({ ...c, count: c.count + 1 }))}
        >
          {t('agenda.loadMore')}
        </Button>
      </div>
    </div>
  );
}
