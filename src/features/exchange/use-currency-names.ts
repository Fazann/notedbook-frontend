'use client';

import { useLocale } from 'next-intl';

import { currencyRegion, searchText } from './utils';

export type CurrencyInfo = {
  code: string;
  /** Currency name in the UI language, e.g. "Cambodian Riel"; the code when the browser has no name. */
  name: string;
  /** Country (or region) name in the UI language, e.g. "Cambodia"; undefined for XAF, XDR... */
  country?: string;
  /** Lower-case code + names, for search. */
  search: string;
};

/** Looks up currency and country names in the UI language (browser `Intl` data, English when it lacks Khmer). */
export function useCurrencyNames(): (code: string) => CurrencyInfo {
  return currencyNames(useLocale());
}

const lookups = new Map<string, (code: string) => CurrencyInfo>();

/** One lookup per locale, each remembering the names it has built (they never change). */
export function currencyNames(locale: string): (code: string) => CurrencyInfo {
  const existing = lookups.get(locale);
  if (existing) return existing;
  const names = displayNames(locale, 'currency');
  const regions = displayNames(locale, 'region');
  const cache = new Map<string, CurrencyInfo>();
  const lookup = (code: string) => {
    const known = cache.get(code);
    if (known) return known;
    const region = currencyRegion(code);
    const name = safeOf(names, code) ?? code;
    const country = region ? safeOf(regions, region) : undefined;
    const info = { code, name, country, search: searchText(code, name, country) };
    cache.set(code, info);
    return info;
  };
  lookups.set(locale, lookup);
  return lookup;
}

function displayNames(locale: string, type: 'currency' | 'region'): Intl.DisplayNames | null {
  try {
    return new Intl.DisplayNames([locale, 'en'], { type, fallback: 'none' });
  } catch {
    return null;
  }
}

function safeOf(names: Intl.DisplayNames | null, code: string): string | undefined {
  try {
    return names?.of(code) ?? undefined;
  } catch {
    return undefined;
  }
}
