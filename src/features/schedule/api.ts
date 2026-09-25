import { apiClient } from '@/lib/api-client';
import { env } from '@/lib/env';
import * as mock from '@/mocks/handlers/schedule';

import type { Activity, ActivityInput, Occurrence, Scope, WeekSummary } from './types';

/** `from` / `to` are inclusive `YYYY-MM-DD` (max 42 days). */
export function listOccurrences(from: string, to: string): Promise<Occurrence[]> {
  if (env.useMocks) return mock.listOccurrences(from, to);
  return apiClient.get(`/schedule/occurrences?${new URLSearchParams({ from, to })}`);
}

export function getSummary(from: string, to: string): Promise<WeekSummary> {
  if (env.useMocks) return mock.getSummary(from, to);
  return apiClient.get(`/schedule/summary?${new URLSearchParams({ from, to })}`);
}

export function getActivity(id: number): Promise<Activity> {
  if (env.useMocks) return mock.getActivity(id);
  return apiClient.get(`/schedule/activities/${id}`);
}

export function createActivity(input: ActivityInput): Promise<Activity> {
  if (env.useMocks) return mock.createActivity(input);
  return apiClient.post('/schedule/activities', input);
}

const scopeQuery = (scope: Scope, date?: string) =>
  new URLSearchParams(scope === 'this' && date ? { scope, date } : { scope });

/** scope `this` on a repeating activity returns `{ series, created }`; otherwise the edited activity. */
export function updateActivity(
  id: number,
  input: ActivityInput,
  scope: Scope,
  date?: string
): Promise<Activity | { series: Activity; created: Activity }> {
  if (env.useMocks) return mock.updateActivity(id, input, scope, date);
  return apiClient.put(`/schedule/activities/${id}?${scopeQuery(scope, date)}`, input);
}

export function deleteActivity(id: number, scope: Scope, date?: string): Promise<void> {
  if (env.useMocks) return mock.deleteActivity(id, scope, date);
  return apiClient.delete(`/schedule/activities/${id}?${scopeQuery(scope, date)}`);
}
