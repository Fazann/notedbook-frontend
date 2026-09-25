'use client';

import { Target } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { SectionCard } from '@/components/shared/section-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { GoalListItem } from '@/features/planning/components/goal-list-item';
import { useGoals } from '@/features/planning/hooks';
import type { GoalListParams } from '@/features/planning/types';
import { Link } from '@/i18n/navigation';

/** The 4 active goals due soonest. Refreshes after any goal or step change (they invalidate `goals.all`). */
const PARAMS: GoalListParams = {
  page: 1,
  pageSize: 4,
  search: '',
  sort: 'targetDate',
  status: 'active',
  areas: [],
};

export type ActiveGoalsProps = { className?: string };

export function ActiveGoals({ className }: ActiveGoalsProps) {
  const t = useTranslations('dashboard');
  const tp = useTranslations('planning.dashboard');
  const goals = useGoals(PARAMS);

  const renderBody = () => {
    if (goals.isPending) {
      return (
        <div className="space-y-5" aria-hidden>
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          ))}
        </div>
      );
    }
    if (goals.isError) return <ErrorState message={t('error')} onRetry={() => void goals.refetch()} />;
    if (goals.data.data.length === 0) return <EmptyState icon={<Target />} title={t('goals.empty')} />;

    return (
      <ul className="-mx-2">
        {goals.data.data.map((goal) => (
          <li key={goal.id}>
            <GoalListItem goal={goal} />
          </li>
        ))}
      </ul>
    );
  };

  return (
    <SectionCard
      className={className}
      title={tp('title')}
      action={
        <Button variant="ghost" size="sm" asChild>
          <Link href="/planning">{tp('viewAll')}</Link>
        </Button>
      }
    >
      {renderBody()}
    </SectionCard>
  );
}
