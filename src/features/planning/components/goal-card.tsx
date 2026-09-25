'use client';

import { useTranslations } from 'next-intl';

import { DataListRowActions, type RowAction } from '@/components/shared/data-list-row-actions';
import { ProgressBar } from '@/components/shared/progress-bar';
import { Card } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

import type { GoalSummary } from '../types';

import { GoalAreaBadge } from './goal-area-badge';
import { GoalDueBadge } from './goal-due-badge';
import { GoalPriority } from './goal-priority';

export type GoalCardProps = { goal: GoalSummary; actions: RowAction[]; className?: string };

/**
 * Grid item for the goals list. The whole card links to the goal (a stretched link, so it stays one tab stop);
 * the "⋯" menu sits above the link and never triggers navigation.
 */
export function GoalCard({ goal, actions, className }: GoalCardProps) {
  const t = useTranslations('planning');
  return (
    <Card
      className={cn(
        'relative h-full gap-3 px-4 py-4 transition-shadow hover:shadow-md',
        'has-[a:focus-visible]:ring-ring/50 has-[a:focus-visible]:ring-3',
        goal.status === 'done' && 'bg-muted/40',
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 pt-1">
          <GoalAreaBadge area={goal.area} />
          <GoalPriority priority={goal.priority} />
        </div>
        <div className="relative z-10 -mt-2 -mr-2">
          <DataListRowActions actions={actions} />
        </div>
      </div>

      <h3 className="leading-snug font-medium break-words">
        <Link href={`/planning/${goal.id}`} className="outline-none after:absolute after:inset-0 after:rounded-xl">
          {goal.title}
        </Link>
      </h3>

      <div className="space-y-1.5">
        <ProgressBar value={goal.progress} label={goal.title} showValue />
        <p className="text-muted-foreground text-sm">
          {t('stepsDone', { done: goal.milestonesDone, total: goal.milestonesTotal })}
        </p>
      </div>

      <div className="mt-auto pt-1">
        <GoalDueBadge goal={goal} />
      </div>
    </Card>
  );
}
