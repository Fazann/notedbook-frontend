import { describe, expect, it } from 'vitest';

import { formatMonth } from './calendar-locale';

describe('formatMonth', () => {
  it('formats a month in every app locale', () => {
    expect(formatMonth('2026-10', 'en')).toBe('October 2026');
    expect(formatMonth('2026-10', 'en', 'short')).toBe('Oct 2026');
    expect(formatMonth('2026-10', 'ms')).toBe('Oktober 2026');
    expect(formatMonth('2026-10', 'km')).toBe('តុលា 2026');
  });

  it('keeps January and December in their own year', () => {
    expect(formatMonth('2027-01', 'en')).toBe('January 2027');
    expect(formatMonth('2026-12', 'en', 'short')).toBe('Dec 2026');
  });
});
