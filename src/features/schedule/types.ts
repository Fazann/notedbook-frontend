import { z } from 'zod';

import { durationMinutes, toMinutes } from '@/lib/time';

export const ACTIVITY_TYPES = ['meeting', 'learning', 'work', 'exercise', 'personal', 'family', 'other'] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

/** ISO weekday: 1 = Monday … 7 = Sunday. */
export const weekdaySchema = z.literal([1, 2, 3, 4, 5, 6, 7]);
export type Weekday = z.infer<typeof weekdaySchema>;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

/** `until` is an inclusive `YYYY-MM-DD` or null (no end). */
export const recurrenceSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('none') }),
  z.object({ kind: z.literal('daily'), until: isoDate.nullable() }),
  z.object({ kind: z.literal('weekdays'), until: isoDate.nullable() }),
  z.object({ kind: z.literal('weekly'), days: z.array(weekdaySchema), until: isoDate.nullable() }),
]);
export type Recurrence = z.infer<typeof recurrenceSchema>;
export type RecurrenceKind = Recurrence['kind'];
export const RECURRENCE_KINDS = ['none', 'daily', 'weekdays', 'weekly'] as const satisfies readonly RecurrenceKind[];

/** The saved activity: a single event or a repeating series. Dates and times are wall-clock in Asia/Phnom_Penh. */
export const activitySchema = z.object({
  id: z.number(),
  title: z.string(),
  type: z.enum(ACTIVITY_TYPES),
  /** `YYYY-MM-DD` — the first (or only) day */
  date: isoDate,
  /** `HH:mm`, 24h */
  startTime: hhmm,
  /** `HH:mm`, 24h, same day, after `startTime` */
  endTime: hhmm,
  location: z.string(),
  note: z.string(),
  recurrence: recurrenceSchema,
  /** Dates removed from a series ("delete this one only"). */
  exceptions: z.array(isoDate),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Activity = z.infer<typeof activitySchema>;

/** One concrete appearance on the calendar — what the views render. */
export const occurrenceSchema = z.object({
  /** `${activityId}:${date}` — stable React key */
  key: z.string(),
  activityId: z.number(),
  date: isoDate,
  title: z.string(),
  type: z.enum(ACTIVITY_TYPES),
  startTime: hhmm,
  endTime: hhmm,
  location: z.string(),
  note: z.string(),
  isRecurring: z.boolean(),
});
export type Occurrence = z.infer<typeof occurrenceSchema>;

export type WeekSummary = {
  totalMinutes: number;
  /** Minutes per type. */
  byType: Record<ActivityType, number>;
  count: number;
};

export const ACTIVITY_TITLE_MAX = 100;
export const ACTIVITY_LOCATION_MAX = 100;
export const ACTIVITY_NOTE_MAX = 500;
export const ACTIVITY_MIN_MINUTES = 5;

/** Body of POST / PUT /schedule/activities (the API shape; the mock validates it). */
export const activityInputSchema = z
  .object({
    title: z.string().trim().min(1, 'required').max(ACTIVITY_TITLE_MAX, 'tooLong'),
    type: z.enum(ACTIVITY_TYPES),
    date: isoDate,
    startTime: hhmm,
    endTime: hhmm,
    location: z.string().trim().max(ACTIVITY_LOCATION_MAX, 'tooLong'),
    note: z.string().trim().max(ACTIVITY_NOTE_MAX, 'tooLong'),
    recurrence: recurrenceSchema,
  })
  .refine((v) => toMinutes(v.endTime) > toMinutes(v.startTime), { path: ['endTime'], message: 'endAfterStart' })
  .refine((v) => durationMinutes(v.startTime, v.endTime) >= ACTIVITY_MIN_MINUTES, {
    path: ['endTime'],
    message: 'tooShort',
  })
  .refine((v) => v.recurrence.kind !== 'weekly' || v.recurrence.days.length > 0, {
    path: ['recurrence'],
    message: 'pickDay',
  })
  .refine((v) => v.recurrence.kind === 'none' || !v.recurrence.until || v.recurrence.until >= v.date, {
    path: ['recurrence'],
    message: 'untilBeforeStart',
  });
export type ActivityInput = z.infer<typeof activityInputSchema>;

/**
 * The form's own (flat) shape — react-hook-form can't bind fields inside the `recurrence` union.
 * Convert with `formToInput` / `activityToForm`. Messages are keys under `schedule.validation`.
 */
export const activityFormSchema = z
  .object({
    title: z.string().trim().min(1, 'required').max(ACTIVITY_TITLE_MAX, 'tooLong'),
    type: z.enum(ACTIVITY_TYPES),
    date: isoDate,
    startTime: hhmm,
    endTime: hhmm,
    location: z.string().trim().max(ACTIVITY_LOCATION_MAX, 'tooLong'),
    note: z.string().trim().max(ACTIVITY_NOTE_MAX, 'tooLong'),
    repeat: z.enum(RECURRENCE_KINDS),
    repeatDays: z.array(weekdaySchema),
    until: isoDate.nullable(),
  })
  .refine((v) => toMinutes(v.endTime) > toMinutes(v.startTime), { path: ['endTime'], message: 'endAfterStart' })
  .refine((v) => durationMinutes(v.startTime, v.endTime) >= ACTIVITY_MIN_MINUTES, {
    path: ['endTime'],
    message: 'tooShort',
  })
  .refine((v) => v.repeat !== 'weekly' || v.repeatDays.length > 0, { path: ['repeatDays'], message: 'pickDay' })
  .refine((v) => v.repeat === 'none' || !v.until || v.until >= v.date, {
    path: ['until'],
    message: 'untilBeforeStart',
  });
export type ActivityFormValues = z.infer<typeof activityFormSchema>;

/** Editing / deleting a repeating activity: only this date, or the whole series. */
export type Scope = 'this' | 'all';

/** `?view=` of the schedule page. */
export const SCHEDULE_VIEWS = ['week', 'day', 'agenda'] as const;
export type ScheduleView = (typeof SCHEDULE_VIEWS)[number];

/** Visible hours of the time grid (06:00–23:00); earlier / later activities get a chip that widens the range. */
export const GRID_START_MINUTES = 6 * 60;
export const GRID_END_MINUTES = 23 * 60;
/** Height of one hour in the grid, px. */
export const HOUR_HEIGHT = 48;
/** Drag / click snapping, minutes. */
export const SNAP_MINUTES = 15;
/** More overlapping activities than this show a "+N" chip. */
export const MAX_COLUMNS = 3;
/** The agenda shows this many days per "page". */
export const AGENDA_DAYS = 14;
/** The API accepts ranges up to this many days. */
export const MAX_RANGE_DAYS = 42;
