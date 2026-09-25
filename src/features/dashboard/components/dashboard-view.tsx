'use client';

import { Plus } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import { MonthPicker } from '@/components/shared/month-picker';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { TodaySchedule } from '@/features/schedule/components/today-schedule';
import { currentMonth, utcDate } from '@/lib/dates';
import { useUiStore } from '@/stores/ui-store';

import { ActiveGoals } from './active-goals';
import { CategoryBreakdownChart } from './category-breakdown-chart';
import { DailySpendingChart } from './daily-spending-chart';
import { Greeting } from './greeting';
import { RecentExpenses } from './recent-expenses';
import { SpendingStats } from './spending-stats';
import { TasksDueSoon } from './tasks-due-soon';

/**
 * Grid: DOM order is the desktop order. On phones and tablets `order-*` moves the lists above the charts;
 * from `lg` every item goes back to `order-none` on a 12-column grid.
 */
export function DashboardView() {
  const t = useTranslations('dashboard');
  const te = useTranslations('expense');
  const format = useFormatter();
  const month = useUiStore((s) => s.month);
  const setMonth = useUiStore((s) => s.setMonth);
  const openQuickAdd = useUiStore((s) => s.openQuickAdd);

  const monthLabel = format.dateTime(utcDate(month), { month: 'long', year: 'numeric', timeZone: 'UTC' });

  return (
    <div className="space-y-4 md:space-y-6">
      <PageHeader
        title={<Greeting />}
        description={t('subtitle', { month: monthLabel })}
        actions={
          <>
            <MonthPicker value={month} onChange={setMonth} max={currentMonth()} className="w-full sm:w-auto" />
            <Button size="touch" onClick={openQuickAdd} className="hidden md:inline-flex">
              <Plus aria-hidden />
              {te('add')}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12">
        <div className="order-1 col-span-full lg:order-none">
          <SpendingStats month={month} />
        </div>
        <DailySpendingChart month={month} className="order-6 md:col-span-2 lg:order-none lg:col-span-8" />
        <CategoryBreakdownChart month={month} className="order-7 md:col-span-2 lg:order-none lg:col-span-4" />
        <RecentExpenses month={month} className="order-2 lg:order-none lg:col-span-7" />
        <TodaySchedule className="order-3 lg:order-none lg:col-span-5" />
        <ActiveGoals className="order-4 lg:order-none lg:col-span-5" />
        <TasksDueSoon className="order-5 lg:order-none lg:col-span-7" />
      </div>
    </div>
  );
}
