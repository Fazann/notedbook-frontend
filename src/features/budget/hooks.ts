'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { qk } from '@/lib/query-keys';
import * as api from '@/services/budget/budget-service';

import type { Budget, BudgetInput } from './types';

/** Every budget, compared by the API with the spending of `month`. */
export function useBudgets(month: string) {
  return useQuery({ queryKey: qk.budgets.list(month), queryFn: () => api.listBudgets(month) });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BudgetInput) => api.createBudget(input),
    onSettled: () => queryClient.invalidateQueries({ queryKey: qk.budgets.all }),
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: BudgetInput }) => api.updateBudget(id, input),
    onSettled: () => queryClient.invalidateQueries({ queryKey: qk.budgets.all }),
  });
}

/** Optimistic: the budget disappears from every cached month at once; rolled back if the API fails. */
export function useDeleteBudget() {
  const queryClient = useQueryClient();
  const queryKey = qk.budgets.all;
  return useMutation({
    mutationFn: (id: number) => api.deleteBudget(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const snapshot = queryClient.getQueriesData<Budget[]>({ queryKey });
      queryClient.setQueriesData<Budget[]>({ queryKey }, (old) => old?.filter((b) => b.id !== id));
      return { snapshot };
    },
    onError: (_error, _id, context) => {
      context?.snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
}
