'use client';

import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { todayInTz } from '@/lib/time';
import { cn } from '@/lib/utils';

import { useCreateColumn, useMoveCard } from '../hooks';
import { COLUMN_NAME_MAX, type Board, type Card } from '../types';
import { dropTarget, findCardColumn, isDoneColumn, parseDndId, placeCard, planMove } from '../utils';

import { BoardCardView } from './board-card';
import { BoardColumn } from './board-column';
import { CardDialog } from './card-dialog';
import { NameFormDialog } from './name-form-dialog';

export type KanbanBoardProps = { board: Board };

/**
 * The columns side by side (snap-scrolling one at a time on phones) with cards that move by drag and drop:
 * mouse, touch (hold briefly so swiping still scrolls) or keyboard. While dragging, a local preview moves the card
 * between columns; on drop only that card's new column and position are sent (`PATCH /cards/:id/move`).
 */
export function KanbanBoard({ board }: KanbanBoardProps) {
  const t = useTranslations('board');
  const move = useMoveCard(board.id);
  const createColumn = useCreateColumn(board.id);
  const today = todayInTz();
  const [preview, setPreview] = useState<Board | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [openCardId, setOpenCardId] = useState<number | null>(null);
  const [addingColumn, setAddingColumn] = useState(false);
  const shown = preview ?? board;

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const cardOf = (b: Board, id: number) => b.columns.flatMap((c) => c.cards).find((c) => c.id === id);
  const activeCard = activeId === null ? undefined : cardOf(shown, activeId);
  const openCard = openCardId === null ? null : (cardOf(board, openCardId) ?? null);

  const onDragStart = ({ active }: DragStartEvent) => {
    const card = parseDndId(active.id);
    if (card?.kind !== 'card') return;
    setActiveId(card.id);
    setPreview(board);
  };

  // Across columns, the preview moves the card as soon as it is over the other column (same column: dnd-kit animates).
  const onDragOver = ({ active, over }: DragOverEvent) => {
    const card = parseDndId(active.id);
    if (!over || card?.kind !== 'card') return;
    setPreview((current) => {
      if (!current) return current;
      const to = dropTarget(current, over.id);
      const from = findCardColumn(current, card.id);
      if (!to || !from || to.columnId === from.id) return current;
      return placeCard(current, card.id, to.columnId, to.index);
    });
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const card = parseDndId(active.id);
    const current = preview;
    setPreview(null);
    setActiveId(null);
    if (!over || !current || card?.kind !== 'card') return;

    const drop = planMove(board, current, card.id, over.id);
    if (!drop) return;
    move.mutate(
      { id: card.id, columnId: drop.columnId, position: drop.position },
      { onError: () => void toast.error(t('moveError')) }
    );
  };

  const onDragCancel = () => {
    setPreview(null);
    setActiveId(null);
  };

  /** Screen-reader text for each step, from the preview so it names the column the card is in now. */
  const describe = (id: UniqueIdentifier, b: Board) => {
    const card = parseDndId(id);
    const column = card ? findCardColumn(b, card.id) : undefined;
    const item = card ? cardOf(b, card.id) : undefined;
    const index = column && card ? column.cards.findIndex((c) => c.id === card.id) : -1;
    return {
      title: item?.title ?? '',
      column: column?.name ?? '',
      position: index + 1,
      total: column?.cards.length ?? 0,
    };
  };
  const announcements: Announcements = {
    onDragStart: ({ active }) => t('dnd.picked', describe(active.id, board)),
    onDragOver: ({ active, over }) => (over ? t('dnd.over', describe(active.id, preview ?? board)) : undefined),
    onDragEnd: ({ active, over }) => {
      if (!over) return t('dnd.cancelled', { title: describe(active.id, board).title });
      const placed = preview ?? board;
      const to = dropTarget(placed, over.id);
      const id = parseDndId(active.id)?.id;
      return to && id !== undefined
        ? t('dnd.dropped', describe(active.id, placeCard(placed, id, to.columnId, to.index)))
        : undefined;
    },
    onDragCancel: ({ active }) => t('dnd.cancelled', { title: describe(active.id, board).title }),
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
        accessibility={{ announcements, screenReaderInstructions: { draggable: t('dnd.instructions') } }}
      >
        {/* The one place horizontal scrolling is allowed; it bleeds to the screen edges on phones. */}
        <div
          className={cn(
            '-mx-4 snap-x snap-mandatory overflow-x-auto px-4 pb-4',
            'md:-mx-6 md:snap-none md:px-6 lg:-mx-8 lg:px-8'
          )}
        >
          <div className="flex items-start gap-3 md:gap-4">
            {shown.columns.map((column) => (
              <BoardColumn
                key={column.id}
                boardId={board.id}
                column={column}
                done={isDoneColumn(shown, column.id)}
                today={today}
                onOpenCard={(card: Card) => setOpenCardId(card.id)}
              />
            ))}
            <div className="w-[85vw] max-w-sm shrink-0 snap-start md:w-72">
              <Button
                variant="outline"
                size="touch"
                className="text-muted-foreground w-full justify-start border-dashed"
                onClick={() => setAddingColumn(true)}
              >
                <Plus aria-hidden />
                {t('column.add')}
              </Button>
            </div>
          </div>
        </div>
        <DragOverlay>
          {activeCard && (
            <BoardCardView
              card={activeCard}
              done={isDoneColumn(shown, activeCard.column_id)}
              today={today}
              className="rotate-2 shadow-lg"
            />
          )}
        </DragOverlay>
      </DndContext>

      <CardDialog boardId={board.id} card={openCard} onClose={() => setOpenCardId(null)} />
      <NameFormDialog
        open={addingColumn}
        onOpenChange={setAddingColumn}
        title={t('column.add')}
        label={t('column.name')}
        placeholder={t('column.namePlaceholder')}
        submitLabel={t('column.add')}
        max={COLUMN_NAME_MAX}
        onSubmit={(name) =>
          createColumn.mutateAsync(name).catch((error: unknown) => {
            toast.error(t('saveError'));
            throw error;
          })
        }
      />
    </>
  );
}
