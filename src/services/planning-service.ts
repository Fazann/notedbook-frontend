import type {
  GoalDetail,
  GoalFormValues,
  GoalListParams,
  GoalStats,
  GoalStatus,
  GoalSummary,
  Milestone,
  MilestoneFormValues,
  MilestoneInput,
} from '@/features/planning/types';
import { env } from '@/lib/env';
import type { Paginated } from '@/lib/list';
import * as mock from '@/mocks/handlers/planning';

import { apiCall } from './api-call';
import { ApiEndpoint, buildPath } from './api-endpoints';

// Goals are `plans` and milestones are `steps` in the API.

/** TODO(api): the API filters by one `area_id`; the UI sends several area keys in `area`. */
export function listGoals(params: GoalListParams): Promise<Paginated<GoalSummary>> {
  if (env.useMocks) return mock.listGoals(params);
  return apiCall.getPage(ApiEndpoint.Plans, {
    page: params.page,
    pageSize: params.pageSize,
    status: params.status,
    q: params.search || undefined,
    area: params.areas.length ? params.areas.join(',') : undefined,
    sort: params.sort || undefined,
  });
}

export function getGoalStats(): Promise<GoalStats> {
  if (env.useMocks) return mock.getGoalStats();
  return apiCall.get(ApiEndpoint.PlanStats);
}

export function getGoal(id: number): Promise<GoalDetail> {
  if (env.useMocks) return mock.getGoal(id);
  return apiCall.get(buildPath(ApiEndpoint.PlanDetail, { id }));
}

export function createGoal(input: GoalFormValues): Promise<GoalDetail> {
  if (env.useMocks) return mock.createGoal(input);
  return apiCall.post(ApiEndpoint.Plans, input);
}

export function updateGoal(id: number, input: GoalFormValues): Promise<GoalDetail> {
  if (env.useMocks) return mock.updateGoal(id, input);
  return apiCall.put(buildPath(ApiEndpoint.PlanDetail, { id }), input);
}

export function updateGoalStatus(id: number, status: GoalStatus): Promise<GoalSummary> {
  if (env.useMocks) return mock.updateGoalStatus(id, status);
  return apiCall.patch(buildPath(ApiEndpoint.PlanStatus, { id }), { status });
}

export function deleteGoal(id: number): Promise<void> {
  if (env.useMocks) return mock.deleteGoal(id);
  return apiCall.delete(buildPath(ApiEndpoint.PlanDetail, { id }));
}

/** TODO(api): POST /plans/:id/steps should accept an optional `position` (used to undo a delete). */
export function addMilestone(goalId: number, input: MilestoneInput): Promise<Milestone> {
  if (env.useMocks) return mock.addMilestone(goalId, input);
  return apiCall.post(buildPath(ApiEndpoint.PlanSteps, { id: goalId }), input);
}

export function updateMilestone(id: number, input: MilestoneFormValues): Promise<Milestone> {
  if (env.useMocks) return mock.updateMilestone(id, input);
  return apiCall.put(buildPath(ApiEndpoint.StepDetail, { id }), input);
}

export function toggleMilestone(id: number, isDone: boolean): Promise<{ milestone: Milestone; goal: GoalSummary }> {
  if (env.useMocks) return mock.toggleMilestone(id, isDone);
  return apiCall.patch(buildPath(ApiEndpoint.StepToggle, { id }), { isDone });
}

export function moveMilestone(id: number, position: number): Promise<Milestone> {
  if (env.useMocks) return mock.moveMilestone(id, position);
  return apiCall.patch(buildPath(ApiEndpoint.StepMove, { id }), { position });
}

export function deleteMilestone(id: number): Promise<{ goal: GoalSummary }> {
  if (env.useMocks) return mock.deleteMilestone(id);
  return apiCall.delete(buildPath(ApiEndpoint.StepDetail, { id }));
}
