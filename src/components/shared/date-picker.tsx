'use client';

import { format as formatDate } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useFormatter, useLocale } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { calendarLocale } from '@/lib/calendar-locale';
import { parseDate, utcDate } from '@/lib/dates';
import { cn } from '@/lib/utils';

export type DatePickerProps = {
  /** Plain date `YYYY-MM-DD`. */
  value: string;
  onChange: (date: string) => void;
  placeholder: string;
  /** Icon-only trigger (the placeholder becomes its accessible name). A dot marks that a date is set. */
  iconOnly?: boolean;
  id?: string;
  className?: string;
  'aria-invalid'?: boolean;
};

export function DatePicker({ value, onChange, placeholder, iconOnly, id, className, ...props }: DatePickerProps) {
  const format = useFormatter();
  const locale = useLocale();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {iconOnly ? (
          <Button
            id={id}
            type="button"
            variant="ghost"
            size="icon-touch"
            className={cn('relative', className)}
            aria-label={placeholder}
            aria-invalid={props['aria-invalid']}
          >
            <CalendarIcon aria-hidden />
            {value && <span className="bg-primary absolute top-2 right-2 size-2 rounded-full" aria-hidden />}
          </Button>
        ) : (
          <Button
            id={id}
            type="button"
            variant="outline"
            size="touch"
            className={cn('w-full justify-start font-normal', !value && 'text-muted-foreground', className)}
            aria-invalid={props['aria-invalid']}
          >
            <CalendarIcon aria-hidden />
            {value ? format.dateTime(utcDate(value), { dateStyle: 'medium', timeZone: 'UTC' }) : placeholder}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          locale={calendarLocale(locale)}
          selected={value ? parseDate(value) : undefined}
          defaultMonth={value ? parseDate(value) : undefined}
          onSelect={(date) => {
            if (date) {
              onChange(formatDate(date, 'yyyy-MM-dd'));
              setOpen(false);
            }
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
