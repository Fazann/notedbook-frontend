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
  computeProgress,
  getDueState,
  isActiveStatus,
  toGoalSummary,
  type MilestoneChange,
} from '@/features/planning/utils';
import { paginate, parseSort, type Paginated } from '@/lib/list';
import { calcPosition } from '@/lib/position';
import { APP_TIME_ZONE, todayInTz } from '@/lib/time';
import { ApiError } from '@/services/api-call';

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

const byTitle = (a: GoalSummary, b: GoalSummary) => a.title.localeCompare(b.title);
const COMPARE: Record<string, (a: GoalSummary, b: GoalSummary) => number> = {
  createdAt: (a, b) => a.createdAt.localeCompare(b.createdAt) || a.id - b.id,
  progress: (a, b) => a.progress - b.progress || byTitle(a, b),
  title: byTitle,
};

/** GET /goals?page=&pageSize=&q=&status=active|done|all&area=a,b&sort= */
export async function listGoals(params: GoalListParams): Promise<Paginated<GoalSummary>> {
  await delay();
  const query = params.search.trim().toLocaleLowerCase();
  const items = db.goals
    .filter(
      (g) =>
        (params.status === 'all' || (params.status === 'done') === (g.status === 'done')) &&
        (params.areas.length === 0 || params.areas.includes(g.area)) &&
        (!query || g.title.toLocaleLowerCase().includes(query))
    )
    .map(toGoalSummary);

  const sort = parseSort(params.sort) ?? { key: 'targetDate', dir: 'asc' };
  const sign = sort.dir === 'desc' ? -1 : 1;
  items.sort((a, b) => {
    if (sort.key === 'targetDate') {
      // Goals without a target date always come last.
      if (a.targetDate === b.targetDate) return byTitle(a, b);
      if (a.targetDate === null) return 1;
      if (b.targetDate === null) return -1;
      return sign * a.targetDate.localeCompare(b.targetDate);
    }
    return sign * (COMPARE[sort.key] ?? byTitle)(a, b);
  });

  return copy(paginate(items, params.page, params.pageSize));
}

/** GET /goals/stats */
export async function getGoalStats(): Promise<GoalStats> {
  await delay();
  const today = todayInTz();
  const active = db.goals.filter((g) => isActiveStatus(g.status));
  const year = today.slice(0, 4);
  return {
    active: active.length,
    doneThisYear: db.goals.filter(
      (g) => g.completedAt && todayInTz(APP_TIME_ZONE, new Date(g.completedAt)).startsWith(year)
    ).length,
    overdue: active.filter((g) => getDueState(g, today).kind === 'overdue').length,
    averageProgress: active.length ? Math.round(active.reduce((sum, g) => sum + g.progress, 0) / active.length) : 0,
  };
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
