import { describe, expect, it } from 'vitest';

import { formatMoney, minorToInput, parseMoneyInput } from './money';

describe('formatMoney', () => {
  it('formats USD cents', () => {
    expect(formatMoney(1250, 'USD', 'en')).toBe('$12.50');
    expect(formatMoney(25000, 'USD', 'en')).toBe('$250.00');
  });

  it('formats KHR riel without decimals', () => {
    expect(formatMoney(40000, 'KHR', 'en')).toBe('៛40,000');
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
  });

  it('round-trips with parseMoneyInput', () => {
    for (const amount of [0, 1, 99, 100, 123456]) {
      expect(parseMoneyInput(minorToInput(amount, 'USD'), 'USD')).toBe(amount);
    }
  });
});
