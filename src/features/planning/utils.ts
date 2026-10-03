import { daysBetween } from '@/lib/time';
import { ApiError } from '@/services/api-call';

import {
  GOAL_AREAS,
  GOAL_DEFAULT_STATUS_FILTER,
  GOAL_STATUS_FILTERS,
  goalSummarySchema,
  type GoalArea,
  type GoalDetail,
  type GoalStatus,
  type GoalStatusFilter,
  type GoalSummary,
  type Milestone,
} from './types';

/** Active goals are the ones not done yet. */
export const isActiveStatus = (status: GoalStatus) => status !== 'done';

/** Active goals due within this many days show a "due soon" badge. */
export const DUE_SOON_DAYS = 7;

export type DueState =
  | { kind: 'done'; completedAt: string | null }
  | { kind: 'noDate' }
  | { kind: 'overdue'; days: number }
  | { kind: 'dueToday' }
  | { kind: 'dueSoon'; days: number }
  | { kind: 'onTrack'; date: string };

/**
 * Due state of a goal on `today` (`YYYY-MM-DD` in Asia/Phnom_Penh — see `todayInTz`).
 * Dates are compared as plain dates, so the result never shifts with the browser timezone.
 */
export function getDueState(goal: Pick<GoalSummary, 'status' | 'targetDate' | 'completedAt'>, today: string): DueState {
  if (goal.status === 'done') return { kind: 'done', completedAt: goal.completedAt };
  if (!goal.targetDate) return { kind: 'noDate' };
  const days = daysBetween(today, goal.targetDate);
  if (days < 0) return { kind: 'overdue', days: -days };
  if (days === 0) return { kind: 'dueToday' };
  if (days <= DUE_SOON_DAYS) return { kind: 'dueSoon', days };
  return { kind: 'onTrack', date: goal.targetDate };
}

/** `round(done / total × 100)`; without milestones: 100 when done, else 0. */
export function computeProgress(done: number, total: number, status: GoalStatus): number {
  if (total === 0) return status === 'done' ? 100 : 0;
  return Math.round((done / total) * 100);
}

export type MilestoneChange =
  | { type: 'add'; milestone: Milestone }
  | { type: 'update'; id: number; title: string; dueDate: string | null }
  | { type: 'toggle'; id: number; isDone: boolean }
  | { type: 'move'; id: number; position: number }
  | { type: 'delete'; id: number };

/**
 * Applies a milestone change to a goal and recomputes counts, progress and status — the same business rules
 * as the API, so the optimistic cache update and the mock agree:
 * - checking a step of a `not_started` goal → `in_progress`
 * - unchecking a step of a `done` goal → `in_progress`, `completedAt = null`
 * - checking the last step does NOT complete the goal (the user decides).
 * `now` is an RFC3339 timestamp.
 */
export function applyMilestoneChange(goal: GoalDetail, change: MilestoneChange, now: string): GoalDetail {
  let milestones = goal.milestones;
  let { status, completedAt } = goal;
  const edit = (id: number, patch: Partial<Milestone>) => milestones.map((m) => (m.id === id ? { ...m, ...patch } : m));

  switch (change.type) {
    case 'add':
      milestones = [...milestones, change.milestone];
      break;
    case 'update':
      milestones = edit(change.id, { title: change.title, dueDate: change.dueDate });
      break;
    case 'move':
      milestones = edit(change.id, { position: change.position });
      break;
    case 'delete':
      milestones = milestones.filter((m) => m.id !== change.id);
      break;
    case 'toggle':
      milestones = edit(change.id, { isDone: change.isDone, doneAt: change.isDone ? now : null });
      if (change.isDone && status === 'not_started') status = 'in_progress';
      if (!change.isDone && status === 'done') {
        status = 'in_progress';
        completedAt = null;
      }
      break;
  }

  milestones = [...milestones].sort((a, b) => a.position - b.position);
  const milestonesTotal = milestones.length;
  const milestonesDone = milestones.filter((m) => m.isDone).length;
  return {
    ...goal,
    milestones,
    status,
    completedAt,
    milestonesTotal,
    milestonesDone,
    progress: computeProgress(milestonesDone, milestonesTotal, status),
    updatedAt: now,
  };
}

/** Sets a goal's status: `done` sets `completedAt` (steps are not auto-checked); other statuses clear it. */
export function applyStatusChange<T extends GoalSummary>(goal: T, status: GoalStatus, now: string): T {
  const completedAt = status === 'done' ? (goal.status === 'done' ? goal.completedAt : now) : null;
  return {
    ...goal,
    status,
    completedAt,
    progress: computeProgress(goal.milestonesDone, goal.milestonesTotal, status),
    updatedAt: now,
  };
}

/** The list / dashboard shape of a goal (zod drops `description` and `milestones`). */
export function toGoalSummary(goal: GoalDetail): GoalSummary {
  return goalSummarySchema.parse(goal);
}

/** True when the goal has steps and every one is checked. */
export const allMilestonesDone = (goal: Pick<GoalSummary, 'milestonesTotal' | 'milestonesDone'>) =>
  goal.milestonesTotal > 0 && goal.milestonesDone === goal.milestonesTotal;

export type GoalFilters = { status: GoalStatusFilter; areas: GoalArea[] };

/** Validates the goals list's URL filters: `?status=done&area=finance,health`. Invalid values are dropped. */
export function parseGoalFilters(raw: { status: string; area: string }): GoalFilters {
  const status = (GOAL_STATUS_FILTERS as readonly string[]).includes(raw.status)
    ? (raw.status as GoalStatusFilter)
    : GOAL_DEFAULT_STATUS_FILTER;
  const areas = GOAL_AREAS.filter((area) => raw.area.split(',').includes(area));
  return { status, areas };
}

/** True when the API says the goal does not exist. */
export const isNotFound = (error: unknown) => error instanceof ApiError && error.status === 404;
