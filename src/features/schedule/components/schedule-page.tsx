'use client';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { ErrorState } from '@/components/shared/error-state';
import { FloatingActionButton } from '@/components/shared/floating-action-button';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useMounted } from '@/hooks/use-mounted';
import { addDays, startOfWeek } from '@/lib/time';

import { useOccurrences } from '../hooks';
import { AGENDA_DAYS, type Occurrence } from '../types';
import { useNow } from '../use-now';
import { useOccurrenceActions } from '../use-occurrence-actions';
import { useScheduleFormat } from '../use-schedule-format';
import { useScheduleParams } from '../use-schedule-params';
import { useScheduleShortcuts } from '../use-schedule-shortcuts';
import { nextHalfHour } from '../utils';

import { ActivityDetails } from './activity-details';
import { ActivityFormDialog, type ActivityFormTarget } from './activity-form-dialog';
import { AgendaView } from './agenda-view';
import { DayView } from './day-view';
import { ScheduleToolbar } from './schedule-toolbar';
import { WeekSummary } from './week-summary';
import { WeekView } from './week-view';

const STEP_DAYS = { week: 7, day: 1, agenda: AGENDA_DAYS } as const;

export function SchedulePage() {
  const t = useTranslations('schedule');
  const format = useScheduleFormat();
  // The views depend on the clock, the screen size and the browser's Intl data, so they render in the browser only
  // (the server can't know them — rendering there would mismatch on hydration).
  const mounted = useMounted();
  const { today, nowMinutes } = useNow();
  const { view, date, isDesktop, setView, setDate } = useScheduleParams(today);
  const weekStart = startOfWeek(date);
  const weekEnd = addDays(weekStart, 6);
  // Week and day views share the week's occurrences (the day view's strip shows which days are busy).
  const week = useOccurrences(weekStart, weekEnd);
  const actions = useOccurrenceActions();

  const [formTarget, setFormTarget] = useState<ActivityFormTarget | null>(null);
  const [details, setDetails] = useState<{ occurrence: Occurrence; anchor: HTMLElement } | null>(null);

  const step = STEP_DAYS[view];
  const openNew = (day = date, startTime?: string) =>
    setFormTarget({
      kind: 'new',
      date: day,
      startTime: startTime ?? (day === today ? nextHalfHour(nowMinutes) : '09:00'),
    });

  useScheduleShortcuts(
    {
      previous: () => setDate(addDays(date, -step)),
      next: () => setDate(addDays(date, step)),
      today: () => setDate(today),
      create: () => openNew(),
      week: () => setView('week'),
      day: () => setView('day'),
      agenda: () => setView('agenda'),
    },
    isDesktop && formTarget === null && details === null
  );

  let rangeLabel = format.dateRange(weekStart, weekEnd);
  if (view === 'day')
    rangeLabel = format.date(date, { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
  if (view === 'agenda') rangeLabel = format.dateRange(date, addDays(date, AGENDA_DAYS - 1));

  const gridProps = {
    occurrences: week.data,
    isLoading: week.isPending,
    isFetching: week.isPlaceholderData,
    today,
    nowMinutes,
    onSlotClick: (day: string, time: string) => openNew(day, time),
    onOccurrenceClick: (occurrence: Occurrence, anchor: HTMLElement) => setDetails({ occurrence, anchor }),
    // Drag to move: mouse + keyboard on desktop only (long-press conflicts with scrolling on touch).
    onMove: isDesktop ? actions.requestMove : undefined,
  };

  const renderView = () => {
    if (!mounted) return <Skeleton className="h-[60dvh] w-full rounded-xl" />;
    if (view === 'agenda') {
      return <AgendaView from={date} today={today} onOccurrenceClick={gridProps.onOccurrenceClick} />;
    }
    if (week.isError) {
      return (
        <Card>
          <ErrorState message={t('loadError')} onRetry={() => void week.refetch()} />
        </Card>
      );
    }
    if (view === 'week') return <WeekView weekStart={weekStart} {...gridProps} />;
    return <DayView date={date} weekStart={weekStart} onDateChange={setDate} {...gridProps} />;
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <Button size="touch" onClick={() => openNew()} className="hidden md:inline-flex" aria-keyshortcuts="N">
            <Plus aria-hidden />
            {t('newActivity')}
          </Button>
        }
      />

      <ScheduleToolbar
        view={view}
        rangeLabel={rangeLabel}
        isDesktop={isDesktop}
        onPrevious={() => setDate(addDays(date, -step))}
        onNext={() => setDate(addDays(date, step))}
        onToday={() => setDate(today)}
        onViewChange={setView}
      />

      {mounted && view === 'week' && <WeekSummary from={weekStart} to={weekEnd} occurrences={week.data} />}

      {renderView()}

      <FloatingActionButton onClick={() => openNew()} aria-label={t('newActivity')}>
        <Plus aria-hidden />
      </FloatingActionButton>

      <ActivityDetails
        occurrence={details?.occurrence ?? null}
        anchor={details?.anchor ?? null}
        onClose={() => setDetails(null)}
        onEdit={(occurrence) => {
          setDetails(null);
          setFormTarget({ kind: 'edit', occurrence });
        }}
        onDelete={(occurrence) => {
          setDetails(null);
          actions.requestDelete(occurrence);
        }}
      />
      <ActivityFormDialog target={formTarget} onClose={() => setFormTarget(null)} />
      {actions.dialogs}
    </div>
  );
}
