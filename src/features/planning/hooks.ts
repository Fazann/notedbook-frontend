'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Paginated } from '@/lib/list';
import { calcPosition } from '@/lib/position';
import { qk } from '@/lib/query-keys';
import * as api from '@/services/planning/planning-service';

import type {
  GoalDetail,
  GoalFormValues,
  GoalListParams,
  GoalStatus,
  GoalSummary,
  Milestone,
  MilestoneFormValues,
  MilestoneInput,
} from './types';
import { applyMilestoneChange, applyStatusChange, isNotFound, type MilestoneChange } from './utils';

/** One page of goals. Keeps the previous page on screen while the next loads. */
export function useGoals(params: GoalListParams) {
  return useQuery({
    queryKey: qk.goals.list(params),
    queryFn: () => api.listGoals(params),
    placeholderData: keepPreviousData,
  });
}

export function useGoalStats() {
  return useQuery({ queryKey: qk.goals.stats(), queryFn: api.getGoalStats });
}

/** A missing goal (404) is not retried — the page shows "Goal not found" right away. */
export function useGoal(id: number) {
  return useQuery({
    queryKey: qk.goals.detail(id),
    queryFn: () => api.getGoal(id),
    retry: (count, error) => !isNotFound(error) && count < 2,
  });
}

/** Lists, stats and the dashboard widget all live under `goals.list` / `goals.stats`. */
function useInvalidateGoalLists() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: qk.goals.lists }),
      queryClient.invalidateQueries({ queryKey: qk.goals.stats() }),
    ]);
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  const invalidateLists = useInvalidateGoalLists();
  return useMutation({
    mutationFn: (input: GoalFormValues) => api.createGoal(input),
    onSuccess: (goal) => {
      queryClient.setQueryData(qk.goals.detail(goal.id), goal);
      return invalidateLists();
    },
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();
  const invalidateLists = useInvalidateGoalLists();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: GoalFormValues }) => api.updateGoal(id, input),
    onSuccess: (goal) => {
      queryClient.setQueryData(qk.goals.detail(goal.id), goal);
      return invalidateLists();
    },
  });
}

type ListsSnapshot = [readonly unknown[], Paginated<GoalSummary> | undefined][];

/** Optimistic on the detail page and on every cached list page; rolled back if the API fails. */
export function useUpdateGoalStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: GoalStatus }) => api.updateGoalStatus(id, status),
    onMutate: async ({ id, status }) => {
      const now = new Date().toISOString();
      await Promise.all([
        queryClient.cancelQueries({ queryKey: qk.goals.detail(id) }),
        queryClient.cancelQueries({ queryKey: qk.goals.lists }),
      ]);
      const detail = queryClient.getQueryData<GoalDetail>(qk.goals.detail(id));
      const lists: ListsSnapshot = queryClient.getQueriesData<Paginated<GoalSummary>>({ queryKey: qk.goals.lists });

      if (detail) queryClient.setQueryData(qk.goals.detail(id), applyStatusChange(detail, status, now));
      queryClient.setQueriesData<Paginated<GoalSummary>>(
        { queryKey: qk.goals.lists },
        (old) => old && { ...old, data: old.data.map((g) => (g.id === id ? applyStatusChange(g, status, now) : g)) }
      );
      return { id, detail, lists };
    },
    onError: (_error, _vars, context) => {
      if (!context) return;
      queryClient.setQueryData(qk.goals.detail(context.id), context.detail);
      context.lists.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: qk.goals.all }),
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();
  const invalidateLists = useInvalidateGoalLists();
  return useMutation({
    mutationFn: (id: number) => api.deleteGoal(id),
    onSuccess: (_data, id) => {
      // Mark stale without refetching: the detail page is still mounted until navigation finishes,
      // and a refetch now would only flash "Goal not found".
      void queryClient.invalidateQueries({ queryKey: qk.goals.detail(id), refetchType: 'none' });
      return invalidateLists();
    },
  });
}

/** Shared mutation key, so only the last of several quick milestone changes triggers a refetch. */
const milestoneMutationKey = (goalId: number) => ['goals', goalId, 'milestones'] as const;

