'use client';

import { AlertTriangle, CalendarDays, CheckCircle2, Clock } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import { utcDate } from '@/lib/dates';
import { todayInTz } from '@/lib/time';
import { cn } from '@/lib/utils';

import type { GoalSummary } from '../types';
import { getDueState } from '../utils';

export type GoalDueBadgeProps = {
  goal: Pick<GoalSummary, 'status' | 'targetDate' | 'completedAt'>;
  className?: string;
};

/**
 * Overdue (red badge), due today / soon (amber badge), on track (muted date) or completed.
 * Always icon + text, never color alone.
 */
export function GoalDueBadge({ goal, className }: GoalDueBadgeProps) {
  const t = useTranslations('planning.due');
  const format = useFormatter();
  const state = getDueState(goal, todayInTz());
  // `h-auto whitespace-normal`: Khmer text needs to wrap and grow.
  const badge = cn('h-auto whitespace-normal', className);
  const muted = cn('text-muted-foreground inline-flex items-center gap-1.5 text-xs', className);

  switch (state.kind) {
    case 'overdue':
      return (
        <Badge variant="destructive" className={badge}>
          <AlertTriangle aria-hidden />
          {t('overdue', { days: state.days })}
        </Badge>
      );
    case 'dueToday':
    case 'dueSoon':
      return (
        <Badge variant="warning" className={badge}>
          <Clock aria-hidden />
          {state.kind === 'dueToday' ? t('dueToday') : t('daysLeft', { days: state.days })}
        </Badge>
      );
    case 'onTrack':
      return (
        <span className={muted}>
          <CalendarDays className="size-3.5" aria-hidden />
          {t('dueOn', {
            date: format.dateTime(utcDate(state.date), { dateStyle: 'medium', timeZone: 'UTC' }),
          })}
        </span>
      );
    case 'noDate':
      return <span className={muted}>{t('noDate')}</span>;
    case 'done':
      return (
        <span className={cn(muted, 'text-success')}>
          <CheckCircle2 className="size-3.5" aria-hidden />
          {state.completedAt
            ? t('completedOn', { date: format.dateTime(new Date(state.completedAt), { dateStyle: 'medium' }) })
            : null}
        </span>
      );
  }
}
