import type { Budget, BudgetInput } from '@/features/budget/types';
import { isMocked } from '@/lib/env';
import * as mock from '@/mocks/handlers/budget';

import { apiCall } from '../core/api-call';
import { ApiEndpoint, buildPath } from '../core/api-endpoints';

import { type ApiBudget, type ApiBudgetStatus, toBudget, toBudgetBody } from './budget-mappers';

/** Every budget (at most one per currency), compared by the API with the spending of `month` (`YYYY-MM`). */
export async function listBudgets(month: string): Promise<Budget[]> {
  if (isMocked('budget')) return mock.listBudgets(month);
  return (await apiCall.get<ApiBudgetStatus[]>(ApiEndpoint.Budgets, { month })).map(toBudget);
}

/** A currency that already has a budget: 409 `BUDGET_EXISTS`. */
export async function createBudget(input: BudgetInput): Promise<void> {
  if (isMocked('budget')) return mock.createBudget(input);
  await apiCall.post<ApiBudget>(ApiEndpoint.Budgets, toBudgetBody(input));
}

export async function updateBudget(id: number, input: BudgetInput): Promise<void> {
  if (isMocked('budget')) return mock.updateBudget(id, input);
  await apiCall.put<ApiBudget>(buildPath(ApiEndpoint.BudgetDetail, { id }), toBudgetBody(input));
}

export function deleteBudget(id: number): Promise<void> {
  if (isMocked('budget')) return mock.deleteBudget(id);
  return apiCall.delete(buildPath(ApiEndpoint.BudgetDetail, { id }));
}
