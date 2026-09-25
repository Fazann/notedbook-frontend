import { apiClient } from '@/lib/api-client';
import { env } from '@/lib/env';
import type { Paginated } from '@/lib/list';
import * as mock from '@/mocks/handlers/planning';

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
} from './types';

export function listGoals(params: GoalListParams): Promise<Paginated<GoalSummary>> {
  if (env.useMocks) return mock.listGoals(params);
  const query = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
    status: params.status,
  });
  if (params.search) query.set('q', params.search);
  if (params.areas.length) query.set('area', params.areas.join(','));
  if (params.sort) query.set('sort', params.sort);
  return apiClient.get(`/goals?${query}`);
}

export function getGoalStats(): Promise<GoalStats> {
  if (env.useMocks) return mock.getGoalStats();
  return apiClient.get('/goals/stats');
}

export function getGoal(id: number): Promise<GoalDetail> {
  if (env.useMocks) return mock.getGoal(id);
  return apiClient.get(`/goals/${id}`);
}

export function createGoal(input: GoalFormValues): Promise<GoalDetail> {
  if (env.useMocks) return mock.createGoal(input);
  return apiClient.post('/goals', input);
}

export function updateGoal(id: number, input: GoalFormValues): Promise<GoalDetail> {
  if (env.useMocks) return mock.updateGoal(id, input);
  return apiClient.put(`/goals/${id}`, input);
}

export function updateGoalStatus(id: number, status: GoalStatus): Promise<GoalSummary> {
  if (env.useMocks) return mock.updateGoalStatus(id, status);
  return apiClient.patch(`/goals/${id}/status`, { status });
}

export function deleteGoal(id: number): Promise<void> {
  if (env.useMocks) return mock.deleteGoal(id);
  return apiClient.delete(`/goals/${id}`);
}

/** TODO(api): POST /goals/:id/milestones should accept an optional `position` (used to undo a delete). */
export function addMilestone(goalId: number, input: MilestoneInput): Promise<Milestone> {
  if (env.useMocks) return mock.addMilestone(goalId, input);
  return apiClient.post(`/goals/${goalId}/milestones`, input);
}

export function updateMilestone(id: number, input: MilestoneFormValues): Promise<Milestone> {
  if (env.useMocks) return mock.updateMilestone(id, input);
  return apiClient.put(`/milestones/${id}`, input);
}

export function toggleMilestone(id: number, isDone: boolean): Promise<{ milestone: Milestone; goal: GoalSummary }> {
  if (env.useMocks) return mock.toggleMilestone(id, isDone);
  return apiClient.patch(`/milestones/${id}/toggle`, { isDone });
}

export function moveMilestone(id: number, position: number): Promise<Milestone> {
  if (env.useMocks) return mock.moveMilestone(id, position);
  return apiClient.patch(`/milestones/${id}/move`, { position });
}

export function deleteMilestone(id: number): Promise<{ goal: GoalSummary }> {
  if (env.useMocks) return mock.deleteMilestone(id);
  return apiClient.delete(`/milestones/${id}`);
}
