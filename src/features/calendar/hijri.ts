/**
 * Islamic (Hijri) dates from the browser's `Intl` calendar data (Umm al-Qura). Only the numbers are read from `Intl`;
 * month names come from the translation files, so the text is the same on the server and in every browser.
 */

/** Translation keys of the Hijri months, in order (index 0 = month 1). */
export const HIJRI_MONTHS = [
  'muharram',
  'safar',
  'rabiAlAwwal',
  'rabiAlThani',
  'jumadaAlUla',
  'jumadaAlThani',
  'rajab',
  'shaban',
  'ramadan',
  'shawwal',
  'dhuAlQadah',
  'dhuAlHijjah',
] as const;
export type HijriMonth = (typeof HIJRI_MONTHS)[number];

export type HijriDate = {
  year: number;
  /** 1 = Muharram … 12 = Dhu al-Hijjah */
  month: number;
  day: number;
};

const formatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', {
  day: 'numeric',
  month: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

/** `2026-03-20` → 1 Shawwal 1447. */
export function hijriDate(date: string): HijriDate {
  const parts = formatter.formatToParts(new Date(`${date}T00:00:00Z`));
  const part = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value);
  return { year: part('year'), month: part('month'), day: part('day') };
}
