import type {
  Category,
  CategoryFormValues,
  Expense,
  ExpenseInput,
  ExpenseListParams,
  ExpenseSummary,
} from '@/features/expense/types';
import type { ListParams, Paginated } from '@/lib/list';

import { apiCall } from '../core/api-call';
import { ApiEndpoint, buildPath } from '../core/api-endpoints';

import {
  type ApiCategory,
  type ApiExpense,
  type ApiExpenseSummary,
  toApiSort,
  toCategory,
  toCategoryBody,
  toExpense,
  toExpenseBody,
  toExpenseSummary,
} from './expense-mappers';

/** Most expenses one month can load at once (the API's page limit). */
const MONTH_LIMIT = 1000;

const mapPage = <A, T>(page: Paginated<A>, map: (item: A) => T): Paginated<T> => ({
  ...page,
  data: page.data.map(map),
});

export async function listCategories(params: ListParams): Promise<Paginated<Category>> {
  const page = await apiCall.getPage<ApiCategory>(ApiEndpoint.Categories, {
    page: params.page,
    pageSize: params.pageSize,
    q: params.search || undefined,
    sort: params.sort ? toApiSort(params.sort) : undefined,
  });
  return mapPage(page, toCategory);
}

export async function listAllCategories(): Promise<Category[]> {
  return (await apiCall.get<ApiCategory[]>(ApiEndpoint.CategoriesAll)).map(toCategory);
}

/** Taken name: 409 `CATEGORY_NAME_TAKEN`. */
export async function createCategory(input: CategoryFormValues): Promise<Category> {
  return toCategory(await apiCall.post<ApiCategory>(ApiEndpoint.Categories, toCategoryBody(input)));
}

/** Default categories are read-only: 403 `CATEGORY_IS_DEFAULT`. */
export async function updateCategory(id: number, input: CategoryFormValues): Promise<Category> {
  const path = buildPath(ApiEndpoint.CategoryDetail, { id });
  // An update replaces all translations; read them first so the ones this form does not edit (e.g. Malay) are kept.
  const current = await apiCall.get<ApiCategory>(path);
  return toCategory(await apiCall.put<ApiCategory>(path, toCategoryBody(input, current.translations)));
}

/** A category with expenses needs `reassignTo` (409 `CATEGORY_IN_USE` without it); they are moved there. */
export function deleteCategory(id: number, reassignTo?: number): Promise<void> {
  return apiCall.delete(buildPath(ApiEndpoint.CategoryDetail, { id }), { reassign_to: reassignTo });
}

/**
 * Every expense of a month (dashboard charts).
 * TODO(api): only the first 1000 are loaded; the dashboard totals come from the summary, so they stay right.
 */
export async function listExpenses(month: string): Promise<Expense[]> {
  const page = await apiCall.getPage<ApiExpense>(ApiEndpoint.Expenses, { page: 1, pageSize: MONTH_LIMIT, month });
  return page.data.map(toExpense);
}

/** One page of a month's expenses, filtered and sorted. */
export async function listExpensesPage(params: ExpenseListParams): Promise<Paginated<Expense>> {
  const page = await apiCall.getPage<ApiExpense>(ApiEndpoint.Expenses, {
    page: params.page,
    pageSize: params.pageSize,
    month: params.month,
    q: params.search || undefined,
    sort: params.sort ? toApiSort(params.sort) : undefined,
    category_id: params.categoryId,
    currency: params.currency || undefined,
  });
  return mapPage(page, toExpense);
}

export async function getExpenseSummary(month: string): Promise<ExpenseSummary> {
  return toExpenseSummary(await apiCall.get<ApiExpenseSummary>(ApiEndpoint.ExpenseSummary, { month }));
}

export async function createExpense(input: ExpenseInput): Promise<Expense> {
  return toExpense(await apiCall.post<ApiExpense>(ApiEndpoint.Expenses, toExpenseBody(input)));
}

export async function updateExpense(id: number, input: ExpenseInput): Promise<Expense> {
  return toExpense(await apiCall.put<ApiExpense>(buildPath(ApiEndpoint.ExpenseDetail, { id }), toExpenseBody(input)));
}

export function deleteExpense(id: number): Promise<void> {
  return apiCall.delete(buildPath(ApiEndpoint.ExpenseDetail, { id }));
}
