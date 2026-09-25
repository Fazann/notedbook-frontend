import { describe, expect, it } from 'vitest';

import { activityFormSchema, type Activity, type ActivityFormValues, type Occurrence } from './types';
import {
  expandOccurrences,
  findOverlap,
  formToInput,
  inputToForm,
  layoutDay,
  moveSeries,
  nextHalfHour,
  occurrenceToInput,
  onlyTextChanged,
  seriesInputFromForm,
  summarize,
} from './utils';

// 2026-09-28 is a Monday.
function activity(patch: Partial<Activity>): Activity {
  return {
    id: 1,
    title: 'Stand-up',
    type: 'meeting',
    date: '2026-09-28',
    startTime: '10:10',
    endTime: '10:40',
    location: '',
    note: '',
    recurrence: { kind: 'none' },
    exceptions: [],
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
    ...patch,
  };
}
const dates = (list: Occurrence[]) => list.map((o) => o.date);

describe('expandOccurrences', () => {
  it('returns a single activity only on its day, inside the range', () => {
    expect(dates(expandOccurrences([activity({})], '2026-09-28', '2026-10-04'))).toEqual(['2026-09-28']);
    expect(expandOccurrences([activity({})], '2026-09-29', '2026-10-04')).toEqual([]);
  });

  it('expands daily and weekday series', () => {
    const daily = activity({ recurrence: { kind: 'daily', until: null } });
    expect(expandOccurrences([daily], '2026-09-28', '2026-10-04')).toHaveLength(7);
    const weekdays = activity({ recurrence: { kind: 'weekdays', until: null } });
    expect(dates(expandOccurrences([weekdays], '2026-09-28', '2026-10-04'))).toEqual([
      '2026-09-28',
      '2026-09-29',
      '2026-09-30',
      '2026-10-01',
      '2026-10-02',
    ]);
  });

  it('expands weekly series on several days across weeks', () => {
    const weekly = activity({ recurrence: { kind: 'weekly', days: [2, 4], until: null } });
    expect(dates(expandOccurrences([weekly], '2026-09-28', '2026-10-11'))).toEqual([
      '2026-09-29',
      '2026-10-01',
      '2026-10-06',
      '2026-10-08',
    ]);
  });

  it('respects until, exceptions and the series start', () => {
    const series = activity({
      date: '2026-09-30',
      recurrence: { kind: 'daily', until: '2026-10-03' },
      exceptions: ['2026-10-02'],
    });
    expect(dates(expandOccurrences([series], '2026-09-28', '2026-10-04'))).toEqual([
      '2026-09-30',
      '2026-10-01',
      '2026-10-03',
    ]);
  });

  it('includes both range edges and sorts by date then time', () => {
    const run = activity({
      id: 2,
      title: 'Run',
      startTime: '06:00',
      endTime: '06:45',
      recurrence: { kind: 'daily', until: null },
    });
    const list = expandOccurrences(
      [activity({ recurrence: { kind: 'daily', until: null } }), run],
      '2026-10-04',
      '2026-10-05'
    );
    expect(list.map((o) => `${o.date} ${o.startTime}`)).toEqual([
      '2026-10-04 06:00',
      '2026-10-04 10:10',
      '2026-10-05 06:00',
      '2026-10-05 10:10',
    ]);
    expect(list[0]).toMatchObject({ key: '2:2026-10-04', isRecurring: true });
  });
});

const occ = (key: string, startTime: string, endTime: string): Occurrence => ({
  key,
  activityId: 1,
  date: '2026-09-28',
  title: key,
  type: 'work',
  startTime,
  endTime,
  location: '',
  note: '',
  isRecurring: false,
});

describe('layoutDay', () => {
  it('uses one column without overlaps (touching times do not overlap)', () => {
    const { placements, overflow } = layoutDay([occ('a', '10:00', '11:00'), occ('b', '11:00', '12:00')]);
    expect(placements.get('a')).toEqual({ column: 0, columns: 1 });
    expect(placements.get('b')).toEqual({ column: 0, columns: 1 });
    expect(overflow).toEqual([]);
  });

  it('puts two overlapping activities side by side', () => {
    const { placements } = layoutDay([occ('work', '08:00', '12:00'), occ('standup', '10:10', '10:40')]);
    expect(placements.get('work')).toEqual({ column: 0, columns: 2 });
    expect(placements.get('standup')).toEqual({ column: 1, columns: 2 });
  });

  it('shows at most 3 columns and moves the rest into "+N"', () => {
    const { placements, overflow } = layoutDay([
      occ('a', '10:00', '12:00'),
      occ('b', '10:00', '11:00'),
      occ('c', '10:15', '11:00'),
      occ('d', '10:30', '11:30'),
      occ('e', '14:00', '15:00'),
    ]);
    expect(placements.get('a')?.columns).toBe(3);
    expect(placements.has('d')).toBe(false);
    expect(overflow).toEqual([{ startMinutes: 630, hidden: [expect.objectContaining({ key: 'd' })] }]);
    expect(placements.get('e')).toEqual({ column: 0, columns: 1 });
  });

  it('reuses a free column inside a cluster', () => {
    const { placements } = layoutDay([
      occ('long', '08:00', '12:00'),
      occ('x', '09:00', '10:00'),
      occ('y', '10:00', '11:00'),
    ]);
    expect(placements.get('y')).toEqual({ column: 1, columns: 2 });
  });
});

describe('summarize', () => {
  it('adds up minutes per type', () => {
    const summary = summarize([occ('a', '08:00', '12:00'), { ...occ('b', '18:30', '20:00'), type: 'learning' }]);
    expect(summary).toMatchObject({ totalMinutes: 330, count: 2 });
    expect(summary.byType).toMatchObject({ work: 240, learning: 90, meeting: 0 });
  });
});

