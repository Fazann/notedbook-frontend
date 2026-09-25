'use client';

import { CheckCircle2, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import type { RowAction } from '@/components/shared/data-list-row-actions';

import type { GoalSummary } from './types';
import { useChangeGoalStatus } from './use-change-goal-status';

export type UseGoalActionsOptions = {
  onEdit: (goal: GoalSummary) => void;
  onDelete: (goal: GoalSummary) => void;
  /** Leave out "Edit" (e.g. when the page already shows an Edit button). */
  hideEdit?: boolean;
};

/** The goal "⋯" menu: Edit, Mark as done / Reopen, Delete — the same on cards and on the detail page. */
export function useGoalActions({ onEdit, onDelete, hideEdit }: UseGoalActionsOptions) {
  const t = useTranslations('planning.actions');
  const { changeStatus } = useChangeGoalStatus();

  return (goal: GoalSummary): RowAction[] => [
    ...(hideEdit ? [] : [{ id: 'edit', label: t('edit'), icon: <Pencil />, onSelect: () => onEdit(goal) }]),
    goal.status === 'done'
      ? { id: 'reopen', label: t('reopen'), icon: <RotateCcw />, onSelect: () => changeStatus(goal, 'in_progress') }
      : { id: 'done', label: t('markDone'), icon: <CheckCircle2 />, onSelect: () => changeStatus(goal, 'done') },
    { id: 'delete', label: t('delete'), icon: <Trash2 />, destructive: true, onSelect: () => onDelete(goal) },
  ];
}
