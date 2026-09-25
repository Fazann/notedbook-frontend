'use client';

import { Plus } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

import { DatePicker } from '@/components/shared/date-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { utcDate } from '@/lib/dates';
import { cn } from '@/lib/utils';

import { nextTempMilestoneId, useAddMilestone } from '../hooks';
import { MILESTONE_TITLE_MAX } from '../types';

export type MilestoneAddInputProps = { goalId: number; autoFocus?: boolean; className?: string };

/**
 * "Add a step…": Enter adds and keeps focus for fast entry, Esc clears, an empty input does nothing.
 * Optional due date from the small calendar button.
 */
export function MilestoneAddInput({ goalId, autoFocus, className }: MilestoneAddInputProps) {
  const t = useTranslations('planning');
  const format = useFormatter();
  const add = useAddMilestone(goalId);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState<string | null>(null);

  const submit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    add.mutate(
      { input: { title: trimmed, dueDate }, tempId: nextTempMilestoneId() },
      { onError: () => toast.error(t('toast.error')) }
    );
    setTitle('');
    setDueDate(null);
  };

  return (
    <form
      className={cn('flex items-center gap-1', className)}
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && title) {
            e.preventDefault();
            setTitle('');
          }
        }}
        placeholder={t('milestones.addPlaceholder')}
        aria-label={t('milestones.add')}
        maxLength={MILESTONE_TITLE_MAX}
        autoFocus={autoFocus}
        enterKeyHint="done"
        className="h-11 flex-1 text-base md:h-9 md:text-sm"
      />
      <DatePicker
        iconOnly
        value={dueDate ?? ''}
        onChange={setDueDate}
        placeholder={
          dueDate
            ? t('milestones.dueOn', {
                date: format.dateTime(utcDate(dueDate), { day: 'numeric', month: 'short', timeZone: 'UTC' }),
              })
            : t('milestones.setDueDate')
        }
      />
      <Button type="submit" size="icon-touch" aria-label={t('milestones.add')} disabled={!title.trim()}>
        <Plus aria-hidden />
      </Button>
    </form>
  );
}
