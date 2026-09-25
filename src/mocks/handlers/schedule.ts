import {
  activityInputSchema,
  MAX_RANGE_DAYS,
  type Activity,
  type ActivityInput,
  type Occurrence,
  type Scope,
  type WeekSummary,
} from '@/features/schedule/types';
import { expandOccurrences, occursOn, summarize } from '@/features/schedule/utils';
import { ApiError } from '@/lib/api-client';
import { addDays, daysBetween } from '@/lib/time';

import { db, nextId } from '../db';
import { copy, delay } from '../delay';

const now = () => new Date().toISOString();

function find(id: number): Activity {
  const activity = db.activities.find((a) => a.id === id);
  if (!activity) throw new ApiError(404, 'NOT_FOUND', 'Activity not found');
  return activity;
}

/** 422 with one message key per field, like the real API. */
function validate(input: unknown): ActivityInput {
  const result = activityInputSchema.safeParse(input);
  if (result.success) return result.data;
  const fields: Record<string, string> = {};
  for (const issue of result.error.issues) fields[String(issue.path[0])] ??= issue.message;
  throw new ApiError(422, 'VALIDATION_ERROR', 'Invalid input', fields);
}

function assertRange(from: string, to: string) {
  const days = daysBetween(from, to);
  if (days < 0 || days >= MAX_RANGE_DAYS) {
    throw new ApiError(422, 'VALIDATION_ERROR', `Range must be 1–${MAX_RANGE_DAYS} days`, { to: 'invalidRange' });
  }
}

/** One occurrence of a series only: the date must be one it actually happens on. */
function assertOccurrence(activity: Activity, date: string | undefined): string {
  if (!date || !occursOn(activity, date)) throw new ApiError(404, 'NOT_FOUND', 'No occurrence on this date');
  return date;
}

function insert(input: ActivityInput): Activity {
  const timestamp = now();
  const activity: Activity = {
    id: nextId(db.activities),
    ...input,
    exceptions: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  db.activities.push(activity);
  return activity;
}

/** GET /schedule/occurrences?from=&to= — series already expanded, sorted by date + start time. */
export async function listOccurrences(from: string, to: string): Promise<Occurrence[]> {
  await delay();
  assertRange(from, to);
  return copy(expandOccurrences(db.activities, from, to));
}

/** GET /schedule/summary?from=&to= */
export async function getSummary(from: string, to: string): Promise<WeekSummary> {
  await delay();
  assertRange(from, to);
  return copy(summarize(expandOccurrences(db.activities, from, to)));
}

/** GET /schedule/activities/:id */
export async function getActivity(id: number): Promise<Activity> {
  await delay();
  return copy(find(id));
}

/** POST /schedule/activities */
export async function createActivity(input: ActivityInput): Promise<Activity> {
  await delay();
  return copy(insert(validate(input)));
}

/**
 * PUT /schedule/activities/:id?scope=all — edits the series. Exceptions move with the series' start date.
 * PUT /schedule/activities/:id?scope=this&date= — removes that date from the series and creates a single
 * activity with the changes. On a single (non-repeating) activity both scopes edit it.
 */
export async function updateActivity(
  id: number,
  input: ActivityInput,
  scope: Scope,
  date?: string
): Promise<Activity | { series: Activity; created: Activity }> {
  await delay();
  const values = validate(input);
  const activity = find(id);

  if (scope === 'this' && activity.recurrence.kind !== 'none') {
    activity.exceptions = [...activity.exceptions, assertOccurrence(activity, date)];
    activity.updatedAt = now();
    const created = insert({ ...values, recurrence: { kind: 'none' } });
    return copy({ series: activity, created });
  }

  const shift = daysBetween(activity.date, values.date);
  Object.assign(activity, values, {
    exceptions: values.recurrence.kind === 'none' ? [] : activity.exceptions.map((d) => addDays(d, shift)),
    updatedAt: now(),
  });
  return copy(activity);
}

/** DELETE /schedule/activities/:id?scope=all | ?scope=this&date= */
export async function deleteActivity(id: number, scope: Scope, date?: string): Promise<void> {
  await delay();
  const activity = find(id);
  if (scope === 'this' && activity.recurrence.kind !== 'none') {
    activity.exceptions = [...activity.exceptions, assertOccurrence(activity, date)];
    activity.updatedAt = now();
    return;
  }
  db.activities = db.activities.filter((a) => a.id !== id);
}
