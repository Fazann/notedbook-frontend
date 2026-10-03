import {
  GOAL_AREAS,
  type GoalArea,
  type GoalDetail,
  type GoalFormValues,
  type GoalPriority,
  type GoalStatus,
  type GoalSummary,
  type Milestone,
  type MilestoneFormValues,
} from '@/features/planning/types';

// Goals are `plans` and milestones are `steps` in the API.

export type ApiPlanStatus = 'NOT_START' | 'IN_PROGRESS' | 'DONE';
export type ApiPlanPriority = 'LOW' | 'MEDIUM' | 'HIGH';

/** `PlanAreaRes` of the Go API. `title` is the English base title ("Finance"). */
export type ApiPlanArea = { id: number; title: string };

/** `PlanRes` of the Go API. Dates are `YYYY-MM-DD`, timestamps RFC3339. */
export type ApiPlan = {
  id: number;
  title: string;
  description: string;
  /** `title` is in the request language. */
  area: { id: number; title: string };
  priority: ApiPlanPriority;
  status: ApiPlanStatus;
  target_date: string | null;
  step_count: number;
  done_step_count: number;
  progress: number;
  done_at: string | null;
  created_at: string;
  updated_at: string;
};

/** `PlanStepRes` of the Go API. */
export type ApiPlanStep = {
  id: number;
  plan_id: number;
  title: string;
  done: boolean;
  due_date: string | null;
  created_at: string;
  updated_at: string;
};

/** `PlanDetailRes`: steps oldest first. */
export type ApiPlanDetail = ApiPlan & { steps: ApiPlanStep[] };

const STATUS_FROM_API: Record<ApiPlanStatus, GoalStatus> = {
  NOT_START: 'not_started',
  IN_PROGRESS: 'in_progress',
  DONE: 'done',
};
const STATUS_TO_API: Record<GoalStatus, ApiPlanStatus> = {
  not_started: 'NOT_START',
  in_progress: 'IN_PROGRESS',
  done: 'DONE',
};

export const toApiStatus = (status: GoalStatus): ApiPlanStatus => STATUS_TO_API[status];
const toPriority = (priority: ApiPlanPriority) => priority.toLowerCase() as GoalPriority;
const toApiPriority = (priority: GoalPriority) => priority.toUpperCase() as ApiPlanPriority;

/**
 * Plan areas are matched to the app's area keys by their English base title ("Finance" → `finance`), so they are
 * translated like the rest of the UI.
 * TODO(api): return a stable `key` for plan areas instead of relying on the English title.
 */
export type AreaMap = { keyOf: (id: number) => GoalArea; idOf: (key: GoalArea) => number };

export function toAreaMap(areas: ApiPlanArea[]): AreaMap {
  const keys = new Map<number, GoalArea>();
  const ids = new Map<GoalArea, number>();
  for (const area of areas) {
    const key = GOAL_AREAS.find((k) => k === area.title.trim().toLowerCase());
    if (!key) continue;
    keys.set(area.id, key);
    ids.set(key, area.id);
  }
  return {
    // An area this app version does not know yet falls back instead of breaking the page.
    keyOf: (id) => keys.get(id) ?? 'personal',
    idOf: (key) => {
      const id = ids.get(key);
      if (id === undefined) throw new Error(`Plan area "${key}" is missing in the API`);
      return id;
    },
  };
}

export function toGoalSummary(p: ApiPlan, areas: AreaMap): GoalSummary {
  return {
    id: p.id,
    title: p.title,
    area: areas.keyOf(p.area.id),
    priority: toPriority(p.priority),
    status: STATUS_FROM_API[p.status],
    targetDate: p.target_date,
    milestonesTotal: p.step_count,
    milestonesDone: p.done_step_count,
    progress: p.progress,
    completedAt: p.done_at,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  };
}

/**
 * The API keeps steps in creation order and has no `position` or done time.
 * `position` is the step's place in the list (1000, 2000…); a single step gets `position` from the caller.
 */
export function toMilestone(s: ApiPlanStep, position: number): Milestone {
  return {
    id: s.id,
    goalId: s.plan_id,
    title: s.title,
    isDone: s.done,
    dueDate: s.due_date,
    position,
    doneAt: null,
  };
}

export function toGoalDetail(p: ApiPlanDetail, areas: AreaMap): GoalDetail {
  return {
    ...toGoalSummary(p, areas),
    description: p.description,
    milestones: p.steps.map((s, i) => toMilestone(s, (i + 1) * 1000)),
  };
}

/**
 * A missing date is `null` when creating, but `""` when updating (there `null` keeps the old date). The API rejects
 * `""` on create.
 */
export type BodyMode = 'create' | 'update';
const optionalDate = (date: string | null, mode: BodyMode) => date ?? (mode === 'update' ? '' : null);

/** Body of POST / PUT /plans. The status is changed separately (`PATCH /plans/:id/status`). */
export function toPlanBody(input: GoalFormValues, areas: AreaMap, mode: BodyMode) {
  return {
    title: input.title,
    description: input.description,
    area_id: areas.idOf(input.area),
    priority: toApiPriority(input.priority),
    target_date: optionalDate(input.targetDate, mode),
  };
}

/** Body of POST /plans/:id/steps and PUT /steps/:id. */
export function toStepBody(input: MilestoneFormValues, mode: BodyMode) {
  return { title: input.title, due_date: optionalDate(input.dueDate, mode) };
}
