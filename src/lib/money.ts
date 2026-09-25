export const CURRENCIES = ['USD', 'KHR'] as const;
export type Currency = (typeof CURRENCIES)[number];

/** Number of minor units per major unit: USD is stored in cents, KHR in whole riel. */
const MINOR_DIGITS: Record<Currency, number> = { USD: 2, KHR: 0 };

/**
 * Formats an integer amount in minor units.
 * formatMoney(1250, 'USD', 'en') → "$12.50", formatMoney(40000, 'KHR', 'en') → "៛40,000"
 */
export function formatMoney(amount: number, currency: Currency, locale: string): string {
  const digits = MINOR_DIGITS[currency];
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount / 10 ** digits);
}

const KHMER_DIGITS = '០១២៣៤៥៦៧៨៩';

/** "១០:១០" → "10:10": Khmer digits (typed with a Khmer keyboard) to Latin. */
export function toLatinDigits(input: string): string {
  return input.replace(/[០-៩]/g, (d) => String(KHMER_DIGITS.indexOf(d)));
}

/**
 * Parses what the user typed into integer minor units, or `null` when it is not a valid amount.
 * Accepts Latin and Khmer digits, spaces and thousands separators ("1,250.5", "៤០០០០").
 * Uses string math only — never floats.
 */
export function parseMoneyInput(input: string, currency: Currency): number | null {
  const clean = toLatinDigits(input).replace(/[\s,]/g, '');
  const digits = MINOR_DIGITS[currency];
  const pattern = digits === 0 ? /^\d+$/ : new RegExp(`^\\d+(\\.\\d{0,${digits}})?$|^\\.\\d{1,${digits}}$`);
  if (!pattern.test(clean)) {
    return null;
  }

  const [whole = '', fraction = ''] = clean.split('.');
  const minor = Number(`${whole || '0'}${fraction.padEnd(digits, '0')}`);
  return Number.isSafeInteger(minor) ? minor : null;
}

/** The currency symbol for display next to inputs: "$" or "៛". */
export function currencySymbol(currency: Currency, locale: string): string {
  const parts = new Intl.NumberFormat(locale, { style: 'currency', currency, currencyDisplay: 'narrowSymbol' });
  return parts.formatToParts(0).find((p) => p.type === 'currency')?.value ?? currency;
}

/** Integer minor units → plain input text, e.g. (1250, 'USD') → "12.50". String math only. */
export function minorToInput(amount: number, currency: Currency): string {
  const digits = MINOR_DIGITS[currency];
  if (digits === 0) return String(amount);
  const text = String(Math.abs(amount)).padStart(digits + 1, '0');
  return `${amount < 0 ? '-' : ''}${text.slice(0, -digits)}.${text.slice(-digits)}`;
}
