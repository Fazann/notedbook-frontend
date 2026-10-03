import type { z } from 'zod';

import {
  goalFormSchema,
  milestoneFormSchema,
  type GoalDetail,
  type GoalFormValues,
  type GoalListParams,
  type GoalStats,
  type GoalStatus,
  type GoalSummary,
  type Milestone,
  type MilestoneFormValues,
  type MilestoneInput,
} from '@/features/planning/types';
import {
  applyMilestoneChange,
  applyStatusChange,
  computeGoalStats,
  computeProgress,
  matchesGoalFilters,
  sortGoals,
  toGoalSummary,
  type MilestoneChange,
} from '@/features/planning/utils';
import { paginate, type Paginated } from '@/lib/list';
import { calcPosition } from '@/lib/position';
import { todayInTz } from '@/lib/time';
import { ApiError } from '@/services/core/api-call';

import { db, nextId } from '../db';
import { copy, delay } from '../delay';

const now = () => new Date().toISOString();

function findGoal(id: number): GoalDetail {
  const goal = db.goals.find((g) => g.id === id);
  if (!goal) throw new ApiError(404, 'NOT_FOUND', 'Goal not found');
  return goal;
}

function findMilestone(id: number): { goal: GoalDetail; milestone: Milestone } {
  const goal = db.goals.find((g) => g.milestones.some((m) => m.id === id));
  const milestone = goal?.milestones.find((m) => m.id === id);
  if (!goal || !milestone) throw new ApiError(404, 'NOT_FOUND', 'Milestone not found');
  return { goal, milestone };
}

function save(goal: GoalDetail): GoalDetail {
  db.goals = db.goals.map((g) => (g.id === goal.id ? goal : g));
  return goal;
}

/** 422 with one message key per field, like the real API. */
function validate<S extends z.ZodType>(schema: S, input: unknown): z.infer<S> {
  const result = schema.safeParse(input);
  if (result.success) return result.data;
  const fields: Record<string, string> = {};
  for (const issue of result.error.issues) fields[String(issue.path[0])] ??= issue.message;
  throw new ApiError(422, 'VALIDATION_ERROR', 'Invalid input', fields);
}

/** GET /goals?page=&pageSize=&q=&status=active|done|all&area=a,b&sort= */
export async function listGoals(params: GoalListParams): Promise<Paginated<GoalSummary>> {
  await delay();
  const items = db.goals.map(toGoalSummary).filter((g) => matchesGoalFilters(g, params));
  return copy(paginate(sortGoals(items, params.sort), params.page, params.pageSize));
}

/** GET /goals/stats */
export async function getGoalStats(): Promise<GoalStats> {
  await delay();
  return computeGoalStats(db.goals.map(toGoalSummary), todayInTz());
}

/** GET /goals/:id */
export async function getGoal(id: number): Promise<GoalDetail> {
  await delay();
  return copy(findGoal(id));
}

/** POST /goals */
export async function createGoal(input: GoalFormValues): Promise<GoalDetail> {
  await delay();
  const values = validate(goalFormSchema, input);
  const timestamp = now();
  const goal: GoalDetail = {
    id: nextId(db.goals),
    ...values,
    milestonesTotal: 0,
    milestonesDone: 0,
    progress: computeProgress(0, 0, values.status),
    completedAt: values.status === 'done' ? timestamp : null,
    createdAt: timestamp,
    updatedAt: timestamp,
    milestones: [],
  };
  db.goals.push(goal);
  return copy(goal);
}

/** PUT /goals/:id */
export async function updateGoal(id: number, input: GoalFormValues): Promise<GoalDetail> {
  await delay();
  const values = validate(goalFormSchema, input);
  const goal = findGoal(id);
  const { status, ...rest } = values;
  return copy(save(applyStatusChange({ ...goal, ...rest }, status, now())));
}

/** PATCH /goals/:id/status */
export async function updateGoalStatus(id: number, status: GoalStatus): Promise<GoalSummary> {
  await delay();
  return copy(toGoalSummary(save(applyStatusChange(findGoal(id), status, now()))));
}

/** DELETE /goals/:id — its milestones go with it. */
export async function deleteGoal(id: number): Promise<void> {
  await delay();
  findGoal(id);
  db.goals = db.goals.filter((g) => g.id !== id);
}

function change(goal: GoalDetail, milestoneChange: MilestoneChange): GoalDetail {
  return save(applyMilestoneChange(goal, milestoneChange, now()));
}

/** POST /goals/:id/milestones — added at the end, unless `position` is given (restoring a deleted step). */
export async function addMilestone(goalId: number, input: MilestoneInput): Promise<Milestone> {
  await delay();
  const values = validate(milestoneFormSchema, input);
  const goal = findGoal(goalId);
  const milestone: Milestone = {
    id: nextId(db.goals.flatMap((g) => g.milestones)),
    goalId,
    ...values,
    isDone: false,
    position: input.position ?? calcPosition(goal.milestones.at(-1)?.position),
    doneAt: null,
  };
  change(goal, { type: 'add', milestone });
  return copy(milestone);
}

/** PUT /milestones/:id */
export async function updateMilestone(id: number, input: MilestoneFormValues): Promise<Milestone> {
  await delay();
  const values = validate(milestoneFormSchema, input);
  const { goal } = findMilestone(id);
  const next = change(goal, { type: 'update', id, ...values });
  return copy(findIn(next, id));
}

/** PATCH /milestones/:id/toggle */
export async function toggleMilestone(
  id: number,
  isDone: boolean
): Promise<{ milestone: Milestone; goal: GoalSummary }> {
  await delay();
  const { goal } = findMilestone(id);
  const next = change(goal, { type: 'toggle', id, isDone });
  return copy({ milestone: findIn(next, id), goal: toGoalSummary(next) });
}

/** PATCH /milestones/:id/move */
export async function moveMilestone(id: number, position: number): Promise<Milestone> {
  await delay();
  const { goal } = findMilestone(id);
  return copy(findIn(change(goal, { type: 'move', id, position }), id));
}

/** DELETE /milestones/:id */
export async function deleteMilestone(id: number): Promise<{ goal: GoalSummary }> {
  await delay();
  const { goal } = findMilestone(id);
  return copy({ goal: toGoalSummary(change(goal, { type: 'delete', id })) });
}

function findIn(goal: GoalDetail, id: number): Milestone {
  const milestone = goal.milestones.find((m) => m.id === id);
  if (!milestone) throw new ApiError(404, 'NOT_FOUND', 'Milestone not found');
  return milestone;
}
