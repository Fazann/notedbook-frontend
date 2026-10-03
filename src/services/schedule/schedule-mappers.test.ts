import { describe, expect, it } from 'vitest';

import {
  type ApiActivity,
  toActivity,
  toActivityBody,
  toApiRecurrence,
  toOccurrence,
  toRecurrence,
  toWeekSummary,
} from './schedule-mappers';

const apiActivity = (over: Partial<ApiActivity> = {}): ApiActivity => ({
  id: 1,
  title: 'Gym',
  type: 'EXERCISE',
  date: '2026-10-05',
  start_time: '07:00',
  end_time: '08:00',
  location: '',
  note: '',
  recurrence: { kind: 'WEEKLY', days: [1, 3], until: null },
  exceptions: ['2026-10-07'],
  created_at: '2026-10-03T20:48:17+07:00',
  updated_at: '2026-10-03T20:48:17+07:00',
  ...over,
});

describe('toActivity', () => {
  it('maps an activity with a weekly recurrence', () => {
    expect(toActivity(apiActivity())).toEqual({
      id: 1,
      title: 'Gym',
      type: 'exercise',
      date: '2026-10-05',
      startTime: '07:00',
      endTime: '08:00',
      location: '',
      note: '',
      recurrence: { kind: 'weekly', days: [1, 3], until: null },
      exceptions: ['2026-10-07'],
      createdAt: '2026-10-03T20:48:17+07:00',
      updatedAt: '2026-10-03T20:48:17+07:00',
    });
  });
});

describe('recurrence', () => {
  it('maps every kind both ways', () => {
    expect(toRecurrence({ kind: 'NONE', until: null })).toEqual({ kind: 'none' });
    expect(toRecurrence({ kind: 'DAILY', until: '2026-10-20' })).toEqual({ kind: 'daily', until: '2026-10-20' });
    expect(toRecurrence({ kind: 'WEEKDAYS', until: null })).toEqual({ kind: 'weekdays', until: null });
    expect(toApiRecurrence({ kind: 'none' })).toEqual({ kind: 'NONE' });
    expect(toApiRecurrence({ kind: 'weekly', days: [2, 4], until: null })).toEqual({
      kind: 'WEEKLY',
      days: [2, 4],
      until: null,
    });
    expect(toApiRecurrence({ kind: 'daily', until: '2026-10-20' })).toEqual({
      kind: 'DAILY',
      days: undefined,
      until: '2026-10-20',
    });
  });
});

describe('toOccurrence', () => {
  it('maps an occurrence', () => {
    expect(
      toOccurrence({
        key: '1:2026-10-05',
        activity_id: 1,
        date: '2026-10-05',
        title: 'Gym',
        type: 'EXERCISE',
        start_time: '07:00',
        end_time: '08:00',
        location: '',
        note: '',
        is_recurring: true,
      })
    ).toMatchObject({ key: '1:2026-10-05', activityId: 1, type: 'exercise', startTime: '07:00', isRecurring: true });
  });
});

describe('toWeekSummary', () => {
  it('fills the types that do not occur with 0', () => {
    expect(toWeekSummary({ total_minutes: 150, by_type: { EXERCISE: 120, MEETING: 30 }, count: 3 })).toEqual({
      totalMinutes: 150,
      byType: { meeting: 30, learning: 0, work: 0, exercise: 120, personal: 0, family: 0, other: 0 },
      count: 3,
    });
  });
});

describe('toActivityBody', () => {
  it('sends snake_case fields and upper-case enums', () => {
    expect(
      toActivityBody({
        title: 'Call',
        type: 'meeting',
        date: '2026-10-06',
        startTime: '10:00',
        endTime: '10:30',
        location: 'Zoom',
        note: '',
        recurrence: { kind: 'none' },
      })
    ).toEqual({
      title: 'Call',
      type: 'MEETING',
      date: '2026-10-06',
      start_time: '10:00',
      end_time: '10:30',
      location: 'Zoom',
      note: '',
      recurrence: { kind: 'NONE' },
    });
  });
});
