import { z } from 'zod';

import type { ListParams } from '@/lib/list';

export const GOAL_STATUSES = ['not_started', 'in_progress', 'done'] as const;
export const GOAL_AREAS = ['personal', 'career', 'health', 'finance', 'learning', 'family'] as const;
export const GOAL_PRIORITIES = ['low', 'medium', 'high'] as const;

export type GoalStatus = (typeof GOAL_STATUSES)[number];
export type GoalArea = (typeof GOAL_AREAS)[number];
export type GoalPriority = (typeof GOAL_PRIORITIES)[number];

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const milestoneSchema = z.object({
  id: z.number(),
  goalId: z.number(),
  title: z.string(),
  isDone: z.boolean(),
  /** `YYYY-MM-DD`, optional */
  dueDate: isoDate.nullable(),
  /** Float ordering: 1000, 2000, 3000… (see `calcPosition`). */
  position: z.number(),
  /** RFC3339 */
  doneAt: z.string().nullable(),
});
export type Milestone = z.infer<typeof milestoneSchema>;

/** A goal as shown in lists and on the dashboard. */
export const goalSummarySchema = z.object({
  id: z.number(),
  title: z.string(),
  area: z.enum(GOAL_AREAS),
  priority: z.enum(GOAL_PRIORITIES),
  status: z.enum(GOAL_STATUSES),
  /** `YYYY-MM-DD` */
  targetDate: isoDate.nullable(),
  milestonesTotal: z.number().int(),
  milestonesDone: z.number().int(),
  /** 0–100, integer, computed by the API. */
  progress: z.number().int(),
  /** RFC3339 */
  completedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type GoalSummary = z.infer<typeof goalSummarySchema>;

export const goalDetailSchema = goalSummarySchema.extend({
  /** Plain text, max 2000. */
  description: z.string(),
  /** Sorted by position. */
  milestones: z.array(milestoneSchema),
});
export type GoalDetail = z.infer<typeof goalDetailSchema>;

export const goalStatsSchema = z.object({
  /** not_started + in_progress */
  active: z.number().int(),
  doneThisYear: z.number().int(),
  /** Active and targetDate < today. */
  overdue: z.number().int(),
  /** Of active goals, 0–100. */
  averageProgress: z.number().int(),
});
export type GoalStats = z.infer<typeof goalStatsSchema>;

export const GOAL_TITLE_MIN = 2;
export const GOAL_TITLE_MAX = 100;
export const GOAL_DESCRIPTION_MAX = 2000;
export const MILESTONE_TITLE_MAX = 150;

/** Form schema. Messages are keys under `planning.validation`, translated in the form. */
export const goalFormSchema = z.object({
  title: z.string().trim().min(1, 'required').min(GOAL_TITLE_MIN, 'tooShort').max(GOAL_TITLE_MAX, 'tooLong'),
  description: z.string().trim().max(GOAL_DESCRIPTION_MAX, 'tooLong'),
  area: z.enum(GOAL_AREAS),
  priority: z.enum(GOAL_PRIORITIES),
  targetDate: isoDate.nullable(),
  status: z.enum(GOAL_STATUSES),
});
export type GoalFormValues = z.infer<typeof goalFormSchema>;

export const milestoneFormSchema = z.object({
  title: z.string().trim().min(1, 'required').max(MILESTONE_TITLE_MAX, 'tooLong'),
  dueDate: isoDate.nullable(),
});
export type MilestoneFormValues = z.infer<typeof milestoneFormSchema>;

/** Body of POST /goals/:id/milestones. `position` is only sent to restore a deleted step (Undo). */
export type MilestoneInput = MilestoneFormValues & { position?: number };

/** `active` = not_started + in_progress. */
export const GOAL_STATUS_FILTERS = ['active', 'done', 'all'] as const;
export type GoalStatusFilter = (typeof GOAL_STATUS_FILTERS)[number];
export const GOAL_DEFAULT_STATUS_FILTER: GoalStatusFilter = 'active';

/** Sort keys the goals list accepts (prefix "-" for descending). `targetDate` puts goals without a date last. */
export const GOAL_SORT_KEYS = ['targetDate', 'createdAt', 'progress', 'title'] as const;
export const GOAL_DEFAULT_SORT = 'targetDate';

export const GOAL_PAGE_SIZE_OPTIONS = [12, 24, 48] as const;
export const GOAL_DEFAULT_PAGE_SIZE = 12;

/** URL filters of the goals list (besides page / search / sort). Empty string = default. */
export const GOAL_FILTER_KEYS = ['status', 'area'] as const;

/** Goals list query. `search` matches the title. An empty `areas` means all areas. */
export type GoalListParams = ListParams & { status: GoalStatusFilter; areas: GoalArea[] };
