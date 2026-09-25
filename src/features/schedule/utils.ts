import { addDays, daysBetween, durationMinutes, fromMinutes, isoWeekday, toMinutes } from '@/lib/time';

import {
  ACTIVITY_TYPES,
  MAX_COLUMNS,
  type Activity,
  type ActivityFormValues,
  type ActivityInput,
  type ActivityType,
  type Occurrence,
  type Recurrence,
  type Weekday,
  type WeekSummary,
} from './types';

export const occurrenceKey = (activityId: number, date: string) => `${activityId}:${date}`;

/** True when the series (or single activity) has an occurrence on `date`. */
export function occursOn(activity: Pick<Activity, 'date' | 'recurrence' | 'exceptions'>, date: string): boolean {
  const { recurrence } = activity;
  if (date < activity.date || activity.exceptions.includes(date)) return false;
  if (recurrence.kind === 'none') return date === activity.date;
  if (recurrence.until && date > recurrence.until) return false;
  const weekday = isoWeekday(date);
  if (recurrence.kind === 'weekdays') return weekday <= 5;
  if (recurrence.kind === 'weekly') return recurrence.days.includes(weekday as Weekday);
  return true; // daily
}

export function toOccurrence(activity: Activity, date: string): Occurrence {
  return {
    key: occurrenceKey(activity.id, date),
    activityId: activity.id,
    date,
    title: activity.title,
    type: activity.type,
    startTime: activity.startTime,
    endTime: activity.endTime,
    location: activity.location,
    note: activity.note,
    isRecurring: activity.recurrence.kind !== 'none',
  };
}

export const compareOccurrences = (a: Occurrence, b: Occurrence) =>
  a.date.localeCompare(b.date) ||
  a.startTime.localeCompare(b.startTime) ||
  a.endTime.localeCompare(b.endTime) ||
  a.title.localeCompare(b.title) ||
  a.activityId - b.activityId;

/**
 * Every occurrence of `activities` between `from` and `to` (inclusive `YYYY-MM-DD`), sorted by date and time.
 * Used by the mock (like the API) and by optimistic updates in the UI.
 */
export function expandOccurrences(activities: readonly Activity[], from: string, to: string): Occurrence[] {
  const result: Occurrence[] = [];
  for (const activity of activities) {
    const start = activity.date > from ? activity.date : from;
    const until = activity.recurrence.kind === 'none' ? activity.date : (activity.recurrence.until ?? to);
    const end = until < to ? until : to;
    for (let date = start; date <= end; date = addDays(date, 1)) {
      if (occursOn(activity, date)) result.push(toOccurrence(activity, date));
    }
  }
  return result.sort(compareOccurrences);
}

export type DayLayout = {
  /** Side-by-side placement of each visible occurrence: `column` of `columns` (left = column / columns). */
  placements: Map<string, { column: number; columns: number }>;
  /** Groups whose overlaps didn't fit in MAX_COLUMNS: shown as a "+N" chip at `startMinutes`. */
  overflow: { startMinutes: number; hidden: Occurrence[] }[];
};

/**
 * Places one day's occurrences so overlapping ones sit side by side. Touching times (10:00–11:00 and
 * 11:00–12:00) do not overlap. At most `maxColumns` columns; the rest go into an overflow "+N" chip.
 */
export function layoutDay(occurrences: readonly Occurrence[], maxColumns = MAX_COLUMNS): DayLayout {
  const sorted = [...occurrences].sort(
    (a, b) => toMinutes(a.startTime) - toMinutes(b.startTime) || toMinutes(b.endTime) - toMinutes(a.endTime)
  );
  const placements: DayLayout['placements'] = new Map();
  const overflow: DayLayout['overflow'] = [];

  let cluster: { occurrence: Occurrence; column: number }[] = [];
  let columnEnds: number[] = [];
  let clusterEnd = -1;

  const flush = () => {
    if (cluster.length === 0) return;
    const columns = Math.min(columnEnds.length, maxColumns);
    const hidden: Occurrence[] = [];
    for (const { occurrence, column } of cluster) {
      if (column < maxColumns) placements.set(occurrence.key, { column, columns });
      else hidden.push(occurrence);
    }
    if (hidden.length) overflow.push({ startMinutes: toMinutes(hidden[0].startTime), hidden });
    cluster = [];
    columnEnds = [];
  };

  for (const occurrence of sorted) {
    const start = toMinutes(occurrence.startTime);
    const end = toMinutes(occurrence.endTime);
    if (start >= clusterEnd) flush();
    let column = columnEnds.findIndex((columnEnd) => columnEnd <= start);
    if (column === -1) column = columnEnds.push(end) - 1;
    else columnEnds[column] = end;
    cluster.push({ occurrence, column });
    clusterEnd = Math.max(clusterEnd, end);
  }
  flush();
  return { placements, overflow };
}

/** Planned minutes in total and per type. */
export function summarize(occurrences: readonly Occurrence[]): WeekSummary {
  const byType = Object.fromEntries(ACTIVITY_TYPES.map((type) => [type, 0])) as Record<ActivityType, number>;
  let totalMinutes = 0;
  for (const o of occurrences) {
    const minutes = durationMinutes(o.startTime, o.endTime);
    byType[o.type] += minutes;
    totalMinutes += minutes;
  }
  return { totalMinutes, byType, count: occurrences.length };
}

