import { toLatinDigits } from '@/lib/money';

/** Currencies the exchange page never offers, even when the API sends them. */
export const HIDDEN_CURRENCIES: readonly string[] = ['THB'];

/** Currencies whose first two letters are not the country (or region) whose flag to show. */
const COUNTRY_OVERRIDES: Record<string, string> = {
  EUR: 'EU',
  ANG: 'CW', // Netherlands Antillean guilder: Curaçao
};

/**
 * The ISO 3166 region of a currency, for its flag and country name: usually its first two letters (KHR → KH), or
 * null for currencies of no single country (XAF, XOF, XDR...).
 */
export function currencyRegion(code: string): string | null {
  if (COUNTRY_OVERRIDES[code]) return COUNTRY_OVERRIDES[code];
  if (code.startsWith('X')) return null;
  return code.slice(0, 2);
}

/** The codes to offer, sorted, without hidden ones. */
export function visibleCurrencies(rates: Record<string, number>): string[] {
  return Object.keys(rates)
    .filter((code) => !HIDDEN_CURRENCIES.includes(code))
    .sort();
}

/**
 * What the user typed as a plain number, or null when it is not one: Latin or Khmer digits, spaces and thousands
 * separators are fine ("1,250.5", "៤០០០០").
 */
export function parseAmount(input: string): number | null {
  const clean = toLatinDigits(input).replace(/[\s,]/g, '');
  if (!/^(\d+(\.\d*)?|\.\d+)$/.test(clean)) return null;
  const value = Number(clean);
  return Number.isFinite(value) ? value : null;
}

/** Digits to show for a rate: small rates (KHR → USD = 0.000244) need significant digits, big ones need fewer. */
export function rateFormat(rate: number) {
  return rate >= 1 ? { maximumFractionDigits: 4 } : { maximumSignificantDigits: 4 };
}

/** Lower-case text to search a currency by: code, currency name and country name. */
export function searchText(...parts: (string | undefined)[]): string {
  return parts.filter(Boolean).join(' ').toLocaleLowerCase();
}
