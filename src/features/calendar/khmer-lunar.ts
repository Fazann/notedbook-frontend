/**
 * Khmer lunar calendar (Chhankitek) — converts a Gregorian `YYYY-MM-DD` to a Khmer lunar day.
 * Port of the traditional calculation used by the `momentkh` library, working on whole days (UTC) instead of
 * `Date` math so the result never shifts with the browser timezone.
 */

/** Lunar month order; the two `asadh` months only exist in a leap-month year (they replace `asadh`). */
export const KHMER_LUNAR_MONTHS = [
  'migasir',
  'bos',
  'meak',
  'phalkun',
  'cheit',
  'pisak',
  'jesth',
  'asadh',
  'srap',
  'photrobot',
  'assuj',
  'kadeuk',
  'pathamasadh',
  'tutiyasadh',
] as const;
export type KhmerLunarMonth = (typeof KHMER_LUNAR_MONTHS)[number];

export type MoonPhase = 'waxing' | 'waning';

export type KhmerLunarDate = {
  month: KhmerLunarMonth;
  /** 1–15 within the phase: "1 កើត" … "15 កើត", then "1 រោច" … "15 រោច" (14 រោច in a 29-day month). */
  day: number;
  phase: MoonPhase;
};

const MONTH = Object.fromEntries(KHMER_LUNAR_MONTHS.map((m, i) => [m, i])) as Record<KhmerLunarMonth, number>;
const MS_PER_DAY = 86_400_000;
/** 1 January 1900 was 1 កើត of បុស្ស. */
const EPOCH = { day: toDayNumber('1900-01-01'), month: MONTH.bos };

function toDayNumber(date: string): number {
  return Date.parse(`${date}T00:00:00Z`) / MS_PER_DAY;
}

const aharkunBase = (be: number) => be * 292207 + 499;
const aharkun = (be: number) => Math.floor(aharkunBase(be) / 800) + 4;
const isSolarLeap = (be: number) => 800 - (aharkunBase(be) % 800) <= 207;
const avoman = (be: number) => (11 * aharkun(be) + 25) % 692;
const bodithey = (be: number) => {
  const a = aharkun(be);
  return (Math.floor((11 * a + 25) / 692) + a + 29) % 30;
};

/** 0 none, 1 bodithey (month) leap, 2 avoman (day) leap, 3 both. */
function boditheyLeap(be: number): 0 | 1 | 2 | 3 {
  const b = bodithey(be);
  const a = avoman(be);
  let monthLeap = b >= 25 || b <= 5;
  // 25 then 5 in consecutive years: only the 5 is a leap-month year. 24 then 6: the 24 is.
  if (b === 25 && bodithey(be + 1) === 5) monthLeap = false;
  if (b === 24 && bodithey(be + 1) === 6) monthLeap = true;
  let dayLeap: boolean;
  if (isSolarLeap(be)) dayLeap = a <= 126;
  else dayLeap = a <= 137 && avoman(be + 1) !== 0;
  if (monthLeap && dayLeap) return 3;
  if (monthLeap) return 1;
  return dayLeap ? 2 : 0;
}

/** The leap type actually applied to a Buddhist Era year: 0 none, 1 leap month, 2 leap day. */
function leapType(be: number): 0 | 1 | 2 {
  const b = boditheyLeap(be);
  // A year cannot have both: the leap day moves to the next year.
  if (b === 3) return 1;
  if (b !== 0) return b;
  return boditheyLeap(be - 1) === 3 ? 2 : 0;
}

/** The BE year used for leap rules of a day: the Khmer year changes around April. */
function beYearOf(dayNumber: number): number {
  const d = new Date(dayNumber * MS_PER_DAY);
  return d.getUTCFullYear() + (d.getUTCMonth() < 4 ? 543 : 544);
}

function daysInMonth(month: number, be: number): number {
  if (month === MONTH.jesth && leapType(be) === 2) return 30;
  if (month === MONTH.pathamasadh || month === MONTH.tutiyasadh) return 30;
  return month % 2 === 0 ? 29 : 30;
}

function daysInYear(be: number): number {
  const leap = leapType(be);
  if (leap === 1) return 384;
  return leap === 2 ? 355 : 354;
}

function nextMonth(month: number, be: number): number {
  if (month === MONTH.jesth) return leapType(be) === 1 ? MONTH.pathamasadh : MONTH.asadh;
  if (month === MONTH.pathamasadh) return MONTH.tutiyasadh;
  if (month === MONTH.tutiyasadh || month === MONTH.asadh) return MONTH.srap;
  return (month + 1) % 12;
}

function oneYearLater(dayNumber: number): number {
  const d = new Date(dayNumber * MS_PER_DAY);
  d.setUTCFullYear(d.getUTCFullYear() + 1);
  return d.getTime() / MS_PER_DAY;
}

/** `2026-10-05` → 9 រោច ភទ្របទ. Supports dates from 1900-01-01. */
export function khmerLunarDate(date: string): KhmerLunarDate {
  const target = toDayNumber(date);
  if (!(target >= EPOCH.day)) throw new RangeError(`Unsupported date for the Khmer lunar calendar: ${date}`);

  let start = EPOCH.day;
  let month = EPOCH.month;
  // Jump whole lunar years (each starts on 1 កើត បុស្ស), then whole months.
  while (target - start > daysInYear(beYearOf(oneYearLater(start)))) {
    start += daysInYear(beYearOf(oneYearLater(start)));
  }
  while (target - start > daysInMonth(month, beYearOf(start))) {
    start += daysInMonth(month, beYearOf(start));
    month = nextMonth(month, beYearOf(start));
  }
  let dayIndex = target - start;
  const length = daysInMonth(month, beYearOf(target));
  if (dayIndex >= length) {
    dayIndex %= length;
    month = nextMonth(month, beYearOf(start));
  }

  return {
    month: KHMER_LUNAR_MONTHS[month],
    day: dayIndex < 15 ? dayIndex + 1 : dayIndex - 14,
    phase: dayIndex < 15 ? 'waxing' : 'waning',
  };
}

/** Buddhist Era year (ព.ស.) shown on Khmer calendars. It starts the day after Visak Bochea (15 កើត ពិសាខ). */
export function buddhistEraYear(date: string): number {
  const [year, month] = date.split('-').map(Number);
  // Visak Bochea always falls in April–June.
  if (month <= 3) return year + 543;
  if (month >= 7) return year + 544;
  const lunar = khmerLunarDate(date);
  const beforeVisak = MONTH[lunar.month] < MONTH.pisak || (lunar.month === 'pisak' && lunar.phase === 'waxing');
  return year + (beforeVisak ? 543 : 544);
}
