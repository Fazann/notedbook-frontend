'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useMounted } from '@/hooks/use-mounted';
import { formatMonth } from '@/lib/calendar-locale';
import { todayInTz } from '@/lib/time';

import { useHolidays } from '../hooks';
import { useCalendarFormat } from '../use-calendar-format';
import { useCalendarParams } from '../use-calendar-params';
import { groupHolidays, holidayQuery, holidaysByDate } from '../utils';

import { CalendarToolbar } from './calendar-toolbar';
import { HolidayList } from './holiday-list';
import { MonthGrid } from './month-grid';

/** A month calendar: international only, or with Khmer lunar / Hijri dates, holidays in red and listed below. */
export function CalendarPage() {
  const t = useTranslations('calendar');
  const locale = useLocale();
  const format = useCalendarFormat();
  // Today, the lunar / Hijri dates (browser Intl data) and date-fns names render in the browser only, so the
  // server render never mismatches on hydration.
  const mounted = useMounted();
  const today = todayInTz();
  const currentMonth = today.slice(0, 7);
  const { system, region, month, setSystem, setRegion, setMonth } = useCalendarParams(currentMonth);

  const query = holidayQuery(system, region, Number(month.slice(0, 4)));
  const holidays = useHolidays(query);
  const byDate = useMemo(() => holidaysByDate(holidays.data ?? []), [holidays.data]);
  const ranges = useMemo(() => holidays.data && groupHolidays(holidays.data, month), [holidays.data, month]);
  const monthLabel = formatMonth(month, locale);

  return (
    <div className="space-y-4 md:space-y-6">
      <PageHeader title={t('title')} description={t('description')} />

      <CalendarToolbar
        system={system}
        region={region}
        month={month}
        currentMonth={currentMonth}
        onSystemChange={setSystem}
        onRegionChange={setRegion}
        onMonthChange={setMonth}
      />

      <Card className="gap-0 overflow-hidden py-0">
        <div className="space-y-0.5 px-4 py-3 md:px-6">
          <h2 className="text-lg font-semibold" aria-live="polite">
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
        {mounted ? (
          <MonthGrid month={month} system={system} today={today} holidays={byDate} label={monthLabel} />
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
  );
}
