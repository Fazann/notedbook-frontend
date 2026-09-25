'use client';

import { CalendarClock, CalendarDays, Trash2 } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useId, useState } from 'react';

import { DataListRowActions } from '@/components/shared/data-list-row-actions';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { utcDate } from '@/lib/dates';
import { todayInTz } from '@/lib/time';
import { cn } from '@/lib/utils';

import { MILESTONE_TITLE_MAX, type Milestone } from '../types';

import { MilestoneDueDateDialog } from './milestone-due-date-dialog';

export type MilestoneItemProps = {
  milestone: Milestone;
  /** Drag handle from SortableList. */
  handle: React.ReactNode;
  /** Not saved yet (temporary id): shown, but can't be changed. */
  isSaving?: boolean;
  onToggle: (isDone: boolean) => void;
  onRename: (title: string) => void;
  onDueDateChange: (dueDate: string | null) => void;
  onDelete: () => void;
};

/**
 * One step: handle · checkbox · title (click or Enter to edit inline) · due date · "⋯" (due date, delete).
 * Done steps are muted and struck through, next to a checked box — never color alone.
 */
export function MilestoneItem({
  milestone,
  handle,
  isSaving,
  onToggle,
  onRename,
  onDueDateChange,
  onDelete,
}: MilestoneItemProps) {
  const t = useTranslations('planning.milestones');
  const format = useFormatter();
  const titleId = useId();
  const hintId = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const [dueOpen, setDueOpen] = useState(false);
  const { title, isDone, dueDate } = milestone;
  const isOverdue = !isDone && dueDate !== null && dueDate < todayInTz();

  const save = () => {
    if (draft === null) return;
    const next = draft.trim();
    setDraft(null);
    if (next && next !== title) onRename(next);
  };

  return (
    <div className={cn('group flex items-start gap-1 rounded-lg pr-1', isSaving && 'opacity-60')}>
      {handle}
      <div className="flex size-11 shrink-0 items-center justify-center">
        <Checkbox
          checked={isDone}
          disabled={isSaving}
          onCheckedChange={(checked) => onToggle(checked === true)}
          aria-labelledby={titleId}
          className="size-5"
        />
      </div>

      <div className="min-w-0 flex-1 py-1.5">
        {draft === null ? (
          <button
            type="button"
            id={titleId}
            disabled={isSaving}
            onClick={() => setDraft(title)}
            aria-describedby={hintId}
            className={cn(
              '-mx-1 block min-h-8 w-full rounded-md px-1 text-left break-words outline-none',
              'focus-visible:ring-ring/50 focus-visible:ring-3 disabled:cursor-default',
              isDone && 'text-muted-foreground line-through'
            )}
          >
            {title}
          </button>
        ) : (
          <Input
            autoFocus
            value={draft}
            maxLength={MILESTONE_TITLE_MAX}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                save();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                setDraft(null);
              }
            }}
            aria-label={t('editTitle')}
            className="h-9 text-base md:text-sm"
          />
        )}
        <span id={hintId} className="sr-only">
          {t('editTitle')}
        </span>
        {dueDate && (
          <span
            className={cn(
              'mt-0.5 flex items-center gap-1 text-xs',
              isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'
            )}
          >
            <CalendarDays className="size-3.5" aria-hidden />
            {t('dueOn', {
              date: format.dateTime(utcDate(dueDate), { day: 'numeric', month: 'short', timeZone: 'UTC' }),
            })}
          </span>
        )}
      </div>

      {!isSaving && (
        <DataListRowActions
          actions={[
            { id: 'due', label: t('setDueDate'), icon: <CalendarClock />, onSelect: () => setDueOpen(true) },
            { id: 'delete', label: t('delete'), icon: <Trash2 />, destructive: true, onSelect: onDelete },
          ]}
        />
      )}

      <MilestoneDueDateDialog open={dueOpen} onOpenChange={setDueOpen} value={dueDate} onChange={onDueDateChange} />
    </div>
  );
}
