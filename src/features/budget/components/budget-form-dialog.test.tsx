import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '@/services/budget/budget-service';
import { ApiError } from '@/services/core/api-call';
import { renderWithIntl } from '@/test/render';

import type { Budget } from '../types';

import { BudgetFormDialog } from './budget-form-dialog';

vi.mock('@/services/budget/budget-service', () => ({ createBudget: vi.fn(), updateBudget: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const usd: Budget = {
  id: 1,
  amount: 20000,
  currency: 'USD',
  alert_percent: 90,
  spent: 0,
  percent: 0,
  status: 'ok',
  created_at: '',
  updated_at: '',
};

const limitInput = () => screen.getByRole('textbox', { name: 'Monthly limit' });
const save = () => fireEvent.click(screen.getByRole('button', { name: 'Save' }));

describe('BudgetFormDialog', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requires a limit', async () => {
    renderWithIntl(<BudgetFormDialog open onOpenChange={() => {}} defaultCurrency="USD" />);
    save();
    expect(await screen.findByText('Please enter a limit')).toBeInTheDocument();
    expect(api.createBudget).not.toHaveBeenCalled();
  });

  it('rejects a limit of zero', async () => {
    renderWithIntl(<BudgetFormDialog open onOpenChange={() => {}} defaultCurrency="USD" />);
    fireEvent.change(limitInput(), { target: { value: '0' } });
    save();
    expect(await screen.findByText('Please enter a valid amount')).toBeInTheDocument();
  });

  it('creates a budget in minor units, accepting Khmer digits', async () => {
    vi.mocked(api.createBudget).mockResolvedValue();
    const onOpenChange = vi.fn();
    renderWithIntl(<BudgetFormDialog open onOpenChange={onOpenChange} defaultCurrency="KHR" />);
    fireEvent.change(limitInput(), { target: { value: '៤០០០០០' } });
    save();
    await waitFor(() =>
      expect(api.createBudget).toHaveBeenCalledWith({ amount: 400000, currency: 'KHR', alert_percent: 80 })
    );
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it('edits the existing budget', async () => {
    vi.mocked(api.updateBudget).mockResolvedValue();
    renderWithIntl(<BudgetFormDialog open onOpenChange={() => {}} budget={usd} defaultCurrency="KHR" />);
    expect(limitInput()).toHaveValue('200.00');
    fireEvent.change(limitInput(), { target: { value: '250' } });
    save();
    await waitFor(() =>
      expect(api.updateBudget).toHaveBeenCalledWith(1, { amount: 25000, currency: 'USD', alert_percent: 90 })
    );
  });

  it('shows the error under the currency when it already has a budget', async () => {
    vi.mocked(api.createBudget).mockRejectedValue(new ApiError(409, 'BUDGET_EXISTS', 'From the API'));
    renderWithIntl(<BudgetFormDialog open onOpenChange={() => {}} defaultCurrency="USD" />);
    fireEvent.change(limitInput(), { target: { value: '100' } });
    save();
    expect(await screen.findByText('You already have a budget in this currency.')).toBeInTheDocument();
  });
});
