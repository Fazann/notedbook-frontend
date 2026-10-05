import { describe, expect, it, vi } from 'vitest';

import { listHolidays } from './calendar';

vi.mock('../delay', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../delay')>()),
  delay: () => Promise.resolve(),
}));

const datesOf = async (key: string, ...args: Parameters<typeof listHolidays>) =>
  (await listHolidays(...args)).filter((h) => h.key === key).map((h) => h.date);

describe('listHolidays (mock)', () => {
  const kh2026 = { year: 2026, country: 'KH', kind: 'national' } as const;

  it('has fixed-date Cambodian holidays', async () => {
    expect(await datesOf('independenceDay', kh2026)).toEqual(['2026-11-09']);
    expect(await datesOf('khmerNewYear', kh2026)).toEqual(['2026-04-14', '2026-04-15', '2026-04-16']);
  });

  it('finds lunar holidays by their Khmer lunar date', async () => {
    expect(await datesOf('pchumBen', kh2026)).toEqual(['2026-10-10', '2026-10-11', '2026-10-12']);
    expect(await datesOf('pchumBen', { ...kh2026, year: 2025 })).toEqual(['2025-09-21', '2025-09-22', '2025-09-23']);
  });

  it('finds Islamic holidays by their Hijri date, with more of them for Malaysia', async () => {
    const kh = { year: 2026, country: 'KH', kind: 'islamic' } as const;
    expect(await datesOf('eidAlFitr', kh)).toEqual(['2026-03-20']);
    expect(await datesOf('eidAlFitr', { ...kh, country: 'MY' })).toEqual(['2026-03-20', '2026-03-21']);
    expect(await datesOf('nuzulQuran', kh)).toEqual([]);
    expect(await datesOf('nuzulQuran', { ...kh, country: 'MY' })).toHaveLength(1);
  });

  it('returns entries sorted by date', async () => {
    const dates = (await listHolidays(kh2026)).map((h) => h.date);
    expect(dates).toEqual([...dates].sort());
  });
});
