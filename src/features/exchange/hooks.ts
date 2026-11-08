'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { qk } from '@/lib/query-keys';
import * as api from '@/services/exchange/exchange-service';

/** Rates against `base`. They change once a day, so an hour-old copy is fine; the old base stays while switching. */
export function useExchangeRates(base: string) {
  return useQuery({
    queryKey: qk.exchange.rates(base),
    queryFn: () => api.getExchangeRates(base),
    staleTime: 60 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}
