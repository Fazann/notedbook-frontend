'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CircleCheck, Ellipsis, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

import { nextTempCardId, useCreateCard, useDeleteColumn, useRenameColumn } from '../hooks';
import { CARD_TITLE_MAX, COLUMN_NAME_MAX, type Card, type Column } from '../types';
import { cardDndId, columnDndId } from '../utils';

import { SortableBoardCard } from './board-card';
import { NameFormDialog } from './name-form-dialog';

export type BoardColumnProps = {
  boardId: number;
  column: Column;
  /** The last column: its cards count as done. */
  done: boolean;
  /** `YYYY-MM-DD` */
  today: string;
  onOpenCard: (card: Card) => void;
};

/** One kanban column: its cards (sortable, and a drop target even when empty), "Add card" and a "⋯" menu. */
export function BoardColumn({ boardId, column, done, today, onOpenCard }: BoardColumnProps) {
  const t = useTranslations('board');
  const tCommon = useTranslations('common');
  const rename = useRenameColumn(boardId);
  const remove = useDeleteColumn(boardId);
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // The column itself is a drop target only while empty: with cards, drops land relative to a card. Otherwise its
  // area (just below the first card) would be the "next item down" for keyboard moves and swallow ArrowDown.
  const { setNodeRef, isOver } = useDroppable({
    id: columnDndId(column.id),
    data: { type: 'column' },
    disabled: column.cards.length > 0,
  });
  const headingId = `board-column-${column.id}`;

  return (
    <section
      aria-labelledby={headingId}
      className="bg-muted/50 flex w-[85vw] max-w-sm shrink-0 snap-start flex-col rounded-xl border md:w-72"
    >
      <header className="flex items-center gap-2 py-1.5 pr-1 pl-3">
        <h2 id={headingId} className="min-w-0 flex-1 leading-relaxed font-semibold break-words">
          {column.name}
        </h2>
        {done && (
          <span title={t('column.doneHint')} className="text-muted-foreground flex">
            <CircleCheck className="size-4" aria-hidden />
            <span className="sr-only">{t('column.doneHint')}</span>
          </span>
        )}
        <Badge variant="secondary" className="tabular-nums">
          {column.cards.length}
        </Badge>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-touch" aria-label={t('column.actions', { name: column.name })}>
              <Ellipsis aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="min-h-11" onSelect={() => setRenaming(true)}>
              {t('column.rename')}
            </DropdownMenuItem>
            <DropdownMenuItem className="min-h-11" variant="destructive" onSelect={() => setDeleting(true)}>
              {t('column.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <SortableContext items={column.cards.map((c) => cardDndId(c.id))} strategy={verticalListSortingStrategy}>
        <ul
          ref={setNodeRef}
          aria-labelledby={headingId}
          className={cn(
            'flex min-h-16 flex-col gap-2 rounded-lg px-2 pb-2 transition-colors',
            isOver && column.cards.length === 0 && 'bg-primary/5'
          )}
        >
          {column.cards.map((card) => (
            <SortableBoardCard
              key={card.id}
              card={card}
              columnId={column.id}
              done={done}
              today={today}
              onOpen={() => onOpenCard(card)}
            />
          ))}
          {column.cards.length === 0 && (
            <li className="text-muted-foreground rounded-lg border border-dashed px-3 py-4 text-center text-sm">
              {t('column.empty')}
            </li>
          )}
        </ul>
      </SortableContext>

      <AddCard boardId={boardId} columnId={column.id} />

      <NameFormDialog
        open={renaming}
        onOpenChange={setRenaming}
        title={t('column.rename')}
        label={t('column.name')}
        submitLabel={tCommon('save')}
        initialName={column.name}
        max={COLUMN_NAME_MAX}
        onSubmit={(name) =>
          rename.mutateAsync({ id: column.id, name }).catch((error: unknown) => {
            toast.error(t('saveError'));
            throw error;
          })
        }
      />
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title={t('column.deleteTitle', { name: column.name })}
        description={t('column.deleteDescription', { count: column.cards.length })}
        confirmLabel={t('column.delete')}
        destructive
        onConfirm={() =>
          remove.mutateAsync(column.id).then(
            () => void toast.success(t('toast.columnDeleted')),
            () => void toast.error(t('saveError'))
          )
        }
      />
    </section>
  );
}

/**
 * "Add card": a button that turns into a text box. Enter adds the card (shown at once, saved in the background) and
 * keeps the box open for the next one; Escape or an empty blur closes it.
 */
function AddCard({ boardId, columnId }: { boardId: number; columnId: number }) {
  const t = useTranslations('board');
  const tCommon = useTranslations('common');
  const create = useCreateCard(boardId);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');

  const add = () => {
    const value = title.trim();
    if (!value) return;
    create.mutate(
      { columnId, tempId: nextTempCardId(), input: { title: value, description: '', due_date: null, label: null } },
      { onError: () => void toast.error(t('saveError')) }
    );
    setTitle('');
  };

  if (!open) {
    return (
      <div className="px-2 pb-2">
        <Button
          variant="ghost"
          size="touch"
          className="text-muted-foreground w-full justify-start"
          onClick={() => setOpen(true)}
        >
          <Plus aria-hidden />
          {t('card.add')}
        </Button>
      </div>
    );
  }

  return (
    <form
      className="space-y-2 px-2 pb-2"
      onSubmit={(e) => {
        e.preventDefault();
        add();
      }}
    >
      <Textarea
        autoFocus
        value={title}
        maxLength={CARD_TITLE_MAX}
        rows={2}
        aria-label={t('card.title')}
        placeholder={t('card.titlePlaceholder')}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            add();
          } else if (e.key === 'Escape') {
            setTitle('');
            setOpen(false);
          }
        }}
        onBlur={() => !title.trim() && setOpen(false)}
        className="bg-card min-h-16 resize-none"
      />
      <div className="flex gap-2">
        <Button type="submit" size="touch" disabled={!title.trim()}>
          {t('card.add')}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="touch"
          onClick={() => {
            setTitle('');
            setOpen(false);
          }}
        >
          {tCommon('cancel')}
        </Button>
      </div>
    </form>
  );
}
