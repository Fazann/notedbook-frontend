import { describe, expect, it } from 'vitest';

import { buddhistEraYear, khmerLunarDate } from './khmer-lunar';

describe('khmerLunarDate', () => {
  // Official Cambodian holiday dates, which are set by the lunar calendar.
  it.each([
    ['2023-05-04', 'pisak', 15, 'waxing'], // Visak Bochea
    ['2024-05-22', 'pisak', 15, 'waxing'],
    ['2025-05-11', 'pisak', 15, 'waxing'],
    ['2024-02-24', 'meak', 15, 'waxing'], // Meak Bochea
    ['2024-05-26', 'pisak', 4, 'waning'], // Royal Ploughing Ceremony
    ['2025-05-15', 'pisak', 4, 'waning'],
    ['2023-10-14', 'photrobot', 15, 'waning'], // Pchum Ben
    ['2024-10-02', 'photrobot', 15, 'waning'],
    ['2025-09-22', 'photrobot', 15, 'waning'],
    ['2025-09-23', 'assuj', 1, 'waxing'],
    ['2023-11-27', 'kadeuk', 15, 'waxing'], // Water Festival
    ['2024-11-15', 'kadeuk', 15, 'waxing'],
    ['2025-11-05', 'kadeuk', 15, 'waxing'],
    ['2025-11-06', 'kadeuk', 1, 'waning'],
    ['1900-01-01', 'bos', 1, 'waxing'], // epoch
  ])('%s is %s %i %s', (date, month, day, phase) => {
    expect(khmerLunarDate(date)).toEqual({ month, day, phase });
  });

  it('has the two Asadh months in a leap-month year (2026)', () => {
    const months = new Set<string>();
    for (let d = 1; d <= 31; d++) {
      for (const m of ['06', '07', '08']) months.add(khmerLunarDate(`2026-${m}-${String(d).padStart(2, '0')}`).month);
    }
    expect(months).toContain('pathamasadh');
    expect(months).toContain('tutiyasadh');
    expect(months).not.toContain('asadh');
  });

  it('rejects dates before the epoch', () => {
    expect(() => khmerLunarDate('1899-12-31')).toThrow(RangeError);
  });
});

describe('buddhistEraYear', () => {
  it('changes the day after Visak Bochea', () => {
    expect(buddhistEraYear('2025-01-15')).toBe(2568);
    expect(buddhistEraYear('2025-05-11')).toBe(2568);
    expect(buddhistEraYear('2025-05-12')).toBe(2569);
    expect(buddhistEraYear('2025-12-31')).toBe(2569);
  });
});
