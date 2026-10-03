'use client';

import { ListChecks } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { EmptyState } from '@/components/shared/empty-state';
import { SectionCard } from '@/components/shared/section-card';
import { SortableList } from '@/components/shared/sortable-list';
import { cn } from '@/lib/utils';

import {
  nextTempMilestoneId,
  useAddMilestone,
  useDeleteMilestone,
  useMoveMilestone,
  useToggleMilestone,
  useUpdateMilestone,
} from '../hooks';
import type { GoalDetail, Milestone } from '../types';
import { useChangeGoalStatus } from '../use-change-goal-status';

import { MilestoneAddInput } from './milestone-add-input';
import { MilestoneItem } from './milestone-item';

export type MilestoneListProps = { goal: GoalDetail };

/**
 * The goal's steps: check, rename, set a due date, reorder (mouse, touch, keyboard) and delete with Undo.
 * Every change is optimistic; progress and status update at once and roll back if the API fails.
 */
export function MilestoneList({ goal }: MilestoneListProps) {
  const t = useTranslations('planning');
  const toggle = useToggleMilestone(goal.id);
  const update = useUpdateMilestone(goal.id);
  const move = useMoveMilestone(goal.id);
  const remove = useDeleteMilestone(goal.id);
  const add = useAddMilestone(goal.id);
  const { changeStatus } = useChangeGoalStatus();
  const { milestones } = goal;
  const hasUnsaved = milestones.some((m) => m.id < 0);
  const onError = () => toast.error(t('toast.error'));

  const handleToggle = (milestone: Milestone, isDone: boolean) => {
    // Checking the last open step never completes the goal on its own — ask the user.
    const completesAll = isDone && milestones.every((m) => m.id === milestone.id || m.isDone);
    toggle.mutate(
      { id: milestone.id, isDone },
      {
        onSuccess: ({ goal: updated }) => {
          if (!completesAll || updated.status === 'done') return;
          toast.success(t('milestones.allDonePrompt'), {
            action: { label: t('actions.markDone'), onClick: () => changeStatus(updated, 'done') },
          });
        },
        onError,
      }
    );
  };

  const handleDelete = ({ id, title, dueDate, position }: Milestone) => {
    remove.mutate(id, {
      onSuccess: () =>
        toast.success(t('milestones.deleted'), {
          action: {
            label: t('milestones.undo'),
            onClick: () =>
              add.mutate({ input: { title, dueDate, position }, tempId: nextTempMilestoneId() }, { onError }),
          },
        }),
      onError,
    });
  };

  const rename = (milestone: Milestone, patch: Partial<Pick<Milestone, 'title' | 'dueDate'>>) =>
    update.mutate(
      { id: milestone.id, input: { title: milestone.title, dueDate: milestone.dueDate, ...patch } },
      { onError }
    );

  const renderItem = (milestone: Milestone, handle: React.ReactNode) => (
    <MilestoneItem
      milestone={milestone}
      handle={handle}
      isSaving={milestone.id < 0}
      onToggle={(isDone) => handleToggle(milestone, isDone)}
      onRename={(title) => rename(milestone, { title })}
      onDueDateChange={(dueDate) => rename(milestone, { dueDate })}
      onDelete={() => handleDelete(milestone)}
    />
  );

  const announce = (key: 'picked' | 'moved' | 'dropped') => (m: Milestone, position: number, total: number) =>
    t(`milestones.dnd.${key}`, { title: m.title, position, total });

  return (
    <SectionCard
      // `overflow-visible` so the add-step bar can stick above the bottom nav on phones.
      className="overflow-visible"
      title={t('milestones.title')}
      action={
        milestones.length > 0 && (
          <span className="text-muted-foreground text-sm">
            {t('milestones.doneCount', { done: goal.milestonesDone, total: goal.milestonesTotal })}
          </span>
        )
      }
    >
      {milestones.length === 0 ? (
        <EmptyState
          icon={<ListChecks />}
          title={t('milestones.emptyTitle')}
          description={t('milestones.emptyDescription')}
          className="py-6"
        />
      ) : (
        <SortableList
          items={milestones}
          aria-label={t('milestones.title')}
          handleLabel={t('milestones.dragHandle')}
          // Positions are only final once every new step has its real id.
          disabled={hasUnsaved}
          onMove={(id, position) => move.mutate({ id, position }, { onError })}
          screenReaderInstructions={t('milestones.dnd.instructions')}
          announcements={{
            picked: announce('picked'),
            moved: announce('moved'),
            dropped: announce('dropped'),
            cancelled: () => t('milestones.dnd.cancelled'),
          }}
          className="-mx-2"
          renderItem={(milestone, { handle }) => renderItem(milestone, handle)}
        />
      )}

      <MilestoneAddInput
        goalId={goal.id}
        autoFocus={milestones.length === 0}
        // Phones: stays above the bottom nav while scrolling, leaving room for the quick-add button.
        className={cn(
          'bg-card sticky bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-10 -mx-2 mt-3 border-t px-2 py-2',
          'pr-[4.5rem] md:static md:mx-0 md:border-t-0 md:px-0 md:pr-0'
        )}
      />
    </SectionCard>
  );
}
