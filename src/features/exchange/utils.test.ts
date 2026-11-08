import { describe, expect, it } from 'vitest';

import { currencyNames } from './use-currency-names';
import { currencyRegion, parseAmount, rateFormat, visibleCurrencies } from './utils';

describe('currencyRegion', () => {
  it.each([
    ['USD', 'US'],
    ['KHR', 'KH'],
    ['MYR', 'MY'],
    ['EUR', 'EU'],
    ['ANG', 'CW'],
    ['XAF', null],
    ['XDR', null],
  ])('%s → %s', (code, region) => {
    expect(currencyRegion(code)).toBe(region);
  });
});

describe('visibleCurrencies', () => {
  it('sorts the codes and never offers THB', () => {
    expect(visibleCurrencies({ USD: 1, THB: 33.5, KHR: 4094, EUR: 0.9 })).toEqual(['EUR', 'KHR', 'USD']);
  });
});

describe('parseAmount', () => {
  it.each([
    ['25', 25],
    ['1,250.50', 1250.5],
    ['.5', 0.5],
    ['10.', 10],
    ['៤០០០០', 40000],
    [' 1 000 ', 1000],
  ])('reads %j as %d', (input, value) => {
    expect(parseAmount(input)).toBe(value);
  });

  it.each(['', 'abc', '1.2.3', '-5', '1e5'])('rejects %j', (input) => {
    expect(parseAmount(input)).toBeNull();
  });
});

describe('rateFormat', () => {
  it('keeps significant digits for small rates', () => {
    expect(new Intl.NumberFormat('en', rateFormat(0.000244265)).format(0.000244265)).toBe('0.0002443');
    expect(new Intl.NumberFormat('en', rateFormat(4093.994051)).format(4093.994051)).toBe('4,093.9941');
  });
});

describe('currencyNames', () => {
  it('names the currency and its country in the UI language', () => {
    const info = currencyNames('en')('KHR');
    expect(info).toMatchObject({ code: 'KHR', name: 'Cambodian Riel', country: 'Cambodia' });
    expect(info.search).toContain('cambodia');
    expect(currencyNames('en')('XAF').country).toBeUndefined();
  });
});
