import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as currencyApi from '@/services/currency/currency-service';
import * as api from '@/services/exchange/exchange-service';
import { renderWithIntl } from '@/test/render';

import type { ExchangeRates } from '../types';

import { ExchangePage } from './exchange-page';

vi.mock('@/services/exchange/exchange-service', () => ({ getExchangeRates: vi.fn() }));
vi.mock('@/services/currency/currency-service', () => ({
  getCurrencySettings: vi.fn(),
  updateCurrencySettings: vi.fn(),
}));

const USD: Record<string, number> = { USD: 1, KHR: 4000, MYR: 4, EUR: 0.8, THB: 33 };

const ratesFor = (base: string): ExchangeRates => {
  const rates = Object.fromEntries(Object.entries(USD).map(([code, r]) => [code, r / USD[base]]));
  return {
    base,
    rates,
    updatedAt: '2026-11-08T00:02:31Z',
    nextUpdateAt: '2099-01-01T00:00:00Z',
    provider: 'ExchangeRate-API',
    providerUrl: 'https://www.exchangerate-api.com',
  };
};

beforeEach(() => {
  vi.mocked(api.getExchangeRates).mockReset();
  vi.mocked(api.getExchangeRates).mockImplementation(async (base) => ratesFor(base));
  vi.mocked(currencyApi.getCurrencySettings).mockResolvedValue({
    enabled: ['USD', 'KHR', 'MYR'],
    defaultCurrency: 'USD',
  });
});

const result = () => screen.getByText(/^1 [A-Z]{3} = /).parentElement as HTMLElement;

describe('ExchangePage', () => {
  it('converts from the default currency into KHR and credits the source', async () => {
    renderWithIntl(<ExchangePage />);
    expect(await screen.findByText('1 USD = 4,000 KHR')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '25' } });
    expect(within(result()).getByText('៛100,000')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'ExchangeRate-API' })).toHaveAttribute(
      'href',
      'https://www.exchangerate-api.com'
    );
  });

  it('lists rates with country names, never THB, and converts into a tapped currency', async () => {
    renderWithIntl(<ExchangePage />);
    const list = (await screen.findByRole('heading', { name: "Today's rates" })).closest('[data-slot=card]');
    const rows = within(list as HTMLElement);
    expect(rows.getByText('Cambodia')).toBeInTheDocument();
    expect(rows.getByText('European Union')).toBeInTheDocument();
    expect(rows.queryByText(/THB/)).not.toBeInTheDocument();

    fireEvent.change(rows.getByRole('searchbox'), { target: { value: 'europe' } });
    expect(rows.queryByText('Cambodia')).not.toBeInTheDocument();
    fireEvent.click(rows.getByRole('button', { name: /European Union/ }));
    expect(await screen.findByText('1 USD = 0.8 EUR')).toBeInTheDocument();
  });

  it('swaps the currencies and loads rates for the new base', async () => {
    renderWithIntl(<ExchangePage />);
    await screen.findByText('1 USD = 4,000 KHR');
    fireEvent.click(screen.getByRole('button', { name: 'Swap currencies' }));
    expect(await screen.findByText('1 KHR = 0.00025 USD')).toBeInTheDocument();
    expect(api.getExchangeRates).toHaveBeenCalledWith('KHR');
  });

  it('shows an error with retry when the rates cannot load', async () => {
    vi.mocked(api.getExchangeRates).mockRejectedValue(new Error('down'));
    renderWithIntl(<ExchangePage />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load exchange rates');
    vi.mocked(api.getExchangeRates).mockImplementation(async (base) => ratesFor(base));
    fireEvent.click(screen.getByRole('button', { name: /Try again/ }));
    await waitFor(() => expect(screen.getByText('1 USD = 4,000 KHR')).toBeInTheDocument());
  });
});
