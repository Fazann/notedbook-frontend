import { type ExchangeRates, exchangeRatesSchema } from '@/features/exchange/types';

import { apiCall } from '../core/api-call';
import { ApiEndpoint } from '../core/api-endpoints';

/** Latest rates of every currency against `base` (fetched and cached by the API, updated daily). */
export async function getExchangeRates(base: string): Promise<ExchangeRates> {
  return exchangeRatesSchema.parse(await apiCall.get(ApiEndpoint.ExchangeRates, { base }));
}
