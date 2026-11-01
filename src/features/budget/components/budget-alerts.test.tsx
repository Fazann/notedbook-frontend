import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '@/services/budget/budget-service';
import { renderWithIntl } from '@/test/render';

import type { Budget } from '../types';

import { BudgetAlerts } from './budget-alerts';

vi.mock('@/services/budget/budget-service', () => ({ listBudgets: vi.fn() }));
vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

const budget = (over: Partial<Budget>): Budget => ({
  id: 1,
  amount: 20000,
  currency: 'USD',
  alert_percent: 80,
  spent: 17000,
  percent: 85,
  status: 'near',
  created_at: '',
  updated_at: '',
  ...over,
});

describe('BudgetAlerts', () => {
  beforeEach(() => vi.clearAllMocks());

  it('warns when total spending is near the limit, and links to the budget page', async () => {
    vi.mocked(api.listBudgets).mockResolvedValue([budget({})]);
    renderWithIntl(<BudgetAlerts />);
    expect(await screen.findByText("You're close to your budget")).toBeInTheDocument();
    expect(screen.getByText("You've used 85% of your USD budget. $30.00 left this month.")).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View budget' })).toHaveAttribute('href', '/budgets');
  });

  it('shows the over-budget message first, and can hide the link', async () => {
    vi.mocked(api.listBudgets).mockResolvedValue([
      budget({}),
      budget({ id: 2, currency: 'KHR', amount: 400000, spent: 500000, percent: 125, status: 'over' }),
    ]);
    renderWithIntl(<BudgetAlerts hideLink />);
    const alerts = await screen.findAllByRole('alert');
    expect(alerts[0]).toHaveTextContent("You're over budget");
    expect(alerts[1]).toHaveTextContent("You're close to your budget");
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('shows nothing while spending is below the alert level', async () => {
    vi.mocked(api.listBudgets).mockResolvedValue([budget({ spent: 1000, percent: 5, status: 'ok' })]);
    const { container } = renderWithIntl(<BudgetAlerts />);
    await waitFor(() => expect(api.listBudgets).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve));
    expect(container).toBeEmptyDOMElement();
  });
});
