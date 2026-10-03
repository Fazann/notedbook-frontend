import type { Activity, ActivityInput, Occurrence, Scope, WeekSummary } from '@/features/schedule/types';
import { isMocked } from '@/lib/env';
import * as mock from '@/mocks/handlers/schedule';

import { apiCall } from '../core/api-call';
import { ApiEndpoint, buildPath } from '../core/api-endpoints';

import {
  type ApiActivity,
  type ApiOccurrence,
  type ApiWeekSummary,
  toActivity,
  toActivityBody,
  toOccurrence,
  toWeekSummary,
} from './schedule-mappers';

/** `from` / `to` are inclusive `YYYY-MM-DD` (max 42 days). */
export async function listOccurrences(from: string, to: string): Promise<Occurrence[]> {
  if (isMocked('schedule')) return mock.listOccurrences(from, to);
  return (await apiCall.get<ApiOccurrence[]>(ApiEndpoint.ScheduleOccurrences, { from, to })).map(toOccurrence);
}

export async function getSummary(from: string, to: string): Promise<WeekSummary> {
  if (isMocked('schedule')) return mock.getSummary(from, to);
  return toWeekSummary(await apiCall.get<ApiWeekSummary>(ApiEndpoint.ScheduleSummary, { from, to }));
}

export async function getActivity(id: number): Promise<Activity> {
  if (isMocked('schedule')) return mock.getActivity(id);
  return toActivity(await apiCall.get<ApiActivity>(buildPath(ApiEndpoint.ScheduleActivityDetail, { id })));
}

export async function createActivity(input: ActivityInput): Promise<Activity> {
  if (isMocked('schedule')) return mock.createActivity(input);
  return toActivity(await apiCall.post<ApiActivity>(ApiEndpoint.ScheduleActivities, toActivityBody(input)));
}

const scopeParams = (scope: Scope, date?: string) => (scope === 'this' && date ? { scope, date } : { scope });

/**
 * scope `this` on a repeating activity returns `{ series, created }`; otherwise the edited activity.
 * The real API always splits on scope `this`, so single activities must be edited with scope `all` (the UI does).
 */
export async function updateActivity(
  id: number,
  input: ActivityInput,
  scope: Scope,
  date?: string
): Promise<Activity | { series: Activity; created: Activity }> {
  if (isMocked('schedule')) return mock.updateActivity(id, input, scope, date);
  const path = buildPath(ApiEndpoint.ScheduleActivityDetail, { id });
  const res = await apiCall.put<ApiActivity | { series: ApiActivity; created: ApiActivity }>(
    path,
    toActivityBody(input),
    scopeParams(scope, date)
  );
  return 'series' in res ? { series: toActivity(res.series), created: toActivity(res.created) } : toActivity(res);
}

export function deleteActivity(id: number, scope: Scope, date?: string): Promise<void> {
  if (isMocked('schedule')) return mock.deleteActivity(id, scope, date);
  return apiCall.delete(buildPath(ApiEndpoint.ScheduleActivityDetail, { id }), scopeParams(scope, date));
}
