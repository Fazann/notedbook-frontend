'use client';

import { format as formatDate } from 'date-fns';
import { useLocale, useTranslations } from 'next-intl';

import { ResponsiveDialog } from '@/components/shared/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { calendarLocale } from '@/lib/calendar-locale';
import { parseDate } from '@/lib/dates';

export type MilestoneDueDateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `YYYY-MM-DD` or null */
  value: string | null;
  onChange: (date: string | null) => void;
};

/** Pick or remove a step's due date. A dialog (not a popover), so it can be opened from the "⋯" menu. */
export function MilestoneDueDateDialog({ open, onOpenChange, value, onChange }: MilestoneDueDateDialogProps) {
  const t = useTranslations('planning.milestones');
  const tc = useTranslations('common');
  const locale = useLocale();

  const pick = (date: string | null) => {
    onChange(date);
    onOpenChange(false);
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} title={t('setDueDate')}>
      <div className="flex flex-col items-center gap-4 pb-2">
        <Calendar
          mode="single"
          locale={calendarLocale(locale)}
          selected={value ? parseDate(value) : undefined}
          defaultMonth={value ? parseDate(value) : undefined}
          onSelect={(date) => date && pick(formatDate(date, 'yyyy-MM-dd'))}
          className="rounded-lg border"
        />
        <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" size="touch" onClick={() => onOpenChange(false)}>
            {tc('cancel')}
          </Button>
          {value && (
            <Button type="button" variant="outline" size="touch" onClick={() => pick(null)}>
              {t('removeDueDate')}
            </Button>
          )}
        </div>
      </div>
    </ResponsiveDialog>
  );
}
