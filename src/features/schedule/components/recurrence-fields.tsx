'use client';

import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Control } from 'react-hook-form';
import { useWatch } from 'react-hook-form';

import { DatePicker } from '@/components/shared/date-picker';
import { FormField } from '@/components/shared/form-field';
import { FormSelect } from '@/components/shared/form-select';
import { WeekdayPicker } from '@/components/shared/weekday-picker';
import { Button } from '@/components/ui/button';

import type { ActivityFormValues } from '../types';

export type RecurrenceFieldsProps = {
  control: Control<ActivityFormValues>;
  translateError: (message: string) => string;
};

/** Repeat: does not repeat · every day · every weekday · every week on… (weekday picker) · until (optional). */
export function RecurrenceFields({ control, translateError }: RecurrenceFieldsProps) {
  const t = useTranslations('schedule.form');
  const repeat = useWatch({ control, name: 'repeat' });
  const common = { control, translateError };

  return (
    <>
      <FormSelect
        {...common}
        name="repeat"
        label={t('repeat')}
        options={[
          { value: 'none', label: t('repeatNone') },
          { value: 'daily', label: t('repeatDaily') },
          { value: 'weekdays', label: t('repeatWeekdays') },
          { value: 'weekly', label: t('repeatWeekly') },
        ]}
      />

      {repeat === 'weekly' && (
        <FormField {...common} name="repeatDays" label={t('repeatOn')}>
          {({ field, labelId, describedBy, invalid }) => (
            <WeekdayPicker
              value={field.value}
              onChange={field.onChange}
              aria-labelledby={labelId}
              aria-describedby={describedBy}
              aria-invalid={invalid}
            />
          )}
        </FormField>
      )}

      {repeat !== 'none' && (
        <FormField {...common} name="until" label={t('until')}>
          {({ field, id, invalid }) => (
            <div className="flex gap-2">
              <DatePicker
                id={id}
                value={field.value ?? ''}
                onChange={field.onChange}
                placeholder={t('untilNever')}
                aria-invalid={invalid}
                className="flex-1"
              />
              {field.value && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon-touch"
                  onClick={() => field.onChange(null)}
                  aria-label={t('clearUntil')}
                >
                  <X aria-hidden />
                </Button>
              )}
            </div>
          )}
        </FormField>
      )}
    </>
  );
}
