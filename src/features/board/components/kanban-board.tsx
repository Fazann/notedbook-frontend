'use client';

import {
  closestCenter,
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
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
import { dropTarget, findCardColumn, isDoneColumn, moveCardInBoard, parseDndId, placeCard, planMove } from '../utils';

import { BoardCardView } from './board-card';
import { BoardColumn } from './board-column';
import { CardDialog } from './card-dialog';
import { NameFormDialog } from './name-form-dialog';

export type KanbanBoardProps = { board: Board };

/**
 * The columns side by side (snap-scrolling one at a time on phones) with cards that move by drag and drop: mouse,
 * touch (on the grip; swiping elsewhere still scrolls) or keyboard. While dragging, a local preview moves the card
 * between columns; on drop only that card's new column and position are sent (`PATCH /cards/:id/move`).
 */
export function KanbanBoard({ board }: KanbanBoardProps) {
  const t = useTranslations('board');
  const move = useMoveCard(board.id);
  const createColumn = useCreateColumn(board.id);
  const today = todayInTz();
  // The drag preview, tied to the board it was made from: once the cache has the move (a new `board`), it gives
  // way.
  // Keeping it after the drop avoids a frame where the card jumps back before the optimistic update lands.
  const [preview, setPreview] = useState<{ base: Board; board: Board } | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [openCardId, setOpenCardId] = useState<number | null>(null);
  const [addingColumn, setAddingColumn] = useState(false);
  const shown = preview?.base === board ? preview.board : board;

  // Pointer events, not mouse events: Chrome can skip `mouseup` after a drag (only `pointerup` arrives), which left a
  // MouseSensor drag stuck. Drags start only from the grip (`touch-action: none`), so swiping elsewhere still scrolls.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const cardOf = (b: Board, id: number) => b.columns.flatMap((c) => c.cards).find((c) => c.id === id);
  const activeCard = activeId === null ? undefined : cardOf(shown, activeId);
  const openCard = openCardId === null ? null : (cardOf(board, openCardId) ?? null);

  const onDragStart = ({ active }: DragStartEvent) => {
    const card = parseDndId(active.id);
    if (card?.kind !== 'card') return;
    setActiveId(card.id);
    setPreview({ base: board, board });
  };

  // Across columns, the preview moves the card as soon as it is over the other column (same column: dnd-kit animates).
  const onDragOver = ({ active, over }: DragOverEvent) => {
    const card = parseDndId(active.id);
    if (!over || card?.kind !== 'card') return;
    setPreview((current) => {
      if (!current) return current;
      const to = dropTarget(current.board, over.id);
      const from = findCardColumn(current.board, card.id);
      if (!to || !from || to.columnId === from.id) return current;
      return { ...current, board: placeCard(current.board, card.id, to.columnId, to.index) };
    });
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const card = parseDndId(active.id);
    const current = preview?.base === board ? preview.board : null;
    setActiveId(null);
    const drop = over && current && card?.kind === 'card' ? planMove(board, current, card.id, over.id) : null;
    if (!drop || card?.kind !== 'card') {
      setPreview(null);
      return;
    }
    setPreview({ base: board, board: moveCardInBoard(board, card.id, drop.columnId, drop.position) });
    move.mutate(
      { id: card.id, columnId: drop.columnId, position: drop.position },
      {
        onError: () => void toast.error(t('moveError')),
        // The rollback restores the very board the preview was made from, so drop the preview or it would hide it.
        onSettled: () => setPreview(null),
      }
    );
  };

  /**
   * What the card is over: what is under the pointer (keyboard: what the card overlaps). The nearest card under it
   * wins; an empty column takes the drop itself; anywhere else (below the last card, between columns) the nearest
   * target by corners.
   */
  const collisionDetection: CollisionDetection = (args) => {
    const hits = args.pointerCoordinates ? pointerWithin(args) : rectIntersection(args);
    const among = (ids: Set<string>) =>
      closestCenter({ ...args, droppableContainers: args.droppableContainers.filter((c) => ids.has(String(c.id))) });

    const cardHits = hits.filter((h) => parseDndId(h.id)?.kind === 'card');
    if (cardHits.length > 0) return among(new Set(cardHits.map((h) => String(h.id))));

    // Only empty columns are droppable themselves (see BoardColumn).
    const columnHits = hits.filter((h) => parseDndId(h.id)?.kind === 'column');
    if (columnHits.length > 0) return columnHits;

    // Below the last card of a column, or between columns: the nearest card or empty column.
    return closestCorners(args);
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
    onDragOver: ({ active, over }) => (over ? t('dnd.over', describe(active.id, shown)) : undefined),
    onDragEnd: ({ active, over }) => {
      if (!over) return t('dnd.cancelled', { title: describe(active.id, board).title });
      const placed = shown;
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
        collisionDetection={collisionDetection}
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
