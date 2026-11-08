'use client';

import { useTranslations } from 'next-intl';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

import { CALENDAR_SYSTEMS, type CalendarSystem, HOLIDAY_COUNTRIES, type HolidayCountry } from '../types';

export type CalendarToolbarProps = {
  system: CalendarSystem;
  region: HolidayCountry;
  onSystemChange: (system: CalendarSystem) => void;
  onRegionChange: (region: HolidayCountry) => void;
};

/**
 * International / Khmer / Hijri · (Hijri only) Cambodia / Malaysia.
 * Phones get selects (Khmer and Malay labels do not fit as tabs at 360px); tablet+ gets one-tap tabs.
 * Month navigation lives in the calendar card header.
 */
export function CalendarToolbar({ system, region, onSystemChange, onRegionChange }: CalendarToolbarProps) {
  const t = useTranslations('calendar');
  const isHijri = system === 'hijri';

  return (
    <div className="w-full sm:w-auto">
      <div className={cn('grid gap-2 sm:hidden', isHijri && 'grid-cols-2')}>
        <Select value={system} onValueChange={(value) => onSystemChange(value as CalendarSystem)}>
          <SelectTrigger aria-label={t('systems.label')} className="bg-card h-11! w-full min-w-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CALENDAR_SYSTEMS.map((s) => (
              <SelectItem key={s} value={s} className="min-h-11">
                {t(`systems.${s}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isHijri && (
          <Select value={region} onValueChange={(value) => onRegionChange(value as HolidayCountry)}>
            <SelectTrigger aria-label={t('regions.label')} className="bg-card h-11! w-full min-w-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HOLIDAY_COUNTRIES.map((c) => (
                <SelectItem key={c} value={c} className="min-h-11">
                  {t(`regions.${c}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="hidden flex-wrap items-center gap-2 sm:flex">
        <ToggleGroup
          type="single"
          variant="outline"
          size="touch"
          spacing={0}
          value={system}
          onValueChange={(value) => value && onSystemChange(value as CalendarSystem)}
          aria-label={t('systems.label')}
          className="bg-card"
        >
          {CALENDAR_SYSTEMS.map((s) => (
            <ToggleGroupItem key={s} value={s}>
              {t(`systems.${s}`)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        {isHijri && (
          <ToggleGroup
            type="single"
            variant="outline"
            size="touch"
            spacing={0}
            value={region}
            onValueChange={(value) => value && onRegionChange(value as HolidayCountry)}
            aria-label={t('regions.label')}
            className="bg-card"
          >
            {HOLIDAY_COUNTRIES.map((c) => (
              <ToggleGroupItem key={c} value={c}>
                {t(`regions.${c}`)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        )}
      </div>
    </div>
  );
}
