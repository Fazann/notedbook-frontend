'use client';

import { useTranslations } from 'next-intl';
import { useCallback } from 'react';
import { toast } from 'sonner';

import { useUpdateGoalStatus } from './hooks';
import type { GoalStatus } from './types';

/**
 * Changes a goal's status (optimistic) with the matching toast:
 * "Goal completed! 🎉" when set to done, "Goal reopened" when a done goal is reopened.
 */
export function useChangeGoalStatus() {
  const t = useTranslations('planning.toast');
  const { mutate, isPending } = useUpdateGoalStatus();

  const changeStatus = useCallback(
    (goal: { id: number; status: GoalStatus }, status: GoalStatus) => {
      if (goal.status === status) return;
      mutate(
        { id: goal.id, status },
        {
          onSuccess: () => {
            if (status === 'done') toast.success(t('completed'));
            else if (goal.status === 'done') toast.success(t('reopened'));
            else toast.success(t('updated'));
          },
          onError: () => toast.error(t('error')),
        }
      );
    },
    [mutate, t]
  );

  return { changeStatus, isPending };
}
