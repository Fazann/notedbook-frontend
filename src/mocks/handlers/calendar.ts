import { type HijriDate, hijriDate } from '@/features/calendar/hijri';
import {
  type KhmerLunarDate,
  khmerLunarDate,
  type KhmerLunarMonth,
  type MoonPhase,
} from '@/features/calendar/khmer-lunar';
import type { Holiday, HolidayCountry, HolidayQuery } from '@/features/calendar/types';
import { addDays } from '@/lib/time';

import { copy, delay } from '../delay';

/**
 * Mock holidays, generated for any year: fixed dates plus holidays found by their Khmer lunar or Hijri date.
 * Demo data only — official dates (e.g. Khmer New Year, Islamic holidays set by moon sighting) can differ by a day.
 */
type Rule = { key: string; name: string } & (
  | { solar: string }
  | { lunar: { month: KhmerLunarMonth; day: number; phase: MoonPhase } }
  | { hijri: { month: number; day: number } }
);

const CAMBODIA: Rule[] = [
  { key: 'newYear', name: "International New Year's Day", solar: '01-01' },
  { key: 'victoryDay', name: 'Victory over Genocide Day', solar: '01-07' },
  { key: 'womensDay', name: "International Women's Day", solar: '03-08' },
  { key: 'khmerNewYear', name: 'Khmer New Year', solar: '04-14' },
  { key: 'khmerNewYear', name: 'Khmer New Year', solar: '04-15' },
  { key: 'khmerNewYear', name: 'Khmer New Year', solar: '04-16' },
  { key: 'labourDay', name: 'International Labour Day', solar: '05-01' },
  { key: 'kingBirthday', name: "King's Birthday", solar: '05-14' },
  { key: 'visakBochea', name: 'Visak Bochea Day', lunar: { month: 'pisak', day: 15, phase: 'waxing' } },
  { key: 'royalPloughing', name: 'Royal Ploughing Ceremony', lunar: { month: 'pisak', day: 4, phase: 'waning' } },
  { key: 'queenMotherBirthday', name: "Queen Mother's Birthday", solar: '06-18' },
  { key: 'pchumBen', name: 'Pchum Ben', lunar: { month: 'photrobot', day: 14, phase: 'waning' } },
  { key: 'pchumBen', name: 'Pchum Ben', lunar: { month: 'photrobot', day: 15, phase: 'waning' } },
  { key: 'pchumBen', name: 'Pchum Ben', lunar: { month: 'assuj', day: 1, phase: 'waxing' } },
  { key: 'constitutionDay', name: 'Constitution Day', solar: '09-24' },
  { key: 'kingFatherCommemoration', name: 'Commemoration Day of King Father', solar: '10-15' },
  { key: 'coronationDay', name: 'Coronation Day', solar: '10-29' },
  { key: 'independenceDay', name: 'Independence Day', solar: '11-09' },
  { key: 'waterFestival', name: 'Water Festival', lunar: { month: 'kadeuk', day: 14, phase: 'waxing' } },
  { key: 'waterFestival', name: 'Water Festival', lunar: { month: 'kadeuk', day: 15, phase: 'waxing' } },
  { key: 'waterFestival', name: 'Water Festival', lunar: { month: 'kadeuk', day: 1, phase: 'waning' } },
];

const ISLAMIC_COMMON: Rule[] = [
  { key: 'islamicNewYear', name: 'Islamic New Year', hijri: { month: 1, day: 1 } },
  { key: 'mawlid', name: "Prophet Muhammad's Birthday", hijri: { month: 3, day: 12 } },
  { key: 'eidAlFitr', name: 'Eid al-Fitr', hijri: { month: 10, day: 1 } },
  { key: 'eidAlAdha', name: 'Eid al-Adha', hijri: { month: 12, day: 10 } },
];

const ISLAMIC: Record<HolidayCountry, Rule[]> = {
  KH: ISLAMIC_COMMON,
  MY: [
    ...ISLAMIC_COMMON,
    { key: 'israMiraj', name: "Isra' and Mi'raj", hijri: { month: 7, day: 27 } },
    { key: 'ramadanStart', name: 'Beginning of Ramadan', hijri: { month: 9, day: 1 } },
    { key: 'nuzulQuran', name: 'Nuzul Al-Quran', hijri: { month: 9, day: 17 } },
    { key: 'eidAlFitr', name: 'Eid al-Fitr', hijri: { month: 10, day: 2 } },
  ],
};

type DayInfo = { date: string; lunar: () => KhmerLunarDate; hijri: () => HijriDate };

function matches(rule: Rule, day: DayInfo): boolean {
  if ('solar' in rule) return day.date.endsWith(`-${rule.solar}`);
  if ('lunar' in rule) {
    const lunar = day.lunar();
    return lunar.month === rule.lunar.month && lunar.day === rule.lunar.day && lunar.phase === rule.lunar.phase;
  }
  const hijri = day.hijri();
  return hijri.month === rule.hijri.month && hijri.day === rule.hijri.day;
}

/** Computes a value on first use only. */
function lazy<T>(compute: () => T): () => T {
  let value: { v: T } | undefined;
  return () => (value ??= { v: compute() }).v;
}

export async function listHolidays({ year, country, kind }: HolidayQuery): Promise<Holiday[]> {
  await delay();
  // Malaysia's national holidays are not in the mock yet; only its Islamic ones.
  const rules = kind === 'islamic' ? ISLAMIC[country] : country === 'KH' ? CAMBODIA : [];
  const result: Holiday[] = [];
  for (let date = `${year}-01-01`; date.startsWith(String(year)); date = addDays(date, 1)) {
    const day: DayInfo = { date, lunar: lazy(() => khmerLunarDate(date)), hijri: lazy(() => hijriDate(date)) };
    for (const rule of rules) {
      if (matches(rule, day)) result.push({ date, key: rule.key, name: rule.name });
    }
  }
  return copy(result);
}
