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
import { isMocked } from '@/lib/env';
import type { Paginated } from '@/lib/list';
import { todayInTz } from '@/lib/time';
import * as mock from '@/mocks/handlers/planning';

import { apiCall } from '../core/api-call';
import { ApiEndpoint, buildPath } from '../core/api-endpoints';

import {
  type ApiPlan,
  type ApiPlanArea,
  type ApiPlanDetail,
  type ApiPlanStats,
  type ApiPlanStep,
  type AreaMap,
  toApiSort,
  toApiStatus,
  toApiStatusFilter,
  toAreaMap,
  toGoalDetail,
  toGoalStats,
  toGoalSummary,
  toMilestone,
  toPlanBody,
  toStepBody,
} from './planning-mappers';

// Goals are `plans` and milestones are `steps` in the API.

let areasRequest: Promise<AreaMap> | null = null;

/** The plan areas never change at runtime, so they are loaded once (and again after a failure). */
function getAreas(): Promise<AreaMap> {
  areasRequest ??= apiCall
    .get<ApiPlanArea[]>(ApiEndpoint.PlanAreas)
    .then(toAreaMap)
    .catch((error: unknown) => {
      areasRequest = null;
      throw error;
    });
  return areasRequest;
}

/** One page of goals; `areas` are sent as their API ids. */
export async function listGoals(params: GoalListParams): Promise<Paginated<GoalSummary>> {
  if (isMocked('planning')) return mock.listGoals(params);
  const areas = await getAreas();
  const page = await apiCall.getPage<ApiPlan>(ApiEndpoint.Plans, {
    page: params.page,
    pageSize: params.pageSize,
    status: toApiStatusFilter(params.status),
    area_id: params.areas.length ? params.areas.map(areas.idOf).join(',') : undefined,
    q: params.search.trim() || undefined,
    sort: params.sort ? toApiSort(params.sort) : undefined,
  });
  return { ...page, data: page.data.map((p) => toGoalSummary(p, areas)) };
}

/** `today` is sent so "overdue" and "this year" follow the app's time zone. */
export async function getGoalStats(): Promise<GoalStats> {
  if (isMocked('planning')) return mock.getGoalStats();
  return toGoalStats(await apiCall.get<ApiPlanStats>(ApiEndpoint.PlanStats, { today: todayInTz() }));
}

export async function getGoal(id: number): Promise<GoalDetail> {
  if (isMocked('planning')) return mock.getGoal(id);
  const [areas, plan] = await Promise.all([
    getAreas(),
    apiCall.get<ApiPlanDetail>(buildPath(ApiEndpoint.PlanDetail, { id })),
  ]);
  return toGoalDetail(plan, areas);
}

/** Sets the status when it differs: the API keeps it out of create / update. */
async function syncStatus(goal: GoalDetail, status: GoalStatus, areas: AreaMap): Promise<GoalDetail> {
  if (goal.status === status) return goal;
  const path = buildPath(ApiEndpoint.PlanStatus, { id: goal.id });
  return toGoalDetail(await apiCall.patch<ApiPlanDetail>(path, { status: toApiStatus(status) }), areas);
}

/** A new plan starts as not started; another status is set with a second request. */
export async function createGoal(input: GoalFormValues): Promise<GoalDetail> {
  if (isMocked('planning')) return mock.createGoal(input);
  const areas = await getAreas();
  const plan = await apiCall.post<ApiPlan>(ApiEndpoint.Plans, toPlanBody(input, areas, 'create'));
  return syncStatus(toGoalDetail({ ...plan, steps: [] }, areas), input.status, areas);
}

export async function updateGoal(id: number, input: GoalFormValues): Promise<GoalDetail> {
  if (isMocked('planning')) return mock.updateGoal(id, input);
  const areas = await getAreas();
  const plan = await apiCall.put<ApiPlanDetail>(
    buildPath(ApiEndpoint.PlanDetail, { id }),
    toPlanBody(input, areas, 'update')
  );
  return syncStatus(toGoalDetail(plan, areas), input.status, areas);
}

export async function updateGoalStatus(id: number, status: GoalStatus): Promise<GoalSummary> {
  if (isMocked('planning')) return mock.updateGoalStatus(id, status);
  const [areas, plan] = await Promise.all([
    getAreas(),
    apiCall.patch<ApiPlanDetail>(buildPath(ApiEndpoint.PlanStatus, { id }), { status: toApiStatus(status) }),
  ]);
  return toGoalSummary(plan, areas);
}

export function deleteGoal(id: number): Promise<void> {
  if (isMocked('planning')) return mock.deleteGoal(id);
  return apiCall.delete(buildPath(ApiEndpoint.PlanDetail, { id }));
}

/** Added at the end of the goal, or at `input.position` (restoring a deleted step). */
export async function addMilestone(goalId: number, input: MilestoneInput): Promise<Milestone> {
  if (isMocked('planning')) return mock.addMilestone(goalId, input);
  const step = await apiCall.post<ApiPlanStep>(
    buildPath(ApiEndpoint.PlanSteps, { id: goalId }),
    toStepBody(input, 'create')
  );
  return toMilestone(step);
}

export async function updateMilestone(id: number, input: MilestoneFormValues): Promise<Milestone> {
  if (isMocked('planning')) return mock.updateMilestone(id, input);
  const path = buildPath(ApiEndpoint.StepDetail, { id });
  return toMilestone(await apiCall.put<ApiPlanStep>(path, toStepBody(input, 'update')));
}

export async function toggleMilestone(
  id: number,
  isDone: boolean
): Promise<{ milestone: Milestone; goal: GoalSummary }> {
  if (isMocked('planning')) return mock.toggleMilestone(id, isDone);
  const [areas, res] = await Promise.all([
    getAreas(),
    apiCall.patch<{ step: ApiPlanStep; plan: ApiPlan }>(buildPath(ApiEndpoint.StepToggle, { id }), { done: isDone }),
  ]);
  return { milestone: toMilestone(res.step), goal: toGoalSummary(res.plan, areas) };
}

/** `position` is computed by the client from the new neighbours (see `calcPosition`). */
export async function moveMilestone(id: number, position: number): Promise<Milestone> {
  if (isMocked('planning')) return mock.moveMilestone(id, position);
  return toMilestone(await apiCall.patch<ApiPlanStep>(buildPath(ApiEndpoint.StepMove, { id }), { position }));
}

export async function deleteMilestone(id: number): Promise<{ goal: GoalSummary }> {
  if (isMocked('planning')) return mock.deleteMilestone(id);
  const [areas, res] = await Promise.all([
    getAreas(),
    apiCall.delete<{ plan: ApiPlan }>(buildPath(ApiEndpoint.StepDetail, { id })),
  ]);
  return { goal: toGoalSummary(res.plan, areas) };
}
