import { calcPosition } from '@/lib/position';

import type { Board, Card, CardFormValues, CardInput } from './types';

export { calcPosition };

const byPosition = (a: { position: number; id: number }, b: { position: number; id: number }) =>
  a.position - b.position || a.id - b.id;

/** Drag-and-drop ids: cards and columns share one DndContext, so they need distinct ids. */
export const cardDndId = (id: number) => `card-${id}`;
export const columnDndId = (id: number) => `column-${id}`;
export const parseDndId = (id: string | number): { kind: 'card' | 'column'; id: number } | null => {
  const match = /^(card|column)-(-?\d+)$/.exec(String(id));
  return match ? { kind: match[1] as 'card' | 'column', id: Number(match[2]) } : null;
};

/** The column a card is in, or undefined. */
export function findCardColumn(board: Board, cardId: number) {
  return board.columns.find((c) => c.cards.some((card) => card.id === cardId));
}

/**
 * The board with card `cardId` moved to column `toColumnId` at `toIndex` (index among that column's other cards),
 * for the drag preview. Positions are left alone; `dropPosition` computes the real one.
 */
export function placeCard(board: Board, cardId: number, toColumnId: number, toIndex: number): Board {
  const card = board.columns.flatMap((c) => c.cards).find((c) => c.id === cardId);
  if (!card) return board;
  return {
    ...board,
    columns: board.columns.map((column) => {
      const rest = column.cards.filter((c) => c.id !== cardId);
      if (column.id !== toColumnId) return rest.length === column.cards.length ? column : { ...column, cards: rest };
      const index = Math.max(0, Math.min(toIndex, rest.length));
      return {
        ...column,
        cards: [...rest.slice(0, index), { ...card, column_id: toColumnId }, ...rest.slice(index)],
      };
    }),
  };
}

/**
 * Position for card `cardId` where it now sits in `board` (after `placeCard`): between its neighbours
 * (see `calcPosition`), so only this card needs to be sent to the API.
 */
export function dropPosition(board: Board, cardId: number): { columnId: number; position: number } | null {
  const column = findCardColumn(board, cardId);
  if (!column) return null;
  const index = column.cards.findIndex((c) => c.id === cardId);
  return {
    columnId: column.id,
    position: calcPosition(column.cards[index - 1]?.position, column.cards[index + 1]?.position),
  };
}

/** The board with the card moved to `position` in column `columnId`, each column sorted (the optimistic update). */
export function moveCardInBoard(board: Board, cardId: number, columnId: number, position: number): Board {
  const card = board.columns.flatMap((c) => c.cards).find((c) => c.id === cardId);
  if (!card) return board;
  const moved: Card = { ...card, column_id: columnId, position };
  return {
    ...board,
    columns: board.columns.map((column) => {
      const rest = column.cards.filter((c) => c.id !== cardId);
      const cards = column.id === columnId ? [...rest, moved].sort(byPosition) : rest;
      return { ...column, cards };
    }),
  };
}

/** The board with one card replaced (or removed when `card` is null). */
export function replaceCard(board: Board, cardId: number, card: Card | null): Board {
  return {
    ...board,
    columns: board.columns.map((column) => ({
      ...column,
      cards: column.cards.flatMap((c) => (c.id !== cardId ? [c] : card ? [card] : [])),
    })),
  };
}

/** The last column counts as "Done" (its cards are never overdue). */
export const isDoneColumn = (board: Board, columnId: number) => board.columns.at(-1)?.id === columnId;

/** Overdue: due before `today` (plain dates compare as strings) and not done. */
export const isOverdue = (dueDate: string | null, today: string, done: boolean) =>
  !done && dueDate !== null && dueDate < today;

export const cardToForm = (card: Card): CardFormValues => ({
  title: card.title,
  description: card.description,
  due_date: card.due_date ?? '',
  label: card.label,
});

export const formToCardInput = (values: CardFormValues): CardInput => ({
  title: values.title.trim(),
  description: values.description.trim(),
  due_date: values.due_date || null,
  label: values.label,
});

/** Where a drop on `overId` (a card or a column) lands in `board`: the column, and the index the card takes there. */
export function dropTarget(board: Board, overId: string | number): { columnId: number; index: number } | null {
  const over = parseDndId(overId);
  if (!over) return null;
  if (over.kind === 'column') {
    const column = board.columns.find((c) => c.id === over.id);
    return column ? { columnId: column.id, index: column.cards.length } : null;
  }
  const column = findCardColumn(board, over.id);
  return column ? { columnId: column.id, index: column.cards.findIndex((c) => c.id === over.id) } : null;
}

/**
 * The move to send when card `cardId` is dropped on `overId`: `original` is the board before the drag, `current` the
 * drag preview (the card may already be in another column). Null when nothing changed.
 */
export function planMove(
  original: Board,
  current: Board,
  cardId: number,
  overId: string | number
): { columnId: number; position: number } | null {
  const to = dropTarget(current, overId);
  const from = findCardColumn(original, cardId);
  if (!to || !from) return null;
  const placed = placeCard(current, cardId, to.columnId, to.index);
  const drop = dropPosition(placed, cardId);
  if (!drop) return null;
  const before = from.cards.findIndex((c) => c.id === cardId);
  const after = placed.columns.find((c) => c.id === drop.columnId)?.cards.findIndex((c) => c.id === cardId);
  return from.id === drop.columnId && before === after ? null : drop;
}
