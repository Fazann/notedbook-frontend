import { describe, expect, it } from 'vitest';

import {
  addDays,
  addMinutes,
  daysBetween,
  durationMinutes,
  fromMinutes,
  isoWeekday,
  nowMinutesInTz,
  parseTime,
  snapMinutes,
  startOfWeek,
  todayInTz,
  toMinutes,
  toZonedDateTime,
  weekDays,
} from './time';

describe('minutes', () => {
  it('converts both ways', () => {
    expect(toMinutes('10:10')).toBe(610);
    expect(toMinutes('00:00')).toBe(0);
    expect(fromMinutes(610)).toBe('10:10');
    expect(fromMinutes(5)).toBe('00:05');
  });

  it('adds, measures and snaps', () => {
    expect(addMinutes('10:10', 30)).toBe('10:40');
    expect(addMinutes('23:30', 60)).toBe('23:59'); // same day only
    expect(durationMinutes('18:30', '20:00')).toBe(90);
    expect(snapMinutes(607)).toBe(600);
    expect(snapMinutes(608)).toBe(615);
    expect(snapMinutes(62, 5)).toBe(60);
  });
});

describe('parseTime', () => {
  it('accepts the usual ways of typing a time', () => {
    expect(parseTime('10:10')).toBe('10:10');
    expect(parseTime('1010')).toBe('10:10');
    expect(parseTime('10.10')).toBe('10:10');
    expect(parseTime('9')).toBe('09:00');
    expect(parseTime('10:10am')).toBe('10:10');
    expect(parseTime('6:30 PM')).toBe('18:30');
    expect(parseTime('12am')).toBe('00:00');
    expect(parseTime('12pm')).toBe('12:00');
    expect(parseTime('១០:១០')).toBe('10:10');
  });

  it('rejects nonsense', () => {
    expect(parseTime('')).toBeNull();
    expect(parseTime('25:00')).toBeNull();
    expect(parseTime('10:75')).toBeNull();
    expect(parseTime('13pm')).toBeNull();
    expect(parseTime('lunch')).toBeNull();
  });
});

describe('dates', () => {
  it('starts weeks on Monday', () => {
    expect(startOfWeek('2026-09-30')).toBe('2026-09-28'); // Wed → Mon
    expect(startOfWeek('2026-09-28')).toBe('2026-09-28'); // Mon
    expect(startOfWeek('2026-10-04')).toBe('2026-09-28'); // Sun belongs to the week before
    expect(isoWeekday('2026-10-04')).toBe(7);
  });

  it('handles month and year ends', () => {
    expect(weekDays('2026-12-28')).toEqual([
      '2026-12-28',
      '2026-12-29',
      '2026-12-30',
      '2026-12-31',
      '2027-01-01',
      '2027-01-02',
      '2027-01-03',
    ]);
    expect(startOfWeek('2027-01-01')).toBe('2026-12-28');
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
    expect(daysBetween('2026-12-30', '2027-01-02')).toBe(3);
  });
});

describe('timezone', () => {
  it('knows it is already tomorrow in Phnom Penh at 23:30 UTC', () => {
    const now = new Date('2026-09-30T23:30:00Z');
    expect(todayInTz('Asia/Phnom_Penh', now)).toBe('2026-10-01');
    expect(nowMinutesInTz('Asia/Phnom_Penh', now)).toBe(6 * 60 + 30);
    expect(todayInTz('UTC', now)).toBe('2026-09-30');
  });

  it('builds the instant for a Phnom Penh wall-clock time', () => {
    expect(toZonedDateTime('2026-09-30', '10:10').toISOString()).toBe('2026-09-30T03:10:00.000Z');
    expect(toZonedDateTime('2026-10-01', '06:00').toISOString()).toBe('2026-09-30T23:00:00.000Z');
  });
});
