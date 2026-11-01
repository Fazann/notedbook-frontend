import { act, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { currentMonth } from '@/lib/dates';
import { qk } from '@/lib/query-keys';
import * as api from '@/services/budget/budget-service';
import { renderWithIntl } from '@/test/render';

import type { Budget } from '../types';

import { BudgetAlertWatcher } from './budget-alert-watcher';

vi.mock('@/services/budget/budget-service', () => ({ listBudgets: vi.fn() }));
vi.mock('@/i18n/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('sonner', () => ({ toast: { warning: vi.fn(), error: vi.fn() } }));

const budget = (over: Partial<Budget>): Budget => ({
  id: 1,
  amount: 20000,
  currency: 'USD',
  alert_percent: 80,
  spent: 10000,
  percent: 50,
  status: 'ok',
  created_at: '',
  updated_at: '',
  ...over,
});

/** What saving an expense does: the budgets are fetched again and come back with the new total. */
async function saveExpense(queryClient: ReturnType<typeof renderWithIntl>['queryClient'], next: Budget) {
  vi.mocked(api.listBudgets).mockResolvedValue([next]);
  await act(() => queryClient.invalidateQueries({ queryKey: qk.budgets.all }));
}

describe('BudgetAlertWatcher', () => {
  beforeEach(() => vi.clearAllMocks());

  it('warns once when spending reaches the alert level', async () => {
    vi.mocked(api.listBudgets).mockResolvedValue([budget({})]);
    const { queryClient } = renderWithIntl(<BudgetAlertWatcher />);
    await waitFor(() => expect(queryClient.getQueryData(qk.budgets.list(currentMonth()))).toBeDefined());

    await saveExpense(queryClient, budget({ spent: 17000, percent: 85, status: 'near' }));
    await waitFor(() => expect(toast.warning).toHaveBeenCalledTimes(1));
    expect(toast.warning).toHaveBeenCalledWith(
      "You're close to your budget",
      expect.objectContaining({ description: "You've used 85% of your USD budget. $30.00 left this month." })
    );

    await saveExpense(queryClient, budget({ spent: 18000, percent: 90, status: 'near' }));
    expect(toast.warning).toHaveBeenCalledTimes(1);
  });

  it('shows an error when spending goes over the limit', async () => {
    vi.mocked(api.listBudgets).mockResolvedValue([budget({ spent: 17000, percent: 85, status: 'near' })]);
    const { queryClient } = renderWithIntl(<BudgetAlertWatcher />);
    await waitFor(() => expect(queryClient.getQueryData(qk.budgets.list(currentMonth()))).toBeDefined());

    await saveExpense(queryClient, budget({ spent: 21000, percent: 105, status: 'over' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
    expect(toast.error).toHaveBeenCalledWith(
      "You're over budget",
      expect.objectContaining({ description: "You've spent $10.00 more than your USD budget this month." })
    );
  });

  it('stays quiet on page load, even when already near the limit', async () => {
    vi.mocked(api.listBudgets).mockResolvedValue([budget({ spent: 17000, percent: 85, status: 'near' })]);
    const { queryClient } = renderWithIntl(<BudgetAlertWatcher />);
    await waitFor(() => expect(queryClient.getQueryData(qk.budgets.list(currentMonth()))).toBeDefined());
    expect(toast.warning).not.toHaveBeenCalled();
  });
});