/** Optimistic milestone change on the goal's detail cache, using the same rules as the API. */
function useOptimisticGoal(goalId: number) {
  const queryClient = useQueryClient();
  const key = qk.goals.detail(goalId);

  return {
    apply: async (change: MilestoneChange) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<GoalDetail>(key);
      if (previous) {
        queryClient.setQueryData(key, applyMilestoneChange(previous, change, new Date().toISOString()));
      }
      return { previous };
    },
    rollback: (context: { previous?: GoalDetail } | undefined) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    /** Refresh the goal, lists, stats and dashboard once the last pending milestone change is done. */
    settle: () => {
      if (queryClient.isMutating({ mutationKey: milestoneMutationKey(goalId) }) > 1) return;
      return queryClient.invalidateQueries({ queryKey: qk.goals.all });
    },
    replace: (tempId: number, milestone: Milestone) => {
      queryClient.setQueryData<GoalDetail>(
        key,
        (goal) =>
          goal && {
            ...goal,
            // Keep the optimistic position: the real API does not return one.
            milestones: goal.milestones.map((m) => (m.id === tempId ? { ...milestone, position: m.position } : m)),
          }
      );
    },
    current: () => queryClient.getQueryData<GoalDetail>(key),
  };
}

let tempIds = 0;

/** Optimistic append with a temporary negative id, replaced by the server's milestone. */
export function useAddMilestone(goalId: number) {
  const goal = useOptimisticGoal(goalId);
  return useMutation({
    mutationKey: milestoneMutationKey(goalId),
    mutationFn: ({ input }: { input: MilestoneInput; tempId: number }) => api.addMilestone(goalId, input),
    onMutate: ({ input, tempId }) => {
      const position = input.position ?? calcPosition(goal.current()?.milestones.at(-1)?.position);
      const milestone: Milestone = {
        id: tempId,
        goalId,
        title: input.title,
        dueDate: input.dueDate,
        isDone: false,
        position,
        doneAt: null,
      };
      return goal.apply({ type: 'add', milestone });
    },
    onSuccess: (milestone, { tempId }) => goal.replace(tempId, milestone),
    onError: (_error, _vars, context) => goal.rollback(context),
    onSettled: goal.settle,
  });
}

/** A new temporary (negative) id for `useAddMilestone`. Temporary steps can't be edited until saved. */
export const nextTempMilestoneId = () => -++tempIds;

export function useUpdateMilestone(goalId: number) {
  const goal = useOptimisticGoal(goalId);
  return useMutation({
    mutationKey: milestoneMutationKey(goalId),
    mutationFn: ({ id, input }: { id: number; input: MilestoneFormValues }) => api.updateMilestone(id, input),
    onMutate: ({ id, input }) => goal.apply({ type: 'update', id, ...input }),
    onError: (_error, _vars, context) => goal.rollback(context),
    onSettled: goal.settle,
  });
}

/** Optimistic: flips the step and recomputes counts, progress and status right away. */
export function useToggleMilestone(goalId: number) {
  const goal = useOptimisticGoal(goalId);
  return useMutation({
    mutationKey: milestoneMutationKey(goalId),
    mutationFn: ({ id, isDone }: { id: number; isDone: boolean }) => api.toggleMilestone(id, isDone),
    onMutate: ({ id, isDone }) => goal.apply({ type: 'toggle', id, isDone }),
    onError: (_error, _vars, context) => goal.rollback(context),
    onSettled: goal.settle,
  });
}

/** False while the API cannot save a new step order; the list then shows no drag handles. */
export const canReorderMilestones = () => api.canMoveMilestones();

export function useMoveMilestone(goalId: number) {
  const goal = useOptimisticGoal(goalId);
  return useMutation({
    mutationKey: milestoneMutationKey(goalId),
    mutationFn: ({ id, position }: { id: number; position: number }) => api.moveMilestone(id, position),
    onMutate: ({ id, position }) => goal.apply({ type: 'move', id, position }),
    onError: (_error, _vars, context) => goal.rollback(context),
    onSettled: goal.settle,
  });
}

export function useDeleteMilestone(goalId: number) {
  const goal = useOptimisticGoal(goalId);
  return useMutation({
    mutationKey: milestoneMutationKey(goalId),
    mutationFn: (id: number) => api.deleteMilestone(id),
    onMutate: (id) => goal.apply({ type: 'delete', id }),
    onError: (_error, _vars, context) => goal.rollback(context),
    onSettled: goal.settle,
  });
}
