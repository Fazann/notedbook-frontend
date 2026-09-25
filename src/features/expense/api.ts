import { apiClient } from '@/lib/api-client';
import { env } from '@/lib/env';
import type { ListParams, Paginated } from '@/lib/list';
import * as mockCategory from '@/mocks/handlers/category';
import * as mock from '@/mocks/handlers/expense';

import type { Category, CategoryFormValues, Expense, ExpenseInput, ExpenseListParams, ExpenseSummary } from './types';

/** `locale` is only used by the mock; the real API reads the Accept-Language header. */
export function listCategories(params: ListParams, locale: string): Promise<Paginated<Category>> {
  if (env.useMocks) return mockCategory.listCategories(params, locale);
  const query = new URLSearchParams({ page: String(params.page), pageSize: String(params.pageSize) });
  if (params.search) query.set('q', params.search);
  if (params.sort) query.set('sort', params.sort);
  return apiClient.get(`/categories?${query}`);
}

export function listAllCategories(): Promise<Category[]> {
  if (env.useMocks) return mockCategory.listAllCategories();
  return apiClient.get('/categories/all');
}

export function createCategory(input: CategoryFormValues): Promise<Category> {
  if (env.useMocks) return mockCategory.createCategory(input);
  return apiClient.post('/categories', input);
}

export function updateCategory(id: number, input: CategoryFormValues): Promise<Category> {
  if (env.useMocks) return mockCategory.updateCategory(id, input);
  return apiClient.put(`/categories/${id}`, input);
}

export function deleteCategory(id: number, reassignTo?: number): Promise<void> {
  if (env.useMocks) return mockCategory.deleteCategory(id, reassignTo);
  return apiClient.delete(`/categories/${id}${reassignTo === undefined ? '' : `?reassignTo=${reassignTo}`}`);
}

export function listExpenses(month: string): Promise<Expense[]> {
  if (env.useMocks) return mock.listExpenses(month);
  return apiClient.get(`/expenses?month=${month}`);
}

/**
 * One page of a month's expenses, filtered and sorted.
 * TODO(api): the backend's GET /expenses must return `Paginated<Expense>` when `page` is sent and accept
 * `q`, `sort`, `pageSize` and `currency` (the dashboard still uses the unpaged `listExpenses`).
 */
export function listExpensesPage(params: ExpenseListParams): Promise<Paginated<Expense>> {
  if (env.useMocks) return mock.listExpensesPage(params);
  const query = new URLSearchParams({
    month: params.month,
    page: String(params.page),
    pageSize: String(params.pageSize),
  });
  if (params.search) query.set('q', params.search);
  if (params.sort) query.set('sort', params.sort);
  if (params.categoryId !== undefined) query.set('category_id', String(params.categoryId));
  if (params.currency) query.set('currency', params.currency);
  return apiClient.get(`/expenses?${query}`);
}

export function getExpenseSummary(month: string): Promise<ExpenseSummary> {
  if (env.useMocks) return mock.getSummary(month);
  return apiClient.get(`/expenses/summary?month=${month}`);
}

export function createExpense(input: ExpenseInput): Promise<Expense> {
  if (env.useMocks) return mock.createExpense(input);
  return apiClient.post('/expenses', input);
}

export function updateExpense(id: number, input: ExpenseInput): Promise<Expense> {
  if (env.useMocks) return mock.updateExpense(id, input);
  return apiClient.put(`/expenses/${id}`, input);
}

export function deleteExpense(id: number): Promise<void> {
  if (env.useMocks) return mock.deleteExpense(id);
  return apiClient.delete(`/expenses/${id}`);
}
