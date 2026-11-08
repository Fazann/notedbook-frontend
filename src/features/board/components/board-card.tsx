'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CalendarDays, CircleAlert, GripVertical, TextAlignStart } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useFormatTime } from '@/hooks/use-format-time';
import { cn } from '@/lib/utils';

import type { Card } from '../types';
import { cardDndId, isOverdue } from '../utils';

import { CardLabel } from './card-label';

export type BoardCardViewProps = {
  card: Card;
  /** In the last ("Done") column: never overdue. */
  done: boolean;
  /** `YYYY-MM-DD` */
  today: string;
  /** The drag handle (left edge); omitted in the drag overlay. */
  handle?: React.ReactNode;
  onOpen?: () => void;
  className?: string;
};

/** What a card shows: title, label, due date (red with an icon when overdue) and a hint that it has a description. */
export function BoardCardView({ card, done, today, handle, onOpen, className }: BoardCardViewProps) {
  const t = useTranslations('board.card');
  const formatTime = useFormatTime();
  const overdue = isOverdue(card.due_date, today, done);
  const saving = card.id < 0;

  return (
    <div className={cn('bg-card flex min-w-0 rounded-lg border shadow-xs', saving && 'opacity-60', className)}>
      {handle}
      <button
        type="button"
        onClick={onOpen}
        disabled={!onOpen || saving}
        className={cn(
          'min-w-0 flex-1 space-y-2 rounded-r-lg py-2.5 pr-3 text-left outline-none',
          'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-inset enabled:hover:bg-accent/40',
          !handle && 'pl-3'
        )}
      >
        <span className="block leading-relaxed font-medium break-words">{card.title}</span>
        {(card.label || card.due_date || card.description || saving) && (
          <span className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            {card.label && <CardLabel label={card.label} />}
            {card.due_date && (
              <span className={cn('inline-flex items-center gap-1', overdue && 'text-destructive font-medium')}>
                {overdue ? (
                  <CircleAlert className="size-3.5" aria-hidden />
                ) : (
                  <CalendarDays className="size-3.5" aria-hidden />
                )}
                {t(overdue ? 'overdue' : 'due', {
                  date: formatTime.date(card.due_date, { day: 'numeric', month: 'short' }),
                })}
              </span>
            )}
            {card.description && (
              <span className="inline-flex">
                <TextAlignStart className="size-3.5" aria-hidden />
                <span className="sr-only">{t('description')}</span>
              </span>
            )}
            {saving && <span>{t('saving')}</span>}
          </span>
        )}
      </button>
    </div>
  );
}

export type SortableBoardCardProps = Omit<BoardCardViewProps, 'handle' | 'className'> & { columnId: number };

/**
 * A card that can be dragged by its grip (mouse, touch with a short hold, or keyboard: space / enter, arrows,
 * space / enter). Tapping the rest of the card opens it. Unsaved cards (temporary negative id) can't be dragged yet.
 */
export function SortableBoardCard({ columnId, ...props }: SortableBoardCardProps) {
  const t = useTranslations('board.card');
  const { card } = props;
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: cardDndId(card.id),
    data: { type: 'card', columnId },
    disabled: card.id < 0,
  });

  return (
    <li
      ref={setNodeRef}
      // dnd-kit positions the card with an inline transform (the one place inline styles are allowed).
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn('touch-manipulation', isDragging && 'opacity-40')}
    >
      <BoardCardView
        {...props}
        handle={
          <button
            type="button"
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            aria-label={t('dragHandle', { title: card.title })}
            disabled={card.id < 0}
            className={cn(
              'text-muted-foreground flex w-9 shrink-0 cursor-grab touch-none items-start justify-center rounded-l-lg',
              'pt-3 outline-none focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-inset',
              'active:cursor-grabbing',
              'disabled:cursor-default'
            )}
          >
            <GripVertical className="size-4" aria-hidden />
          </button>
        }
      />
    </li>
  );
}
