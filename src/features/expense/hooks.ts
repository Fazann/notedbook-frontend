'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocale } from 'next-intl';

import { removeFromPage, type ListParams, type Paginated } from '@/lib/list';
import { qk } from '@/lib/query-keys';
import * as api from '@/services/expense-service';

import type { Category, CategoryFormValues, Expense, ExpenseInput, ExpenseListParams } from './types';

/** One page of categories (search / sort / paging). Keeps the previous page on screen while the next loads. */
export function useCategories(params: ListParams) {
  const locale = useLocale();
  return useQuery({
    queryKey: qk.categories.list(params, locale),
    queryFn: () => api.listCategories(params, locale),
    placeholderData: keepPreviousData,
  });
}

/** Every category, unpaged — for comboboxes, charts and badges. */
export function useCategoryOptions() {
  return useQuery({ queryKey: qk.categories.options(), queryFn: api.listAllCategories, staleTime: 5 * 60_000 });
}

export function useExpenses(month: string) {
  return useQuery({ queryKey: qk.expenses.list(month), queryFn: () => api.listExpenses(month) });
}

/** One page of the expenses list. Keeps the previous page on screen while the next loads. */
export function useExpenseList(params: ExpenseListParams) {
  return useQuery({
    queryKey: qk.expenses.page(params),
    queryFn: () => api.listExpensesPage(params),
    placeholderData: keepPreviousData,
  });
}

export function useExpenseSummary(month: string) {
  return useQuery({ queryKey: qk.expenses.summary(month), queryFn: () => api.getExpenseSummary(month) });
}

/** Saving an expense can change any month's list and summary, and category expense counts. */
function useInvalidateExpenses() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: qk.expenses.all }),
      queryClient.invalidateQueries({ queryKey: qk.categories.all }),
    ]);
}

export function useCreateExpense() {
  const invalidate = useInvalidateExpenses();
  return useMutation({
    mutationFn: (input: ExpenseInput) => api.createExpense(input),
    onSettled: invalidate,
  });
}

export function useUpdateExpense() {
  const invalidate = useInvalidateExpenses();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: ExpenseInput }) => api.updateExpense(id, input),
    onSettled: invalidate,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CategoryFormValues) => api.createCategory(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.categories.all }),
  });
}

/** Names, icons and colors also show in expense lists and the dashboard, so refresh those too. */
export function useUpdateCategory() {
  const invalidate = useInvalidateExpenses();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: CategoryFormValues }) => api.updateCategory(id, input),
    onSuccess: invalidate,
  });
}

type PagesSnapshot<T> = [readonly unknown[], Paginated<T> | undefined][];

/** Removes item `id` from every cached page under `queryKey`; returns what to restore if the API fails. */
function useOptimisticRemove<T extends { id: number }>(queryKey: readonly unknown[]) {
  const queryClient = useQueryClient();
  return {
    remove: async (id: number) => {
      await queryClient.cancelQueries({ queryKey });
      const snapshot: PagesSnapshot<T> = queryClient.getQueriesData<Paginated<T>>({ queryKey });
      queryClient.setQueriesData<Paginated<T>>({ queryKey }, (old) => old && removeFromPage(old, id));
      return { snapshot };
    },
    rollback: (context: { snapshot: PagesSnapshot<T> } | undefined) => {
      context?.snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
  };
}

/** Optimistic: the row disappears from every cached page at once; rolled back if the API fails. */
export function useDeleteCategory() {
  const invalidate = useInvalidateExpenses();
  const { remove, rollback } = useOptimisticRemove<Category>(qk.categories.lists);
  return useMutation({
    mutationFn: ({ id, reassignTo }: { id: number; reassignTo?: number }) => api.deleteCategory(id, reassignTo),
    onMutate: ({ id }) => remove(id),
    onError: (_error, _vars, context) => rollback(context),
    onSettled: invalidate,
  });
}

/** Optimistic: the row disappears from every cached page at once; rolled back if the API fails. */
export function useDeleteExpense() {
  const invalidate = useInvalidateExpenses();
  const { remove, rollback } = useOptimisticRemove<Expense>(qk.expenses.pages);
  return useMutation({
    mutationFn: (id: number) => api.deleteExpense(id),
    onMutate: (id) => remove(id),
    onError: (_error, _id, context) => rollback(context),
    onSettled: invalidate,
  });
}
