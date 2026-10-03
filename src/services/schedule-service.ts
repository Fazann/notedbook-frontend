import type { Activity, ActivityInput, Occurrence, Scope, WeekSummary } from '@/features/schedule/types';
import { env } from '@/lib/env';
import * as mock from '@/mocks/handlers/schedule';

import { apiCall } from './api-call';
import { ApiEndpoint, buildPath } from './api-endpoints';

/** `from` / `to` are inclusive `YYYY-MM-DD` (max 42 days). */
export function listOccurrences(from: string, to: string): Promise<Occurrence[]> {
  if (env.useMocks) return mock.listOccurrences(from, to);
  return apiCall.get(ApiEndpoint.ScheduleOccurrences, { from, to });
}

export function getSummary(from: string, to: string): Promise<WeekSummary> {
  if (env.useMocks) return mock.getSummary(from, to);
  return apiCall.get(ApiEndpoint.ScheduleSummary, { from, to });
}

export function getActivity(id: number): Promise<Activity> {
  if (env.useMocks) return mock.getActivity(id);
  return apiCall.get(buildPath(ApiEndpoint.ScheduleActivityDetail, { id }));
}

export function createActivity(input: ActivityInput): Promise<Activity> {
  if (env.useMocks) return mock.createActivity(input);
  return apiCall.post(ApiEndpoint.ScheduleActivities, input);
}

const scopeParams = (scope: Scope, date?: string) => (scope === 'this' && date ? { scope, date } : { scope });

/** scope `this` on a repeating activity returns `{ series, created }`; otherwise the edited activity. */
export function updateActivity(
  id: number,
  input: ActivityInput,
  scope: Scope,
  date?: string
): Promise<Activity | { series: Activity; created: Activity }> {
  if (env.useMocks) return mock.updateActivity(id, input, scope, date);
  return apiCall.put(buildPath(ApiEndpoint.ScheduleActivityDetail, { id }), input, scopeParams(scope, date));
}

export function deleteActivity(id: number, scope: Scope, date?: string): Promise<void> {
  if (env.useMocks) return mock.deleteActivity(id, scope, date);
  return apiCall.delete(buildPath(ApiEndpoint.ScheduleActivityDetail, { id }), scopeParams(scope, date));
}
