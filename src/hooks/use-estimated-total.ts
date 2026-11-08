'use client';

import { estimateTotal, type Currency } from '@/lib/money';

import { useDefaultCurrency } from './use-currencies';
import { useExchangeRates } from './use-exchange-rates';

export type EstimatedTotal = {
  /** False when fewer than two currencies have spending: one currency's total needs no estimate. */
  show: boolean;
  /** The user's default currency, which the estimate is in. */
  currency: Currency;
  /** Integer minor units in `currency`; undefined while loading or when the rates are unavailable. */
  amount: number | undefined;
  isLoading: boolean;
  isError: boolean;
};

/**
 * Month totals in several currencies as one "≈" amount in the user's default currency, at today's rates (fetched only
 * when there is something to combine). For display only; the per-currency totals stay the real numbers.
 */
export function useEstimatedTotal(
  totals: readonly { currency: Currency; amount: number }[] | undefined
): EstimatedTotal {
  const currency = useDefaultCurrency();
  const show = (totals ?? []).filter((t) => t.amount > 0).length >= 2;
  const rates = useExchangeRates(currency, { enabled: show });
  // While another base loads, the old rates are kept by the query but must not be used for this currency.
  const usable = rates.data?.base === currency ? rates.data : undefined;
  const amount = usable && totals ? (estimateTotal(totals, currency, usable.rates) ?? undefined) : undefined;

  return {
    show,
    currency,
    amount,
    isLoading: show && !usable && !rates.isError,
    isError: show && (rates.isError || (usable !== undefined && amount === undefined)),
  };
}
