import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiCall } from '../core/api-call';
import { ApiEndpoint } from '../core/api-endpoints';

import { getCurrencySettings, updateCurrencySettings } from './currency-service';

vi.mock('../core/api-call', () => ({ apiCall: { get: vi.fn(), put: vi.fn() } }));

describe('currency service', () => {
  beforeEach(() => vi.clearAllMocks());

  it('maps the API settings, keeping the fixed order and dropping unknown codes', async () => {
    vi.mocked(apiCall.get).mockResolvedValue({ enabled_currencies: ['MYR', 'EUR', 'USD'], default_currency: 'MYR' });
    expect(await getCurrencySettings()).toEqual({ enabled: ['USD', 'MYR'], defaultCurrency: 'MYR' });
    expect(apiCall.get).toHaveBeenCalledWith(ApiEndpoint.CurrencySettings);
  });

  it('falls back to every currency and the first one when nothing usable comes back', async () => {
    vi.mocked(apiCall.get).mockResolvedValue({ enabled_currencies: ['EUR'], default_currency: 'EUR' });
    expect(await getCurrencySettings()).toEqual({ enabled: ['USD', 'KHR', 'MYR'], defaultCurrency: 'USD' });
  });

  it('sends snake_case fields', async () => {
    vi.mocked(apiCall.put).mockResolvedValue({ enabled_currencies: ['KHR'], default_currency: 'KHR' });
    await updateCurrencySettings({ enabled: ['KHR'], defaultCurrency: 'KHR' });
    expect(apiCall.put).toHaveBeenCalledWith(ApiEndpoint.CurrencySettings, {
      enabled_currencies: ['KHR'],
      default_currency: 'KHR',
    });
  });
});
