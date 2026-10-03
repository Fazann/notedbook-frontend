import type {
  Category,
  CategoryFormValues,
  Expense,
  ExpenseInput,
  ExpenseListParams,
  ExpenseSummary,
} from '@/features/expense/types';
import { isMocked } from '@/lib/env';
import type { ListParams, Paginated } from '@/lib/list';
import * as mockCategory from '@/mocks/handlers/category';
import * as mock from '@/mocks/handlers/expense';

import { apiCall } from './api-call';
import { ApiEndpoint, buildPath } from './api-endpoints';

/** `locale` is only used by the mock; the real API reads the Accept-Language header. */
export function listCategories(params: ListParams, locale: string): Promise<Paginated<Category>> {
  if (isMocked('expense')) return mockCategory.listCategories(params, locale);
  return apiCall.getPage(ApiEndpoint.Categories, {
    page: params.page,
    pageSize: params.pageSize,
    q: params.search || undefined,
    sort: params.sort || undefined,
  });
}

export function listAllCategories(): Promise<Category[]> {
  if (isMocked('expense')) return mockCategory.listAllCategories();
  return apiCall.get(ApiEndpoint.CategoriesAll);
}

/**
 * TODO(api): the backend must store and return `nameKm` (optional Khmer name, max 50) on categories, and match it in
 * `q` search. Until then it is ignored by the real API.
 */
export function createCategory(input: CategoryFormValues): Promise<Category> {
  if (isMocked('expense')) return mockCategory.createCategory(input);
  return apiCall.post(ApiEndpoint.Categories, input);
}

export function updateCategory(id: number, input: CategoryFormValues): Promise<Category> {
  if (isMocked('expense')) return mockCategory.updateCategory(id, input);
  return apiCall.put(buildPath(ApiEndpoint.CategoryDetail, { id }), input);
}

export function deleteCategory(id: number, reassignTo?: number): Promise<void> {
  if (isMocked('expense')) return mockCategory.deleteCategory(id, reassignTo);
  return apiCall.delete(buildPath(ApiEndpoint.CategoryDetail, { id }), { reassignTo });
}

export function listExpenses(month: string): Promise<Expense[]> {
  if (isMocked('expense')) return mock.listExpenses(month);
  return apiCall.get(ApiEndpoint.Expenses, { month });
}

/** One page of a month's expenses, filtered and sorted. */
export function listExpensesPage(params: ExpenseListParams): Promise<Paginated<Expense>> {
  if (isMocked('expense')) return mock.listExpensesPage(params);
  return apiCall.getPage(ApiEndpoint.Expenses, {
    page: params.page,
    pageSize: params.pageSize,
    month: params.month,
    q: params.search || undefined,
    sort: params.sort || undefined,
    category_id: params.categoryId,
    currency: params.currency || undefined,
  });
}

export function getExpenseSummary(month: string): Promise<ExpenseSummary> {
  if (isMocked('expense')) return mock.getSummary(month);
  return apiCall.get(ApiEndpoint.ExpenseSummary, { month });
}

export function createExpense(input: ExpenseInput): Promise<Expense> {
  if (isMocked('expense')) return mock.createExpense(input);
  return apiCall.post(ApiEndpoint.Expenses, input);
}

export function updateExpense(id: number, input: ExpenseInput): Promise<Expense> {
  if (isMocked('expense')) return mock.updateExpense(id, input);
  return apiCall.put(buildPath(ApiEndpoint.ExpenseDetail, { id }), input);
}

export function deleteExpense(id: number): Promise<void> {
  if (isMocked('expense')) return mock.deleteExpense(id);
  return apiCall.delete(buildPath(ApiEndpoint.ExpenseDetail, { id }));
}
