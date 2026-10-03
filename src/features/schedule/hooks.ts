'use client';

import {
  keepPreviousData,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';

import { qk } from '@/lib/query-keys';
import { addDays, daysBetween } from '@/lib/time';
import * as api from '@/services/schedule/schedule-service';

import type { Activity, ActivityInput, Occurrence, Scope } from './types';
import { compareOccurrences, expandOccurrences, occurrenceKey } from './utils';

const occurrencesQuery = (from: string, to: string) => ({
  queryKey: qk.schedule.occurrences(from, to),
  queryFn: () => api.listOccurrences(from, to),
});

/**
 * Occurrences between `from` and `to` (inclusive). Keeps the previous range on screen while the next loads,
 * and prefetches the ranges just before and after, so ‹ / › feel instant.
 */
export function useOccurrences(from: string, to: string) {
  const queryClient = useQueryClient();
  useEffect(() => {
    const length = daysBetween(from, to) + 1;
    void queryClient.prefetchQuery(occurrencesQuery(addDays(from, -length), addDays(to, -length)));
    void queryClient.prefetchQuery(occurrencesQuery(addDays(from, length), addDays(to, length)));
  }, [queryClient, from, to]);

  return useQuery({ ...occurrencesQuery(from, to), placeholderData: keepPreviousData });
}

export function useWeekSummary(from: string, to: string) {
  return useQuery({
    queryKey: qk.schedule.summary(from, to),
    queryFn: () => api.getSummary(from, to),
    placeholderData: keepPreviousData,
  });
}

/** The full activity (series) behind an occurrence — needed to edit it. */
export function useActivity(id: number | undefined) {
  return useQuery({
    queryKey: qk.schedule.activity(id ?? 0),
    queryFn: () => api.getActivity(id ?? 0),
    enabled: id !== undefined && id > 0,
  });
}

/** Consecutive ranges of `days` days from `from` (the agenda's "Load next 14 days"), merged in order. */
export function useOccurrenceChunks(from: string, days: number, chunks: number) {
  const results = useQueries({
    queries: Array.from({ length: chunks }, (_, i) =>
      occurrencesQuery(addDays(from, i * days), addDays(from, (i + 1) * days - 1))
    ),
  });
  return {
    data: results.every((r) => r.data) ? results.flatMap((r) => r.data ?? []) : undefined,
    isPending: results.some((r) => r.isPending),
    isFetchingMore: results.length > 1 && results.at(-1)?.isPending === true,
    isError: results.some((r) => r.isError),
    refetch: () => Promise.all(results.map((r) => r.refetch())),
  };
}

/** Loads the series behind an occurrence (cached) — e.g. to move "all in series". */
export function useEnsureActivity() {
  const queryClient = useQueryClient();
  return useCallback(
    (id: number) =>
      queryClient.ensureQueryData({ queryKey: qk.schedule.activity(id), queryFn: () => api.getActivity(id) }),
    [queryClient]
  );
}

type Snapshot = [readonly unknown[], Occurrence[] | undefined][];

/** Applies `change` to every cached occurrence range; returns what to restore if the API fails. */
async function patchOccurrences(
  queryClient: QueryClient,
  change: (list: Occurrence[], from: string, to: string) => Occurrence[]
): Promise<{ snapshot: Snapshot }> {
  const queryKey = qk.schedule.occurrencesAll;
  await queryClient.cancelQueries({ queryKey });
  const snapshot: Snapshot = queryClient.getQueriesData<Occurrence[]>({ queryKey });
  for (const [key, list] of snapshot) {
    const [, , from, to] = key as ReturnType<typeof qk.schedule.occurrences>;
    if (list) queryClient.setQueryData(key, change(list, from, to).sort(compareOccurrences));
  }
  return { snapshot };
}

function rollback(queryClient: QueryClient, context: { snapshot: Snapshot } | undefined) {
  context?.snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data));
}

let tempIds = 0;

/** A not-yet-saved activity, so optimistic occurrences can be expanded like real ones. */
function draftActivity(id: number, input: ActivityInput, exceptions: string[] = []): Activity {
  const timestamp = new Date().toISOString();
  return { id, ...input, exceptions, createdAt: timestamp, updatedAt: timestamp };
}

/** Optimistic: the new occurrences show in every visible range at once. */
export function useCreateActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ActivityInput) => api.createActivity(input),
    onMutate: (input) => {
      const draft = draftActivity(-++tempIds, input);
      return patchOccurrences(queryClient, (list, from, to) => [...list, ...expandOccurrences([draft], from, to)]);
    },
    onError: (_error, _input, context) => rollback(queryClient, context),
    onSettled: () => queryClient.invalidateQueries({ queryKey: qk.schedule.all }),
  });
}

export type UpdateActivityVars = {
  id: number;
  scope: Scope;
  /** The occurrence being edited (required for scope `this`). */
  date?: string;
  input: ActivityInput;
};

/**
 * Edit or move. Optimistic: scope `this` (or a single activity) swaps one occurrence; scope `all` re-expands the
 * series from its cached copy (exceptions move with the start date, like the API).
 */
export function useUpdateActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, scope, date, input }: UpdateActivityVars) => api.updateActivity(id, input, scope, date),
    onMutate: ({ id, scope, date, input }) => {
      const series = queryClient.getQueryData<Activity>(qk.schedule.activity(id));
      const isSeries = series ? series.recurrence.kind !== 'none' : scope === 'this';

      if (isSeries && scope === 'this' && date) {
        const single = draftActivity(-++tempIds, { ...input, recurrence: { kind: 'none' } });
        return patchOccurrences(queryClient, (list, from, to) => [
          ...list.filter((o) => o.key !== occurrenceKey(id, date)),
          ...expandOccurrences([single], from, to),
        ]);
      }
      const shift = series ? daysBetween(series.date, input.date) : 0;
      const exceptions = series?.exceptions.map((d) => addDays(d, shift)) ?? [];
      const updated = draftActivity(id, input, input.recurrence.kind === 'none' ? [] : exceptions);
      return patchOccurrences(queryClient, (list, from, to) => [
        ...list.filter((o) => o.activityId !== id),
        ...expandOccurrences([updated], from, to),
      ]);
    },
    onError: (_error, _vars, context) => rollback(queryClient, context),
    onSettled: () => queryClient.invalidateQueries({ queryKey: qk.schedule.all }),
  });
}

export type DeleteActivityVars = { id: number; scope: Scope; date?: string };

/** Optimistic: scope `this` removes one occurrence, `all` the whole series. */
export function useDeleteActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, scope, date }: DeleteActivityVars) => api.deleteActivity(id, scope, date),
    onMutate: ({ id, scope, date }) =>
      patchOccurrences(queryClient, (list) =>
        list.filter((o) => (scope === 'this' && date ? o.key !== occurrenceKey(id, date) : o.activityId !== id))
      ),
    onError: (_error, _vars, context) => rollback(queryClient, context),
    onSettled: () => queryClient.invalidateQueries({ queryKey: qk.schedule.all }),
  });
}
