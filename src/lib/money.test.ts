import { describe, expect, it } from 'vitest';

import {
  estimateTotal,
  formatMoney,
  minorToInput,
  parseMoneyInput,
  pickCurrencies,
  toggleCurrency,
  withDefaultCurrency,
} from './money';

describe('formatMoney', () => {
  it('formats USD cents', () => {
    expect(formatMoney(1250, 'USD', 'en')).toBe('$12.50');
    expect(formatMoney(25000, 'USD', 'en')).toBe('$250.00');
  });

  it('formats KHR riel without decimals', () => {
    expect(formatMoney(40000, 'KHR', 'en')).toBe('៛40,000');
  });

  it('formats MYR sen', () => {
    expect(formatMoney(1250, 'MYR', 'en')).toBe('RM\u00a012.50');
  });
});

describe('parseMoneyInput', () => {
  it('parses USD into cents', () => {
    expect(parseMoneyInput('12.5', 'USD')).toBe(1250);
    expect(parseMoneyInput('12.50', 'USD')).toBe(1250);
    expect(parseMoneyInput('1,250', 'USD')).toBe(125000);
    expect(parseMoneyInput('.99', 'USD')).toBe(99);
    expect(parseMoneyInput('0.1', 'USD')).toBe(10);
  });

  it('parses KHR as whole riel', () => {
    expect(parseMoneyInput('40,000', 'KHR')).toBe(40000);
    expect(parseMoneyInput('40 000', 'KHR')).toBe(40000);
  });

  it('parses MYR into sen', () => {
    expect(parseMoneyInput('12.5', 'MYR')).toBe(1250);
    expect(parseMoneyInput('1,250.90', 'MYR')).toBe(125090);
    expect(parseMoneyInput('1.234', 'MYR')).toBeNull();
  });

  it('accepts Khmer digits', () => {
    expect(parseMoneyInput('៤០០០០', 'KHR')).toBe(40000);
    expect(parseMoneyInput('១២.៥០', 'USD')).toBe(1250);
  });

  it('rejects invalid input', () => {
    expect(parseMoneyInput('', 'USD')).toBeNull();
    expect(parseMoneyInput('abc', 'USD')).toBeNull();
    expect(parseMoneyInput('1.234', 'USD')).toBeNull();
    expect(parseMoneyInput('10.5', 'KHR')).toBeNull();
    expect(parseMoneyInput('-5', 'USD')).toBeNull();
  });
});

describe('minorToInput', () => {
  it('turns minor units back into input text', () => {
    expect(minorToInput(1250, 'USD')).toBe('12.50');
    expect(minorToInput(5, 'USD')).toBe('0.05');
    expect(minorToInput(40000, 'KHR')).toBe('40000');
    expect(minorToInput(1250, 'MYR')).toBe('12.50');
  });

  it('round-trips with parseMoneyInput', () => {
    for (const amount of [0, 1, 99, 100, 123456]) {
      expect(parseMoneyInput(minorToInput(amount, 'USD'), 'USD')).toBe(amount);
    }
  });
});

describe('pickCurrencies', () => {
  it('keeps the fixed order and only the enabled currencies', () => {
    expect(pickCurrencies(['MYR', 'USD'])).toEqual(['USD', 'MYR']);
  });

  it('also shows disabled currencies that still have data, without duplicates', () => {
    expect(pickCurrencies(['USD'], ['KHR', 'USD'])).toEqual(['USD', 'KHR']);
  });
});

describe('toggleCurrency', () => {
  const all = { enabled: ['USD', 'KHR', 'MYR'] as const, defaultCurrency: 'USD' as const };
  const settings = { ...all, enabled: [...all.enabled] };

  it('turns a currency off and moves the default off it', () => {
    expect(toggleCurrency(settings, 'USD', false)).toEqual({ enabled: ['KHR', 'MYR'], defaultCurrency: 'KHR' });
  });

  it('never turns off the last currency', () => {
    const one = { enabled: ['MYR' as const], defaultCurrency: 'MYR' as const };
    expect(toggleCurrency(one, 'MYR', false)).toBe(one);
  });

  it('turns a currency back on in the fixed order', () => {
    expect(toggleCurrency({ enabled: ['MYR'], defaultCurrency: 'MYR' }, 'USD', true)).toEqual({
      enabled: ['USD', 'MYR'],
      defaultCurrency: 'MYR',
    });
  });
});

describe('withDefaultCurrency', () => {
  it('sets the default and turns it on', () => {
    expect(withDefaultCurrency({ enabled: ['USD'], defaultCurrency: 'USD' }, 'KHR')).toEqual({
      enabled: ['USD', 'KHR'],
      defaultCurrency: 'KHR',
    });
  });
});

describe('estimateTotal', () => {
  // Rates against USD: 1 USD = 4000 KHR = 4 MYR.
  const usd = { USD: 1, KHR: 4000, MYR: 4 };

  it('adds every currency into the target, in its minor units', () => {
    // $12.50 + ៛40,000 ($10) + RM 20.00 ($5) = $27.50
    const totals = [
      { currency: 'USD' as const, amount: 1250 },
      { currency: 'KHR' as const, amount: 40000 },
      { currency: 'MYR' as const, amount: 2000 },
    ];
    expect(estimateTotal(totals, 'USD', usd)).toBe(2750);
  });

  it('rounds once, to whole riel for KHR', () => {
    const toKhr = { KHR: 1, USD: 1 / 4000.5, MYR: 4 / 4000.5 };
    expect(estimateTotal([{ currency: 'USD', amount: 1 }], 'KHR', toKhr)).toBe(40);
    expect(
      estimateTotal(
        [
          { currency: 'USD', amount: 1250 },
          { currency: 'KHR', amount: 500 },
        ],
        'KHR',
        toKhr
      )
    ).toBe(50506);
  });

  it('skips empty totals and needs a rate only for currencies with an amount', () => {
    expect(
      estimateTotal(
        [
          { currency: 'MYR', amount: 0 },
          { currency: 'USD', amount: 100 },
        ],
        'USD',
        { USD: 1 }
      )
    ).toBe(100);
    expect(estimateTotal([{ currency: 'MYR', amount: 100 }], 'USD', { USD: 1 })).toBeNull();
  });
});
