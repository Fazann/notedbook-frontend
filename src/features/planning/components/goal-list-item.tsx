'use client';

import { useTranslations } from 'next-intl';

import { ProgressBar } from '@/components/shared/progress-bar';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

import type { GoalSummary } from '../types';

import { GoalDueBadge } from './goal-due-badge';

export type GoalListItemProps = { goal: GoalSummary; className?: string };

/** Compact goal row (dashboard, narrow lists): title, progress bar, steps and due state. The row is a link. */
export function GoalListItem({ goal, className }: GoalListItemProps) {
  const t = useTranslations('planning');
  return (
    <Link
      href={`/planning/${goal.id}`}
      className={cn(
        'block space-y-2 rounded-lg px-2 py-3',
        'hover:bg-muted focus-visible:ring-ring/50 outline-none focus-visible:ring-3',
        className
      )}
    >
      <span className="block text-sm font-medium break-words">{goal.title}</span>
      <ProgressBar value={goal.progress} label={goal.title} showValue />
      <span className="text-muted-foreground flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs">
        <span>{t('stepsDone', { done: goal.milestonesDone, total: goal.milestonesTotal })}</span>
        <GoalDueBadge goal={goal} />
      </span>
    </Link>
  );
}
