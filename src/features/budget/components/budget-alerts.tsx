'use client';

import { CircleAlert, TriangleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Link } from '@/i18n/navigation';
import { currentMonth } from '@/lib/dates';
import { cn } from '@/lib/utils';

import { useBudgets } from '../hooks';
import { useBudgetAlert } from '../use-budget-alert';
import { budgetAlerts } from '../utils';

export type BudgetAlertsProps = {
  /** Leave out the link to the budget page, for use on that page. */
  hideLink?: boolean;
  className?: string;
};

/** Banners for the budgets near or over their limit this month. Shows nothing while loading or when all is fine. */
export function BudgetAlerts({ hideLink, className }: BudgetAlertsProps) {
  const t = useTranslations('budget.alert');
  const alertText = useBudgetAlert();
  const budgets = useBudgets(currentMonth());
  const alerts = budgetAlerts(budgets.data ?? []);

  if (alerts.length === 0) return null;

  return (
    <div className={cn('space-y-2', className)}>
      {alerts.map((budget) => {
        const { title, description } = alertText(budget);
        const over = budget.status === 'over';
        return (
          <Alert key={budget.id} variant={over ? 'destructive' : 'warning'}>
            {over ? <CircleAlert aria-hidden /> : <TriangleAlert aria-hidden />}
            <AlertTitle className="break-words">{title}</AlertTitle>
            <AlertDescription className="break-words">
              <p>{description}</p>
              {!hideLink && (
                <Link href="/budgets" className="font-medium underline underline-offset-3">
                  {t('view')}
                </Link>
              )}
            </AlertDescription>
          </Alert>
        );
      })}
    </div>
  );
}
