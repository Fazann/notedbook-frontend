'use client';

import { useTranslations } from 'next-intl';

import { MonthPicker } from '@/components/shared/month-picker';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

import { CALENDAR_SYSTEMS, type CalendarSystem, HOLIDAY_COUNTRIES, type HolidayCountry } from '../types';

export type CalendarToolbarProps = {
  system: CalendarSystem;
  region: HolidayCountry;
  /** `YYYY-MM` */
  month: string;
  currentMonth: string;
  onSystemChange: (system: CalendarSystem) => void;
  onRegionChange: (region: HolidayCountry) => void;
  onMonthChange: (month: string) => void;
};

/** International / Khmer / Hijri · ‹ month › Today · (Hijri only) Cambodia / Malaysia. */
export function CalendarToolbar({
  system,
  region,
  month,
  currentMonth,
  onSystemChange,
  onRegionChange,
  onMonthChange,
}: CalendarToolbarProps) {
  const t = useTranslations('calendar');

  return (
    <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
      <div className="flex items-center gap-2">
        <MonthPicker value={month} onChange={onMonthChange} className="flex-1 md:flex-none" />
        <Button variant="outline" size="touch" onClick={() => onMonthChange(currentMonth)}>
          {t('today')}
        </Button>
      </div>

      <ToggleGroup
        type="single"
        variant="outline"
        size="touch"
        spacing={0}
        value={system}
        onValueChange={(value) => value && onSystemChange(value as CalendarSystem)}
        aria-label={t('systems.label')}
        className="w-full md:ml-auto md:w-auto"
      >
        {CALENDAR_SYSTEMS.map((s) => (
          <ToggleGroupItem key={s} value={s} className="flex-1 md:flex-none">
            {t(`systems.${s}`)}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      {system === 'hijri' && (
        <ToggleGroup
          type="single"
          variant="outline"
          size="touch"
          spacing={0}
          value={region}
          onValueChange={(value) => value && onRegionChange(value as HolidayCountry)}
          aria-label={t('regions.label')}
          className="w-full md:w-auto"
        >
          {HOLIDAY_COUNTRIES.map((c) => (
            <ToggleGroupItem key={c} value={c} className="flex-1 md:flex-none">
              {t(`regions.${c}`)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      )}
    </div>
  );
}