describe('findOverlap', () => {
  const day = [occ('meeting', '10:10', '10:40')];
  it('finds an overlapping activity on the same day only', () => {
    expect(findOverlap(day, { date: '2026-09-28', startTime: '10:30', endTime: '11:00' })?.key).toBe('meeting');
    expect(findOverlap(day, { date: '2026-09-28', startTime: '10:40', endTime: '11:00' })).toBeUndefined();
    expect(findOverlap(day, { date: '2026-09-29', startTime: '10:30', endTime: '11:00' })).toBeUndefined();
    expect(
      findOverlap(day, { date: '2026-09-28', startTime: '10:00', endTime: '11:00' }, (o) => o.key === 'meeting')
    ).toBeUndefined();
  });
});

describe('moveSeries', () => {
  it('moves times and keeps the length', () => {
    const moved = moveSeries(
      activity({ recurrence: { kind: 'daily', until: null } }),
      '2026-09-30',
      '2026-09-30',
      '11:00'
    );
    expect(moved).toMatchObject({ date: '2026-09-28', startTime: '11:00', endTime: '11:30' });
  });

  it('shifts weekly days, the start and the end date by the same days', () => {
    const series = activity({ recurrence: { kind: 'weekly', days: [2, 7], until: '2026-12-31' } });
    const moved = moveSeries(series, '2026-09-29', '2026-09-30', '10:10');
    expect(moved.date).toBe('2026-09-29');
    expect(moved.recurrence).toEqual({ kind: 'weekly', days: [1, 3], until: '2027-01-01' });
  });

  it('turns a weekday series moved by a day into weekly Tue–Sat', () => {
    const moved = moveSeries(
      activity({ recurrence: { kind: 'weekdays', until: null } }),
      '2026-09-28',
      '2026-09-29',
      '10:10'
    );
    expect(moved.recurrence).toEqual({ kind: 'weekly', days: [2, 3, 4, 5, 6], until: null });
  });
});

describe('form conversion', () => {
  const values: ActivityFormValues = {
    title: ' English class ',
    type: 'learning',
    date: '2026-09-29',
    startTime: '18:30',
    endTime: '20:00',
    location: '',
    note: '',
    repeat: 'weekly',
    repeatDays: [2, 4],
    until: null,
  };

  it('converts the flat form to the API recurrence and back', () => {
    const input = formToInput(values);
    expect(input).toMatchObject({ title: 'English class', recurrence: { kind: 'weekly', days: [2, 4], until: null } });
    expect(inputToForm(input)).toEqual({ ...values, title: 'English class' });
    expect(formToInput({ ...values, repeat: 'none' }).recurrence).toEqual({ kind: 'none' });
    expect(formToInput({ ...values, repeat: 'daily', until: '2026-12-31' }).recurrence).toEqual({
      kind: 'daily',
      until: '2026-12-31',
    });
  });

  it('pre-selects the weekday of the date when the activity does not repeat weekly', () => {
    expect(inputToForm({ ...formToInput(values), recurrence: { kind: 'none' } }, '2026-10-01').repeatDays).toEqual([4]);
  });

  it('keeps the series start when editing a later occurrence without changing its date', () => {
    const series = activity({ recurrence: { kind: 'weekly', days: [2, 4], until: null }, date: '2026-09-01' });
    expect(seriesInputFromForm(series, '2026-09-29', values).date).toBe('2026-09-01');
    expect(seriesInputFromForm(series, '2026-09-29', { ...values, date: '2026-09-30' }).date).toBe('2026-09-02');
  });

  it('knows when only text changed', () => {
    expect(onlyTextChanged(values, { ...values, title: 'IELTS', location: 'Room 2' })).toBe(true);
    expect(onlyTextChanged(values, { ...values, startTime: '18:45' })).toBe(false);
    expect(onlyTextChanged(values, { ...values, repeatDays: [2] })).toBe(false);
  });
});

describe('nextHalfHour', () => {
  it('rounds up to the next :00 or :30', () => {
    expect(nextHalfHour(9 * 60 + 10)).toBe('09:30');
    expect(nextHalfHour(9 * 60 + 30)).toBe('10:00');
  });
});

describe('occurrenceToInput', () => {
  it('makes a single activity from one occurrence of a series', () => {
    const [first] = expandOccurrences(
      [activity({ recurrence: { kind: 'daily', until: null } })],
      '2026-09-30',
      '2026-09-30'
    );
    expect(occurrenceToInput(first)).toMatchObject({
      date: '2026-09-30',
      title: 'Stand-up',
      recurrence: { kind: 'none' },
    });
  });
});

describe('activityFormSchema', () => {
  const base: ActivityFormValues = {
    title: 'Gym',
    type: 'exercise',
    date: '2026-09-28',
    startTime: '16:00',
    endTime: '17:00',
    location: '',
    note: '',
    repeat: 'none',
    repeatDays: [1],
    until: null,
  };
  const messages = (values: ActivityFormValues) =>
    activityFormSchema.safeParse(values).error?.issues.map((i) => `${i.path.join('.')}:${i.message}`) ?? [];

  it('needs at least one day for a weekly repeat', () => {
    expect(messages({ ...base, repeat: 'weekly', repeatDays: [] })).toEqual(['repeatDays:pickDay']);
  });

  it('needs the end date on or after the start date', () => {
    expect(messages({ ...base, repeat: 'daily', until: '2026-09-27' })).toEqual(['until:untilBeforeStart']);
    expect(messages({ ...base, repeat: 'daily', until: '2026-09-28' })).toEqual([]);
  });
});
