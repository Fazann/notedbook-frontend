import { z } from 'zod';

import { CURRENCIES, type CurrencySettings } from '@/lib/money';

import { apiCall } from '../core/api-call';
import { ApiEndpoint } from '../core/api-endpoints';

/** `CurrencySettingRes` of the Go API (cached in Redis there; a user who never saved gets every currency + USD). */
const apiCurrencySettingsSchema = z.object({
  enabled_currencies: z.array(z.string()),
  default_currency: z.string(),
});

const currencySchema = z.enum(CURRENCIES);

/** Ignores codes this app does not know yet, so a newer API never breaks the UI. */
function toCurrencySettings(raw: z.infer<typeof apiCurrencySettingsSchema>): CurrencySettings {
  const enabled = CURRENCIES.filter((c) => raw.enabled_currencies.includes(c));
  const list = enabled.length > 0 ? enabled : [...CURRENCIES];
  const parsed = currencySchema.safeParse(raw.default_currency);
  return { enabled: list, defaultCurrency: parsed.success && list.includes(parsed.data) ? parsed.data : list[0] };
}

export async function getCurrencySettings(): Promise<CurrencySettings> {
  return toCurrencySettings(apiCurrencySettingsSchema.parse(await apiCall.get(ApiEndpoint.CurrencySettings)));
}

/** 400 `NO_CURRENCY_ENABLED` / `DEFAULT_CURRENCY_NOT_ENABLED` / `INVALID_CURRENCY` for invalid input. */
export async function updateCurrencySettings(settings: CurrencySettings): Promise<CurrencySettings> {
  const res = await apiCall.put(ApiEndpoint.CurrencySettings, {
    enabled_currencies: settings.enabled,
    default_currency: settings.defaultCurrency,
  });
  return toCurrencySettings(apiCurrencySettingsSchema.parse(res));
}
