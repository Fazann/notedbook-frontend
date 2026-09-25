'use client';

import { useFormatter } from 'next-intl';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { addDays, toZonedDateTime, WEEK_STARTS_ON } from '@/lib/time';
import { cn } from '@/lib/utils';

/** A known Monday; weekday names come from Intl for the current locale. */
const REFERENCE_MONDAY = '2024-01-01';
/** ISO weekdays (1 = Monday … 7 = Sunday) in display order. */
const WEEKDAYS = Array.from({ length: 7 }, (_, i) => ((WEEK_STARTS_ON - 1 + i) % 7) + 1);

export type WeekdayPickerProps = {
  /** ISO weekdays, 1 = Monday … 7 = Sunday. */
  value: readonly number[];
  onChange: (value: number[]) => void;
  disabled?: boolean;
  className?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
};

/** Seven toggle buttons (Mon … Sun) with locale weekday names; any number can be pressed. */
export function WeekdayPicker({ value, onChange, disabled, className, ...aria }: WeekdayPickerProps) {
  const format = useFormatter();
  const name = (day: number, weekday: 'short' | 'long') =>
    format.dateTime(toZonedDateTime(addDays(REFERENCE_MONDAY, day - 1)), { weekday });

  return (
    <ToggleGroup
      type="multiple"
      variant="outline"
      size="touch"
      spacing={1}
      value={value.map(String)}
      onValueChange={(next) => onChange(next.map(Number).sort((a, b) => a - b))}
      disabled={disabled}
      className={cn('flex w-full flex-wrap', className)}
      {...aria}
    >
      {WEEKDAYS.map((day) => (
        <ToggleGroupItem key={day} value={String(day)} aria-label={name(day, 'long')} className="min-w-11 flex-1">
          {name(day, 'short')}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
