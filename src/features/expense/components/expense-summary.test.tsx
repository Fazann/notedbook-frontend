import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as currencyApi from '@/services/currency/currency-service';
import * as exchangeApi from '@/services/exchange/exchange-service';
import * as api from '@/services/expense/expense-service';
import { renderWithIntl } from '@/test/render';

import { ExpenseSummary } from './expense-summary';

vi.mock('@/services/expense/expense-service', () => ({ getExpenseSummary: vi.fn() }));
vi.mock('@/services/exchange/exchange-service', () => ({ getExchangeRates: vi.fn() }));
vi.mock('@/services/currency/currency-service', () => ({
  getCurrencySettings: vi.fn(),
  updateCurrencySettings: vi.fn(),
}));
vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, ...props }: React.ComponentProps<'a'> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const summary = (totals: { currency: 'USD' | 'KHR' | 'MYR'; amount: number; count: number }[]) => ({
  month: '2026-11',
  totals,
  by_category: [],
});

const usdRates = {
  base: 'USD',
  rates: { USD: 1, KHR: 4000, MYR: 4 },
  updatedAt: '2026-11-08T00:00:00Z',
  nextUpdateAt: '2026-11-09T00:00:00Z',
  provider: 'ExchangeRate-API',
  providerUrl: 'https://www.exchangerate-api.com',
};

beforeEach(() => {
  vi.mocked(exchangeApi.getExchangeRates).mockReset();
  vi.mocked(currencyApi.getCurrencySettings).mockResolvedValue({
    enabled: ['USD', 'KHR', 'MYR'],
    defaultCurrency: 'USD',
  });
});

describe('ExpenseSummary estimated total', () => {
  it('combines spending in several currencies into the default currency, marked as an estimate', async () => {
    vi.mocked(api.getExpenseSummary).mockResolvedValue(
      summary([
        { currency: 'USD', amount: 1250, count: 2 },
        { currency: 'KHR', amount: 40000, count: 1 },
      ])
    );
    vi.mocked(exchangeApi.getExchangeRates).mockResolvedValue(usdRates);
    renderWithIntl(<ExpenseSummary month="2026-11" />);

    expect(await screen.findByText('≈ $22.50')).toBeInTheDocument();
    expect(screen.getByText('Total in USD')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'See rates' })).toHaveAttribute('href', '/exchange');
    // The real per-currency totals are still there.
    expect(screen.getByText('$12.50')).toBeInTheDocument();
    expect(screen.getByText('៛40,000')).toBeInTheDocument();
    expect(exchangeApi.getExchangeRates).toHaveBeenCalledWith('USD');
  });

  it('is hidden, and no rates are fetched, when only one currency has spending', async () => {
    vi.mocked(api.getExpenseSummary).mockResolvedValue(summary([{ currency: 'USD', amount: 1250, count: 2 }]));
    renderWithIntl(<ExpenseSummary month="2026-11" />);

    expect(await screen.findByText('$12.50')).toBeInTheDocument();
    expect(screen.queryByText(/Total in/)).not.toBeInTheDocument();
    expect(exchangeApi.getExchangeRates).not.toHaveBeenCalled();
  });

  it('says rates are unavailable instead of showing a wrong number', async () => {
    vi.mocked(api.getExpenseSummary).mockResolvedValue(
      summary([
        { currency: 'USD', amount: 1250, count: 2 },
        { currency: 'MYR', amount: 2000, count: 1 },
      ])
    );
    vi.mocked(exchangeApi.getExchangeRates).mockRejectedValue(new Error('down'));
    renderWithIntl(<ExpenseSummary month="2026-11" />);

    expect(await screen.findByText(/Rates are not available right now/)).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
