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
import { computeGoalStats, matchesGoalFilters, sortGoals } from '@/features/planning/utils';
import { isMocked } from '@/lib/env';
import { paginate, type Paginated } from '@/lib/list';
import { todayInTz } from '@/lib/time';
import * as mock from '@/mocks/handlers/planning';

import { apiCall } from '../core/api-call';
import { ApiEndpoint, buildPath } from '../core/api-endpoints';

import {
  type ApiPlan,
  type ApiPlanArea,
  type ApiPlanDetail,
  type ApiPlanStep,
  type AreaMap,
  toApiStatus,
  toAreaMap,
  toGoalDetail,
  toGoalSummary,
  toMilestone,
  toPlanBody,
  toStepBody,
} from './planning-mappers';

// Goals are `plans` and milestones are `steps` in the API.

/** Most plans loaded at once (the API's page limit). */
const ALL_LIMIT = 1000;

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

/** Every plan matching the filters the API supports (one status, one area, title search). */
async function listAllGoals(params: Partial<Pick<GoalListParams, 'status' | 'areas' | 'search'>> = {}) {
  const areas = await getAreas();
  const page = await apiCall.getPage<ApiPlan>(ApiEndpoint.Plans, {
    page: 1,
    pageSize: ALL_LIMIT,
    status: params.status === 'done' ? 'DONE' : undefined,
    area_id: params.areas?.length === 1 ? areas.idOf(params.areas[0]) : undefined,
    q: params.search?.trim() || undefined,
  });
  return page.data.map((p) => toGoalSummary(p, areas));
}

/**
 * One page of goals. The API cannot filter `active` (two statuses) or several areas, nor sort by progress, so the
 * matching goals are loaded at once and filtered, sorted and paged here.
 * TODO(api): accept `status=NOT_START,IN_PROGRESS`, several `area_id`s and `sort=progress`, then page on the server.
 */
export async function listGoals(params: GoalListParams): Promise<Paginated<GoalSummary>> {
  if (isMocked('planning')) return mock.listGoals(params);
  const goals = (await listAllGoals(params)).filter((g) => matchesGoalFilters(g, params));
  return paginate(sortGoals(goals, params.sort), params.page, params.pageSize);
}

/** TODO(api): GET /plans/stats is not in the backend yet; computed here from every plan. */
export async function getGoalStats(): Promise<GoalStats> {
  if (isMocked('planning')) return mock.getGoalStats();
  return computeGoalStats(await listAllGoals(), todayInTz());
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

/**
 * Added at the end of the goal. The API returns no position, so the step keeps the one the caller gave it.
 * TODO(api): POST /plans/:id/steps should accept an optional `position` (used to undo a delete).
 */
export async function addMilestone(goalId: number, input: MilestoneInput): Promise<Milestone> {
  if (isMocked('planning')) return mock.addMilestone(goalId, input);
  const step = await apiCall.post<ApiPlanStep>(
    buildPath(ApiEndpoint.PlanSteps, { id: goalId }),
    toStepBody(input, 'create')
  );
  return toMilestone(step, input.position ?? 0);
}

/** The returned step has no position (the API has none); read positions from the goal. */
export async function updateMilestone(id: number, input: MilestoneFormValues): Promise<Milestone> {
  if (isMocked('planning')) return mock.updateMilestone(id, input);
  return toMilestone(
    await apiCall.put<ApiPlanStep>(buildPath(ApiEndpoint.StepDetail, { id }), toStepBody(input, 'update')),
    0
  );
}

/** The returned step has no position (the API has none); read positions from the goal. */
export async function toggleMilestone(
  id: number,
  isDone: boolean
): Promise<{ milestone: Milestone; goal: GoalSummary }> {
  if (isMocked('planning')) return mock.toggleMilestone(id, isDone);
  const [areas, res] = await Promise.all([
    getAreas(),
    apiCall.patch<{ step: ApiPlanStep; plan: ApiPlan }>(buildPath(ApiEndpoint.StepToggle, { id }), { done: isDone }),
  ]);
  return { milestone: toMilestone(res.step, 0), goal: toGoalSummary(res.plan, areas) };
}

/** TODO(api): the backend has no step ordering yet (PATCH /steps/:id/move); until then steps can't be reordered. */
export const canMoveMilestones = () => isMocked('planning');

export function moveMilestone(id: number, position: number): Promise<Milestone> {
  if (isMocked('planning')) return mock.moveMilestone(id, position);
  return Promise.reject(new Error('Reordering steps is not supported by the API yet'));
}

export async function deleteMilestone(id: number): Promise<{ goal: GoalSummary }> {
  if (isMocked('planning')) return mock.deleteMilestone(id);
  const [areas, res] = await Promise.all([
    getAreas(),
    apiCall.delete<{ plan: ApiPlan }>(buildPath(ApiEndpoint.StepDetail, { id })),
  ]);
  return { goal: toGoalSummary(res.plan, areas) };
}
