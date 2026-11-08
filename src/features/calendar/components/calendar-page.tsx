'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useMounted } from '@/hooks/use-mounted';
import { formatMonth } from '@/lib/calendar-locale';
import { shiftMonth } from '@/lib/dates';
import { todayInTz } from '@/lib/time';
import { cn } from '@/lib/utils';

import { useHolidays, useScheduleOccurrences } from '../hooks';
import { useCalendarFormat } from '../use-calendar-format';
import { useCalendarParams } from '../use-calendar-params';
import { gridRange, groupHolidays, holidayQuery, holidaysByDate, monthWeeks, occurrencesByDate } from '../utils';

import { CalendarToolbar } from './calendar-toolbar';
import { DayDetails } from './day-details';
import { HolidayList } from './holiday-list';
import { MonthGrid } from './month-grid';

/**
 * A month calendar: international only, or with Khmer lunar / Hijri dates, holidays in red, plus the user's schedule
 * on the shown dates. Clicking a day (or moving to it with the arrow keys) shows its holidays and activities beside
 * the grid (below it on phones).
 */
export function CalendarPage() {
  const t = useTranslations('calendar');
  const tNav = useTranslations('monthPicker');
  const locale = useLocale();
  const format = useCalendarFormat();
  // Today, the lunar / Hijri dates (browser Intl data) and date-fns names render in the browser only, so the
  // server render never mismatches on hydration.
  const mounted = useMounted();
  const today = todayInTz();
  const currentMonth = today.slice(0, 7);
  const { system, region, month, setSystem, setRegion, setMonth } = useCalendarParams(currentMonth);

  // The picked day; it falls back to today (this month) or the 1st when the user moves to another month.
  const [picked, setPicked] = useState<string | null>(null);
  const selected = picked?.startsWith(month) ? picked : month === currentMonth ? today : `${month}-01`;
  const selectDay = (date: string) => {
    setPicked(date);
    if (!date.startsWith(month)) setMonth(date.slice(0, 7));
  };
  const goToday = () => {
    setPicked(today);
    setMonth(currentMonth);
  };

  const query = holidayQuery(system, region, Number(month.slice(0, 4)));
  const holidays = useHolidays(query);
  const byDate = useMemo(() => holidaysByDate(holidays.data ?? []), [holidays.data]);
  const ranges = useMemo(() => holidays.data && groupHolidays(holidays.data, month), [holidays.data, month]);
  const monthLabel = formatMonth(month, locale);

  // The user's schedule on every date the grid shows (incl. the days of the previous / next month that fill the rows).
  const { from, to } = useMemo(() => gridRange(monthWeeks(month)), [month]);
  const occurrences = useScheduleOccurrences(from, to);
  const schedule = useMemo(() => occurrences.data && occurrencesByDate(occurrences.data), [occurrences.data]);

  return (
    <div className="space-y-4 md:space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <CalendarToolbar system={system} region={region} onSystemChange={setSystem} onRegionChange={setRegion} />
        }
      />

      <div
        className={cn(
          'grid gap-4 md:gap-6 lg:items-start',
          'lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_24rem]'
        )}
      >
        <Card className="min-w-0 gap-0 overflow-hidden py-0">
          <div className="flex items-center gap-2 px-4 py-3 md:px-6 md:py-4">
            <div className="min-w-0 flex-1 space-y-0.5">
              <h2 className="text-xl font-semibold md:text-2xl" aria-live="polite">
                {monthLabel}
              </h2>
              {system !== 'gregorian' &&
                (mounted ? (
                  <p className="text-muted-foreground text-sm leading-relaxed break-words">
                    {format.monthNote(month, system)}
                  </p>
                ) : (
                  <Skeleton className="h-5 w-48" />
                ))}
            </div>
            <Button variant="outline" size="touch" onClick={goToday} disabled={selected === today}>
              {t('today')}
            </Button>
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon-touch"
                onClick={() => setMonth(shiftMonth(month, -1))}
                aria-label={tNav('previous')}
              >
                <ChevronLeft aria-hidden />
              </Button>
              <Button
                variant="ghost"
                size="icon-touch"
                onClick={() => setMonth(shiftMonth(month, 1))}
                aria-label={tNav('next')}
              >
                <ChevronRight aria-hidden />
              </Button>
            </div>
          </div>
          {mounted ? (
            <MonthGrid
              month={month}
              system={system}
              today={today}
              holidays={byDate}
              schedule={schedule}
              selected={selected}
              onSelect={selectDay}
              label={monthLabel}
            />
          ) : (
            <Skeleton className="mx-4 mb-4 h-96 md:mx-6" />
          )}
          {system !== 'gregorian' && (
            <p className="text-muted-foreground flex items-center gap-2 border-t px-4 py-2 text-xs md:px-6">
              <span aria-hidden className="bg-holiday size-2 rounded-full" />
              {t('legend')}
            </p>
          )}
        </Card>

        <div className="min-w-0 space-y-4 md:space-y-6">
          {mounted ? (
            <DayDetails
              date={selected}
              today={today}
              system={system}
              holidays={selected.startsWith(month) ? (byDate.get(selected) ?? []) : []}
              activities={schedule ? (schedule.get(selected) ?? []) : undefined}
              isError={occurrences.isError}
              onRetry={() => void occurrences.refetch()}
            />
          ) : (
            <Skeleton className="h-64 w-full rounded-xl" />
          )}

          {system !== 'gregorian' && (
            <HolidayList
              title={t('holidays.title', { month: monthLabel })}
              holidays={mounted ? ranges : undefined}
              system={system}
              isError={holidays.isError}
              onRetry={() => void holidays.refetch()}
            />
          )}
        </div>
      </div>
    </div>
  );
}
