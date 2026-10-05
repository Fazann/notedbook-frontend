import { describe, expect, it } from 'vitest';

import { hijriDate } from './hijri';

describe('hijriDate', () => {
  it.each([
    ['2026-03-20', { year: 1447, month: 10, day: 1 }], // Eid al-Fitr
    ['2026-05-27', { year: 1447, month: 12, day: 10 }], // Eid al-Adha
    ['2026-06-16', { year: 1448, month: 1, day: 1 }], // Islamic New Year
  ])('%s', (date, expected) => {
    expect(hijriDate(date)).toEqual(expected);
  });
});
