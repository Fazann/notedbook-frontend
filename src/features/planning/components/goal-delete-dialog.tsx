'use client';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/shared/confirm-dialog';

import { useDeleteGoal } from '../hooks';
import type { GoalSummary } from '../types';

export type GoalDeleteDialogProps = {
  /** The goal to delete; `null` closes the dialog. */
  goal: Pick<GoalSummary, 'id' | 'title'> | null;
  onOpenChange: (open: boolean) => void;
  /** After a successful delete (e.g. go back to the list). */
  onDeleted?: () => void;
};

/** "Delete “{title}”? All its steps will be deleted too." — stays open with a spinner until the API answers. */
export function GoalDeleteDialog({ goal, onOpenChange, onDeleted }: GoalDeleteDialogProps) {
  const t = useTranslations('planning');
  const remove = useDeleteGoal();

  return (
    <ConfirmDialog
      open={goal !== null}
      onOpenChange={(open) => !remove.isPending && onOpenChange(open)}
      title={goal && t('deleteDialog.title', { title: goal.title })}
      description={t('deleteDialog.description')}
      confirmLabel={t('deleteDialog.confirm')}
      destructive
      isPending={remove.isPending}
      onConfirm={() => {
        if (!goal) return;
        remove.mutate(goal.id, {
          onSuccess: () => {
            toast.success(t('toast.deleted'));
            onOpenChange(false);
            onDeleted?.();
          },
          onError: () => toast.error(t('toast.error')),
        });
      }}
    />
  );
}
