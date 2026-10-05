import { describe, expect, it } from 'vitest';

import type { Holiday } from './types';
import { groupHolidays, holidayQuery, holidaysByDate, monthWeeks } from './utils';

describe('monthWeeks', () => {
  it('fills whole weeks from Monday (October 2026 starts on a Thursday)', () => {
    const weeks = monthWeeks('2026-10');
    expect(weeks).toHaveLength(5);
    expect(weeks[0][0]).toBe('2026-09-28');
    expect(weeks.at(-1)?.at(-1)).toBe('2026-11-01');
    expect(weeks.every((w) => w.length === 7)).toBe(true);
  });

  it('has 6 rows when the month needs them (August 2026)', () => {
    const weeks = monthWeeks('2026-08');
    expect(weeks).toHaveLength(6);
    expect(weeks.at(-1)?.[0]).toBe('2026-08-31');
  });

  it('starts on the 1st when it is a Monday (June 2026)', () => {
    expect(monthWeeks('2026-06')[0][0]).toBe('2026-06-01');
  });
});

describe('holidayQuery', () => {
  it('shows no holidays on the international calendar', () => {
    expect(holidayQuery('gregorian', 'MY', 2026)).toBeNull();
  });

  it('uses Cambodian national holidays for the Khmer calendar, whatever the region', () => {
    expect(holidayQuery('khmer', 'MY', 2026)).toEqual({ year: 2026, country: 'KH', kind: 'national' });
  });

  it('uses Islamic holidays of the chosen region for the Hijri calendar', () => {
    expect(holidayQuery('hijri', 'MY', 2026)).toEqual({ year: 2026, country: 'MY', kind: 'islamic' });
  });
});

const h = (date: string, key: string | null, name = key ?? 'x'): Holiday => ({ date, key, name });

describe('groupHolidays', () => {
  it('merges consecutive days of the same holiday and keeps only the month', () => {
    const holidays = [
      h('2026-04-16', 'khmerNewYear'),
      h('2026-04-14', 'khmerNewYear'),
      h('2026-04-15', 'khmerNewYear'),
      h('2026-05-01', 'labourDay'),
    ];
    expect(groupHolidays(holidays, '2026-04')).toEqual([
      { key: 'khmerNewYear', name: 'khmerNewYear', from: '2026-04-14', to: '2026-04-16' },
    ]);
  });

  it('does not merge different holidays or days with a gap', () => {
    const holidays = [h('2026-10-10', 'pchumBen'), h('2026-10-12', 'pchumBen'), h('2026-10-13', 'other')];
    expect(groupHolidays(holidays, '2026-10').map((r) => [r.from, r.to])).toEqual([
      ['2026-10-10', '2026-10-10'],
      ['2026-10-12', '2026-10-12'],
      ['2026-10-13', '2026-10-13'],
    ]);
  });
});

describe('holidaysByDate', () => {
  it('keeps every holiday of a day', () => {
    const map = holidaysByDate([h('2026-01-01', 'a'), h('2026-01-01', 'b'), h('2026-01-07', 'c')]);
    expect(map.get('2026-01-01')?.map((x) => x.key)).toEqual(['a', 'b']);
    expect(map.get('2026-01-07')).toHaveLength(1);
  });
});
