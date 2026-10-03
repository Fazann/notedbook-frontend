import {
  ACTIVITY_TYPES,
  type Activity,
  type ActivityInput,
  type ActivityType,
  type Occurrence,
  type Recurrence,
  type Weekday,
  type WeekSummary,
} from '@/features/schedule/types';

export type ApiActivityType = 'MEETING' | 'LEARNING' | 'WORK' | 'EXERCISE' | 'PERSONAL' | 'FAMILY' | 'OTHER';
export type ApiRecurrenceKind = 'NONE' | 'DAILY' | 'WEEKDAYS' | 'WEEKLY';

/** `RecurrenceRes` of the Go API. `days` (ISO weekdays) is only sent for WEEKLY. */
export type ApiRecurrence = { kind: ApiRecurrenceKind; days?: number[]; until: string | null };

/** `ScheduleActivityRes` of the Go API. Dates `YYYY-MM-DD`, times `HH:mm`. */
export type ApiActivity = {
  id: number;
  title: string;
  type: ApiActivityType;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  note: string;
  recurrence: ApiRecurrence;
  exceptions: string[];
  created_at: string;
  updated_at: string;
};

/** `OccurrenceRes` of the Go API. */
export type ApiOccurrence = {
  key: string;
  activity_id: number;
  date: string;
  title: string;
  type: ApiActivityType;
  start_time: string;
  end_time: string;
  location: string;
  note: string;
  is_recurring: boolean;
};

/** `WeekSummaryRes` of the Go API: `by_type` only has the types that occur. */
export type ApiWeekSummary = {
  total_minutes: number;
  by_type: Partial<Record<ApiActivityType, number>>;
  count: number;
};

const toType = (type: ApiActivityType) => type.toLowerCase() as ActivityType;
const toApiType = (type: ActivityType) => type.toUpperCase() as ApiActivityType;
const toWeekdays = (days: number[] = []) => days.filter((d): d is Weekday => d >= 1 && d <= 7);

export function toRecurrence(r: ApiRecurrence): Recurrence {
  switch (r.kind) {
    case 'DAILY':
      return { kind: 'daily', until: r.until };
    case 'WEEKDAYS':
      return { kind: 'weekdays', until: r.until };
    case 'WEEKLY':
      return { kind: 'weekly', days: toWeekdays(r.days), until: r.until };
    default:
      return { kind: 'none' };
  }
}

export function toApiRecurrence(r: Recurrence) {
  if (r.kind === 'none') return { kind: 'NONE' };
  return {
    kind: r.kind.toUpperCase() as ApiRecurrenceKind,
    days: r.kind === 'weekly' ? r.days : undefined,
    until: r.until,
  };
}

export function toActivity(a: ApiActivity): Activity {
  return {
    id: a.id,
    title: a.title,
    type: toType(a.type),
    date: a.date,
    startTime: a.start_time,
    endTime: a.end_time,
    location: a.location,
    note: a.note,
    recurrence: toRecurrence(a.recurrence),
    exceptions: a.exceptions,
    createdAt: a.created_at,
    updatedAt: a.updated_at,
  };
}

export function toOccurrence(o: ApiOccurrence): Occurrence {
  return {
    key: o.key,
    activityId: o.activity_id,
    date: o.date,
    title: o.title,
    type: toType(o.type),
    startTime: o.start_time,
    endTime: o.end_time,
    location: o.location,
    note: o.note,
    isRecurring: o.is_recurring,
  };
}

/** Every type is present in `byType`, 0 when it does not occur. */
export function toWeekSummary(s: ApiWeekSummary): WeekSummary {
  const byType = Object.fromEntries(ACTIVITY_TYPES.map((t) => [t, s.by_type[toApiType(t)] ?? 0])) as Record<
    ActivityType,
    number
  >;
  return { totalMinutes: s.total_minutes, byType, count: s.count };
}

/** Body of POST / PUT /schedule/activities. */
export function toActivityBody(input: ActivityInput) {
  return {
    title: input.title,
    type: toApiType(input.type),
    date: input.date,
    start_time: input.startTime,
    end_time: input.endTime,
    location: input.location,
    note: input.note,
    recurrence: toApiRecurrence(input.recurrence),
  };
}
