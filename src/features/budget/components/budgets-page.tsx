'use client';

import { CircleDollarSign, Pencil, Plus, Trash2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { MonthPicker } from '@/components/shared/month-picker';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useErrorMessage } from '@/hooks/use-error-message';
import { currentMonth } from '@/lib/dates';
import { CURRENCIES, formatMoney } from '@/lib/money';
import { usePreferencesStore } from '@/stores/preferences-store';

import { useBudgets, useDeleteBudget } from '../hooks';
import type { Budget } from '../types';

import { BudgetAlerts } from './budget-alerts';
import { BudgetCard } from './budget-card';
import { BudgetFormDialog } from './budget-form-dialog';

const GRID = 'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3';

export function BudgetsPage() {
  const t = useTranslations('budget');
  const tc = useTranslations('common');
  const tCurrency = useTranslations('currency');
  const locale = useLocale();
  const errorMessage = useErrorMessage();
  const preferredCurrency = usePreferencesStore((s) => s.defaultCurrency);
  const thisMonth = currentMonth();
  const [month, setMonth] = useState(thisMonth);
  const budgets = useBudgets(month);
  const remove = useDeleteBudget();

  const [form, setForm] = useState<{ open: boolean; budget?: Budget }>({ open: false });
  const [deleting, setDeleting] = useState<Budget | null>(null);

  const openAdd = () => setForm({ open: true });
  const confirmDelete = () => {
    if (!deleting) return;
    const { id } = deleting;
    setDeleting(null); // optimistic: the card is already gone
    remove.mutate(id, {
      onSuccess: () => toast.success(t('deleted')),
      onError: (error) => toast.error(errorMessage(error)),
    });
  };

  // A currency has one budget, so a new one starts in a free currency, and none can be added once all are taken.
  const free = CURRENCIES.filter((c) => !budgets.data?.some((b) => b.currency === c));
  const defaultCurrency = free.includes(preferredCurrency) ? preferredCurrency : (free[0] ?? preferredCurrency);

  const content = () => {
    if (budgets.isPending) {
      return (
        <div className={GRID}>
          <Skeleton className="h-52 rounded-xl" />
          <Skeleton className="h-52 rounded-xl" />
        </div>
      );
    }
    if (budgets.isError) {
      return (
        <Card>
          <ErrorState message={t('loadError')} onRetry={() => void budgets.refetch()} />
        </Card>
      );
    }
    if (budgets.data.length === 0) {
      return (
        <Card>
          <EmptyState
            icon={<CircleDollarSign />}
            title={t('empty.title')}
            description={t('empty.description')}
            action={
              <Button size="touch" onClick={openAdd}>
                <Plus aria-hidden />
                {t('add')}
              </Button>
            }
          />
        </Card>
      );
    }
    return (
      <div className={GRID}>
        {budgets.data.map((budget) => (
          <BudgetCard
            key={budget.id}
            budget={budget}
            actions={[
              {
                id: 'edit',
                label: tc('edit'),
                icon: <Pencil />,
                onSelect: () => setForm({ open: true, budget }),
              },
              {
                id: 'delete',
                label: tc('delete'),
                icon: <Trash2 />,
                destructive: true,
                onSelect: () => setDeleting(budget),
              },
            ]}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <>
            <MonthPicker value={month} onChange={setMonth} max={thisMonth} className="min-w-0 flex-1 sm:flex-none" />
            {budgets.data && free.length > 0 && (
              <Button size="touch" onClick={openAdd} aria-label={t('add')}>
                <Plus aria-hidden />
                <span className="hidden sm:inline">{t('add')}</span>
              </Button>
            )}
          </>
        }
      />

      {month === thisMonth && <BudgetAlerts hideLink />}
      {content()}

      <BudgetFormDialog
        open={form.open}
        budget={form.budget}
        defaultCurrency={defaultCurrency}
        onOpenChange={(open) => !open && setForm({ open: false })}
      />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t('deleteDialog.title')}
        description={
          deleting &&
          t('deleteDialog.description', {
            amount: formatMoney(deleting.amount, deleting.currency, locale),
            currency: tCurrency(deleting.currency),
          })
        }
        confirmLabel={t('deleteDialog.confirm')}
        onConfirm={confirmDelete}
        destructive
      />
    </div>
  );
}
