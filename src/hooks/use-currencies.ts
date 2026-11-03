'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { DEFAULT_CURRENCY_SETTINGS, pickCurrencies, type Currency, type CurrencySettings } from '@/lib/money';
import { qk } from '@/lib/query-keys';
import * as api from '@/services/currency/currency-service';

/** The user's currency settings from the API. They only change through this app, so they stay fresh for long. */
export function useCurrencySettings() {
  return useQuery({
    queryKey: qk.currencySettings,
    queryFn: api.getCurrencySettings,
    staleTime: 30 * 60 * 1000,
  });
}

/**
 * The currencies the user enabled (Settings → Currencies), in the fixed order, plus any in `alsoShow` — e.g. a
 * disabled currency that still has data, so existing money is never hidden. Every currency until the settings load.
 */
export function useEnabledCurrencies(alsoShow: readonly Currency[] = []): Currency[] {
  const { data } = useCurrencySettings();
  return pickCurrencies((data ?? DEFAULT_CURRENCY_SETTINGS).enabled, alsoShow);
}

/** The currency new expenses and budgets start in; USD until the settings load. */
export function useDefaultCurrency(): Currency {
  const { data } = useCurrencySettings();
  return (data ?? DEFAULT_CURRENCY_SETTINGS).defaultCurrency;
}

/** Saves the settings. Optimistic: every screen switches at once and goes back if the API refuses. */
export function useUpdateCurrencySettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settings: CurrencySettings) => api.updateCurrencySettings(settings),
    onMutate: async (settings) => {
      await queryClient.cancelQueries({ queryKey: qk.currencySettings });
      const previous = queryClient.getQueryData<CurrencySettings>(qk.currencySettings);
      queryClient.setQueryData(qk.currencySettings, settings);
      return { previous };
    },
    onError: (_error, _settings, context) => queryClient.setQueryData(qk.currencySettings, context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: qk.currencySettings }),
  });
}
