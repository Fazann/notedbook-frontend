import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import * as currencyApi from '@/services/currency/currency-service';
import * as api from '@/services/expense/expense-service';
import { renderWithIntl } from '@/test/render';

import { SpendingTotalCard } from './spending-total-card';

vi.mock('@/services/expense/expense-service', () => ({ getExpenseSummary: vi.fn() }));
vi.mock('@/services/currency/currency-service', () => ({ getCurrencySettings: vi.fn() }));

describe('SpendingTotalCard', () => {
  it('counts expenses in all currencies and lists the enabled ones, plus disabled ones with spending', async () => {
    vi.mocked(currencyApi.getCurrencySettings).mockResolvedValue({ enabled: ['USD'], defaultCurrency: 'USD' });
    vi.mocked(api.getExpenseSummary).mockResolvedValue({
      month: '2026-11',
      totals: [
        { currency: 'USD', amount: 1250, count: 2 },
        { currency: 'KHR', amount: 40000, count: 1 },
      ],
      by_category: [],
    });

    renderWithIntl(<SpendingTotalCard month="2026-11" />);
    expect(await screen.findByText('3 expenses')).toBeInTheDocument();
    expect(screen.getByText('$12.50')).toBeInTheDocument();
    await waitFor(() => expect(currencyApi.getCurrencySettings).toHaveBeenCalled());
    // KHR is disabled but still has spending this month, so it is shown; MYR has none, so it is hidden.
    expect(screen.getByText('៛40,000')).toBeInTheDocument();
    expect(screen.queryByText(/MYR/)).not.toBeInTheDocument();
  });
});
