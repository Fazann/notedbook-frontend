import { toLatinDigits } from './money';

/**
 * Wall-clock date and time helpers. Activity dates (`YYYY-MM-DD`) and times (`HH:mm`, 24h) are plain strings in the
 * user's timezone, so all math here works on strings and minutes — never on `new Date()` arithmetic.
 */

/** The user's timezone (see AGENTS.md → Dates). */
export const APP_TIME_ZONE = 'Asia/Phnom_Penh';

/** ISO weekday the week starts on: 1 = Monday (common in Cambodia). */
export const WEEK_STARTS_ON = 1;

export const MINUTES_PER_DAY = 24 * 60;

/** "10:10" → 610 */
export function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** 610 → "10:10". Clamped to 00:00–23:59 (activities never cross midnight). */
export function fromMinutes(minutes: number): string {
  const m = Math.min(MINUTES_PER_DAY - 1, Math.max(0, Math.round(minutes)));
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

export function durationMinutes(start: string, end: string): number {
  return toMinutes(end) - toMinutes(start);
}

/** "10:10" + 30 → "10:40" (clamped to the same day). */
export function addMinutes(time: string, minutes: number): string {
  return fromMinutes(toMinutes(time) + minutes);
}

/** Rounds minutes to the nearest `step` (default 15). */
export function snapMinutes(minutes: number, step = 15): number {
  return Math.round(minutes / step) * step;
}

/**
 * Parses what people type into a time field: "10:10", "1010", "10.10", "9", "9pm", "10:10am", "១០:១០".
 * Returns "HH:mm" or null.
 */
export function parseTime(input: string): string | null {
  const text = toLatinDigits(input).trim().toLowerCase().replace(/\s+/g, '');
  const match = /^(\d{1,2})(?:[:.h]?(\d{2}))?(am|pm|a|p)?$/.exec(text);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = match[2] === undefined ? 0 : Number(match[2]);
  const meridiem = match[3]?.[0];
  if (minutes > 59) return null;
  if (meridiem) {
    if (hours < 1 || hours > 12) return null;
    hours = (hours % 12) + (meridiem === 'p' ? 12 : 0);
  }
  if (hours > 23) return null;
  return fromMinutes(hours * 60 + minutes);
}

// ---- Dates (`YYYY-MM-DD`) ----

const toUtc = (date: string) => {
  const [y, m, d] = date.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};
const fromUtc = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const DAY_MS = 86_400_000;

/** "2026-09-30" + 3 → "2026-10-03" */
export function addDays(date: string, days: number): string {
  return fromUtc(toUtc(date) + days * DAY_MS);
}

/** Whole days from `from` to `to`; negative when `to` is earlier. */
export function daysBetween(from: string, to: string): number {
  return Math.round((toUtc(to) - toUtc(from)) / DAY_MS);
}

/** ISO weekday: 1 = Monday … 7 = Sunday. */
export function isoWeekday(date: string): number {
  return new Date(toUtc(date)).getUTCDay() || 7;
}

/** The first day (Monday) of the week `date` is in. */
export function startOfWeek(date: string): string {
  return addDays(date, -((isoWeekday(date) - WEEK_STARTS_ON + 7) % 7));
}

/** The 7 dates of the week starting on `monday`. */
export function weekDays(monday: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

// ---- Timezone ----

function zonedParts(instant: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(instant);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '00';
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    minutes: Number(get('hour')) * 60 + Number(get('minute')),
  };
}

/** Today (`YYYY-MM-DD`) in `timeZone`, whatever the browser timezone is. */
export function todayInTz(timeZone: string = APP_TIME_ZONE, now: Date = new Date()): string {
  return zonedParts(now, timeZone).date;
}

/** Minutes since midnight right now in `timeZone`. */
export function nowMinutesInTz(timeZone: string = APP_TIME_ZONE, now: Date = new Date()): number {
  return zonedParts(now, timeZone).minutes;
}

/**
 * The instant when the wall clock in `timeZone` shows `date` `time` — for DISPLAY only, formatted with
 * next-intl (whose timeZone is also Asia/Phnom_Penh). Never do date math on the result.
 */
export function toZonedDateTime(date: string, time = '00:00', timeZone: string = APP_TIME_ZONE): Date {
  const guess = toUtc(date) + toMinutes(time) * 60_000;
  // The zone's offset at that moment: how far its wall clock is from UTC.
  const shown = zonedParts(new Date(guess), timeZone);
  const offset = toUtc(shown.date) + shown.minutes * 60_000 - guess;
  return new Date(guess - offset);
}
