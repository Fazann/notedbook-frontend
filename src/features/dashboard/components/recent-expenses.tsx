'use client';

import { differenceInCalendarDays } from 'date-fns';
import { Plus, Receipt } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useState } from 'react';

import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { MoneyText } from '@/components/shared/money-text';
import { SectionCard } from '@/components/shared/section-card';
import { Button } from '@/components/ui/button';
import { CategoryIcon } from '@/features/expense/components/category-icon';
import { ExpenseFormDialog } from '@/features/expense/components/expense-form-dialog';
import { useCategoryOptions, useExpenses } from '@/features/expense/hooks';
import type { Expense } from '@/features/expense/types';
import { useCategoryName } from '@/features/expense/use-category-name';
import { Link } from '@/i18n/navigation';
import { parseDate, utcDate } from '@/lib/dates';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/ui-store';

import { ListSkeleton } from './list-skeleton';

export type RecentExpensesProps = { month: string; className?: string };

export function RecentExpenses({ month, className }: RecentExpensesProps) {
  const t = useTranslations('dashboard');
  const tc = useTranslations('common');
  const format = useFormatter();
  const categoryName = useCategoryName();
  const openQuickAdd = useUiStore((s) => s.openQuickAdd);
  const expenses = useExpenses(month);
  const categories = useCategoryOptions();
  const [editing, setEditing] = useState<Expense | undefined>();

  const relativeDay = (date: string) => {
    const diff = differenceInCalendarDays(new Date(), parseDate(date));
    if (diff === 0) return tc('today');
    if (diff === 1) return tc('yesterday');
    return format.dateTime(utcDate(date), { day: 'numeric', month: 'short', timeZone: 'UTC' });
  };

  const renderBody = () => {
    if (expenses.isPending || categories.isPending) return <ListSkeleton rows={6} />;
    if (expenses.isError || categories.isError) {
      return <ErrorState message={t('error')} onRetry={() => void expenses.refetch()} />;
    }
    if (expenses.data.length === 0) {
      return (
        <EmptyState
          icon={<Receipt />}
          title={t('recent.empty')}
          action={
            <Button size="touch" onClick={openQuickAdd}>
              <Plus aria-hidden />
              {t('recent.emptyAction')}
            </Button>
          }
        />
      );
    }

    return (
      <ul className="-mx-2">
        {expenses.data.slice(0, 6).map((expense) => {
          const category = categories.data.find((c) => c.id === expense.category_id);
          const label = categoryName(category);
          return (
            <li key={expense.id}>
              <button
                type="button"
                onClick={() => setEditing(expense)}
                className={cn(
                  'flex min-h-14 w-full items-center gap-3 rounded-lg px-2 py-2 text-left',
                  'hover:bg-muted focus-visible:ring-ring/50 outline-none focus-visible:ring-3'
                )}
              >
                <CategoryIcon icon={category?.icon} color={category?.color} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{expense.note || label}</span>
                  <span className="text-muted-foreground mt-0.5 flex items-center gap-2 text-xs">
                    <span className="max-w-32 truncate font-medium">{label}</span>
                    <span aria-hidden>·</span>
                    <span className="truncate">{relativeDay(expense.spent_at)}</span>
                  </span>
                </span>
                <MoneyText
                  amount={expense.amount}
                  currency={expense.currency}
                  negative
                  className="text-sm font-medium"
                />
              </button>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <SectionCard
      className={className}
      title={t('recent.title')}
      action={
        <Button variant="ghost" size="sm" asChild>
          <Link href="/expenses">{tc('viewAll')}</Link>
        </Button>
      }
    >
      {renderBody()}
      <ExpenseFormDialog
        open={editing !== undefined}
        onOpenChange={(open) => !open && setEditing(undefined)}
        expense={editing}
      />
    </SectionCard>
  );
}
