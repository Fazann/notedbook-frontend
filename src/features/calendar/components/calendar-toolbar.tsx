'use client';

import { useTranslations } from 'next-intl';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

import { CALENDAR_SYSTEMS, type CalendarSystem, HOLIDAY_COUNTRIES, type HolidayCountry } from '../types';

export type CalendarToolbarProps = {
  system: CalendarSystem;
  region: HolidayCountry;
  onSystemChange: (system: CalendarSystem) => void;
  onRegionChange: (region: HolidayCountry) => void;
};

/**
 * International / Khmer / Hijri · (Hijri only) Cambodia / Malaysia.
 * Month navigation lives in the calendar card header.
 */
export function CalendarToolbar({ system, region, onSystemChange, onRegionChange }: CalendarToolbarProps) {
  const t = useTranslations('calendar');

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <ToggleGroup
        type="single"
        variant="outline"
        size="touch"
        spacing={0}
        value={system}
        onValueChange={(value) => value && onSystemChange(value as CalendarSystem)}
        aria-label={t('systems.label')}
        className="bg-card w-full sm:w-auto"
      >
        {CALENDAR_SYSTEMS.map((s) => (
          <ToggleGroupItem key={s} value={s} className="flex-1 sm:flex-none">
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
          className="bg-card w-full sm:w-auto"
        >
          {HOLIDAY_COUNTRIES.map((c) => (
            <ToggleGroupItem key={c} value={c} className="flex-1 sm:flex-none">
              {t(`regions.${c}`)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      )}
    </div>
  );
}
