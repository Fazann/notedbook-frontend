import { z } from 'zod';

/**
 * `GET /exchange-rates?base=XXX`: 1 `base` = `rates[code]` units of `code`.
 * Rates are for display only, never for stored money math.
 */
export const exchangeRatesSchema = z
  .object({
    base: z.string().regex(/^[A-Z]{3}$/),
    rates: z.record(z.string().regex(/^[A-Z]{3}$/), z.number().positive()),
    updated_at: z.string(),
    next_update_at: z.string(),
    provider: z.string(),
    provider_url: z.url(),
  })
  .transform((r) => ({
    base: r.base,
    rates: r.rates,
    updatedAt: r.updated_at,
    nextUpdateAt: r.next_update_at,
    provider: r.provider,
    providerUrl: r.provider_url,
  }));

export type ExchangeRates = z.output<typeof exchangeRatesSchema>;
