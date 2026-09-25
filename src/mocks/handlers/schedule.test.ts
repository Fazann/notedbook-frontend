import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ActivityInput } from '@/features/schedule/types';
import { addDays, startOfWeek, todayInTz } from '@/lib/time';

import { db } from '../db';
import { seedActivities } from '../seed';

import { createActivity, deleteActivity, getActivity, getSummary, listOccurrences, updateActivity } from './schedule';

vi.mock('../delay', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../delay')>()),
  delay: () => Promise.resolve(),
}));

const monday = startOfWeek(todayInTz());
const sunday = addDays(monday, 6);

const meeting: ActivityInput = {
  title: 'Team meeting',
  type: 'meeting',
  date: monday,
  startTime: '10:10',
  endTime: '10:40',
  location: '',
  note: '',
  recurrence: { kind: 'weekdays', until: null },
};

beforeEach(() => {
  db.activities = seedActivities(new Date());
});

describe('mock schedule handler', () => {
  it('returns this week expanded and sorted, with the seeded overlap', async () => {
    const week = await listOccurrences(monday, sunday);
    expect(week.every((o) => o.date >= monday && o.date <= sunday)).toBe(true);
    const keys = week.map((o) => `${o.date} ${o.startTime}`);
    expect(keys).toEqual([...keys].sort());
    const mondayTitles = week.filter((o) => o.date === monday).map((o) => o.title);
    expect(mondayTitles).toEqual(
      expect.arrayContaining(['Run by the riverside', 'Office work', 'Team stand-up meeting'])
    );
    expect(week.find((o) => o.title === 'Meeting with client')?.date).toBe(addDays(monday, 3));
  });

  it('skips the seeded exception (no English class next Thursday)', async () => {
    const next = await listOccurrences(addDays(monday, 7), addDays(monday, 13));
    const english = next.filter((o) => o.title === 'English class (IELTS)').map((o) => o.date);
    expect(english).toEqual([addDays(monday, 8)]);
  });

  it('summarizes minutes per type', async () => {
    const summary = await getSummary(monday, sunday);
    expect(summary.byType.work).toBe(5 * 8 * 60);
    expect(summary.totalMinutes).toBe(Object.values(summary.byType).reduce((a, b) => a + b, 0));
  });

  it('rejects ranges over 42 days and missing activities', async () => {
    await expect(listOccurrences(monday, addDays(monday, 42))).rejects.toMatchObject({ status: 422 });
    await expect(getActivity(999)).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' });
  });

  it('validates input with field errors', async () => {
    await expect(createActivity({ ...meeting, endTime: '10:00' })).rejects.toMatchObject({
      status: 422,
      fields: { endTime: 'endAfterStart' },
    });
  });

  it('edits "this only": adds an exception and creates a single activity', async () => {
    const series = await createActivity(meeting);
    const wednesday = addDays(monday, 2);
    const result = await updateActivity(
      series.id,
      { ...meeting, date: wednesday, startTime: '11:00', endTime: '11:30' },
      'this',
      wednesday
    );
    expect(result).toMatchObject({ series: { exceptions: [wednesday] }, created: { recurrence: { kind: 'none' } } });

    const week = (await listOccurrences(monday, sunday)).filter((o) => o.title === 'Team meeting');
    expect(week.map((o) => `${o.date} ${o.startTime}`)).toEqual([
      `${monday} 10:10`,
      `${addDays(monday, 1)} 10:10`,
      `${wednesday} 11:00`,
      `${addDays(monday, 3)} 10:10`,
      `${addDays(monday, 4)} 10:10`,
    ]);
  });

  it('edits "all": changes the series and moves exceptions with its start', async () => {
    const series = await createActivity(meeting);
    await deleteActivity(series.id, 'this', addDays(monday, 2));
    const updated = await updateActivity(series.id, { ...meeting, date: addDays(monday, 1), title: 'Stand-up' }, 'all');
    expect(updated).toMatchObject({ title: 'Stand-up', exceptions: [addDays(monday, 3)] });
  });

  it('deletes "this only" or the whole series', async () => {
    const series = await createActivity(meeting);
    await deleteActivity(series.id, 'this', addDays(monday, 2));
    let titles = (await listOccurrences(monday, sunday)).filter((o) => o.title === 'Team meeting');
    expect(titles.map((o) => o.date)).not.toContain(addDays(monday, 2));
    expect(titles).toHaveLength(4);

    await expect(deleteActivity(series.id, 'this', addDays(monday, 5))).rejects.toMatchObject({ status: 404 });
    await deleteActivity(series.id, 'all');
    titles = (await listOccurrences(monday, sunday)).filter((o) => o.title === 'Team meeting');
    expect(titles).toEqual([]);
  });
});