/** The first other occurrence on `date` that overlaps `start`–`end` (touching is not overlapping). */
export function findOverlap(
  occurrences: readonly Occurrence[],
  slot: { date: string; startTime: string; endTime: string },
  ignore: (o: Occurrence) => boolean = () => false
): Occurrence | undefined {
  const start = toMinutes(slot.startTime);
  const end = toMinutes(slot.endTime);
  return occurrences.find(
    (o) => o.date === slot.date && !ignore(o) && toMinutes(o.startTime) < end && toMinutes(o.endTime) > start
  );
}

/** Shifts weekdays by `days` (e.g. Tue + 1 → Wed, Sun + 1 → Mon). */
const shiftWeekdays = (days: readonly Weekday[], by: number) =>
  [...new Set(days.map((d) => ((((d - 1 + by) % 7) + 7) % 7) + 1))].sort((a, b) => a - b) as Weekday[];

/**
 * A series moved by dragging one occurrence from `fromDate` to `toDate` at `startTime` ("all in series"):
 * the times move, and the dates (first day, repeat days, exceptions, end) shift by the same number of days.
 * Daily / weekday series moved to another day become weekly on the shifted days.
 */
export function moveSeries(activity: Activity, fromDate: string, toDate: string, startTime: string): ActivityInput {
  const shift = daysBetween(fromDate, toDate);
  const length = durationMinutes(activity.startTime, activity.endTime);
  const { recurrence } = activity;
  const until = recurrence.kind === 'none' || !recurrence.until ? null : addDays(recurrence.until, shift);

  let next: Recurrence = recurrence;
  if (shift % 7 !== 0 && recurrence.kind === 'weekdays') {
    next = { kind: 'weekly', days: shiftWeekdays([1, 2, 3, 4, 5], shift), until };
  } else if (recurrence.kind === 'weekly') {
    next = { kind: 'weekly', days: shiftWeekdays(recurrence.days, shift), until };
  } else if (recurrence.kind !== 'none') {
    next = { ...recurrence, until };
  }

  return {
    ...activityToInput(activity),
    date: addDays(activity.date, shift),
    startTime,
    endTime: fromMinutes(toMinutes(startTime) + length),
    recurrence: next,
  };
}

export function activityToInput(activity: Activity): ActivityInput {
  const { title, type, date, startTime, endTime, location, note, recurrence } = activity;
  return { title, type, date, startTime, endTime, location, note, recurrence };
}

/** A single (non-repeating) activity with an occurrence's values — "this only" edits / moves and Undo. */
export function occurrenceToInput(o: Occurrence): ActivityInput {
  const { title, type, date, startTime, endTime, location, note } = o;
  return { title, type, date, startTime, endTime, location, note, recurrence: { kind: 'none' } };
}

/** Form (flat) → API input. */
export function formToInput(values: ActivityFormValues): ActivityInput {
  const { repeat, repeatDays, until, ...rest } = values;
  const base = { ...rest, title: rest.title.trim(), location: rest.location.trim(), note: rest.note.trim() };
  if (repeat === 'none') return { ...base, recurrence: { kind: 'none' } };
  if (repeat === 'weekly') return { ...base, recurrence: { kind: 'weekly', days: repeatDays, until } };
  return { ...base, recurrence: { kind: repeat, until } };
}

/** API input / activity → form values. `date` overrides the start date (editing one occurrence of a series). */
export function inputToForm(input: ActivityInput, date = input.date): ActivityFormValues {
  const { recurrence, ...rest } = input;
  return {
    ...rest,
    date,
    repeat: recurrence.kind,
    repeatDays: recurrence.kind === 'weekly' ? recurrence.days : [isoWeekday(date) as Weekday],
    until: recurrence.kind === 'none' ? null : recurrence.until,
  };
}

/**
 * The series input for "all in series" after editing the occurrence on `occurrenceDate` in the form:
 * a changed date shifts the series' start (and exceptions stay with their days via the API).
 */
export function seriesInputFromForm(activity: Activity, occurrenceDate: string, values: ActivityFormValues) {
  const input = formToInput(values);
  return { ...input, date: addDays(activity.date, daysBetween(occurrenceDate, values.date)) };
}

/** True when only the text fields differ — then "All in series" is the natural default. */
export function onlyTextChanged(before: ActivityFormValues, after: ActivityFormValues): boolean {
  const timing = ['date', 'startTime', 'endTime', 'repeat', 'until'] as const;
  return timing.every((key) => before[key] === after[key]) && before.repeatDays.join() === after.repeatDays.join();
}

/** Default length of a new activity: 30 min for meetings, otherwise 60. */
export const defaultDuration = (type: ActivityType) => (type === 'meeting' ? 30 : 60);

/** The next full half hour after `nowMinutes` (for a new activity with no clicked slot). */
export const nextHalfHour = (nowMinutes: number) =>
  fromMinutes(Math.min(23 * 60, Math.ceil((nowMinutes + 1) / 30) * 30));
