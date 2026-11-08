import { describe, expect, it } from 'vitest';

import type { Board, Card } from './types';
import {
  calcPosition,
  cardDndId,
  columnDndId,
  dropTarget,
  formToCardInput,
  isOverdue,
  moveCardInBoard,
  parseDndId,
  placeCard,
  planMove,
  replaceCard,
} from './utils';

const card = (id: number, columnId: number, position: number): Card => ({
  id,
  column_id: columnId,
  title: `Card ${id}`,
  description: '',
  due_date: null,
  label: null,
  position,
});

// To do: 1 (1000), 2 (2000), 3 (3000) · Doing: 4 (1000) · Done: empty
const board: Board = {
  id: 1,
  name: 'Trip',
  columns: [
    {
      id: 10,
      board_id: 1,
      name: 'To do',
      position: 1000,
      cards: [card(1, 10, 1000), card(2, 10, 2000), card(3, 10, 3000)],
    },
    { id: 20, board_id: 1, name: 'Doing', position: 2000, cards: [card(4, 20, 1000)] },
    { id: 30, board_id: 1, name: 'Done', position: 3000, cards: [] },
  ],
};

const ids = (b: Board, columnId: number) => b.columns.find((c) => c.id === columnId)?.cards.map((c) => c.id);

describe('calcPosition (AGENTS.md rules)', () => {
  it('takes the midpoint, or ±1000 at the ends, or 1000 in an empty column', () => {
    expect(calcPosition(1000, 2000)).toBe(1500);
    expect(calcPosition(undefined, 1000)).toBe(0);
    expect(calcPosition(3000, undefined)).toBe(4000);
    expect(calcPosition()).toBe(1000);
  });
});

describe('dnd ids', () => {
  it('round-trips card and column ids, including temporary negative ones', () => {
    expect(parseDndId(cardDndId(7))).toEqual({ kind: 'card', id: 7 });
    expect(parseDndId(columnDndId(30))).toEqual({ kind: 'column', id: 30 });
    expect(parseDndId(cardDndId(-2))).toEqual({ kind: 'card', id: -2 });
    expect(parseDndId('something')).toBeNull();
  });
});

describe('dropTarget / placeCard', () => {
  it('drops on a card at its index, on a column at the end', () => {
    expect(dropTarget(board, cardDndId(2))).toEqual({ columnId: 10, index: 1 });
    expect(dropTarget(board, columnDndId(30))).toEqual({ columnId: 30, index: 0 });
  });

  it('moves a card into another column at an index without touching positions', () => {
    const placed = placeCard(board, 1, 20, 0);
    expect(ids(placed, 10)).toEqual([2, 3]);
    expect(ids(placed, 20)).toEqual([1, 4]);
    expect(placed.columns[1].cards[0]).toMatchObject({ id: 1, column_id: 20, position: 1000 });
  });
});

describe('planMove', () => {
  it('moves down within a column, between the new neighbours', () => {
    // Card 1 dropped on card 2: order 2, 1, 3 → between 2000 and 3000.
    expect(planMove(board, board, 1, cardDndId(2))).toEqual({ columnId: 10, position: 2500 });
  });

  it('moves up within a column to the top', () => {
    expect(planMove(board, board, 3, cardDndId(1))).toEqual({ columnId: 10, position: 0 });
  });

  it('moves into an empty column at 1000', () => {
    expect(planMove(board, board, 2, columnDndId(30))).toEqual({ columnId: 30, position: 1000 });
  });

  it('uses the drag preview when the card already crossed columns', () => {
    const preview = placeCard(board, 3, 20, 1); // after card 4
    expect(planMove(board, preview, 3, cardDndId(3))).toEqual({ columnId: 20, position: 2000 });
  });

  it('sends nothing when the card is dropped where it was', () => {
    expect(planMove(board, board, 2, cardDndId(2))).toBeNull();
  });
});

describe('optimistic helpers', () => {
  it('moveCardInBoard puts the card at its position and keeps columns sorted', () => {
    const moved = moveCardInBoard(board, 3, 10, 1500);
    expect(ids(moved, 10)).toEqual([1, 3, 2]);
    expect(moveCardInBoard(board, 1, 30, 1000).columns[2].cards).toMatchObject([{ id: 1, column_id: 30 }]);
  });

  it('replaceCard swaps a temporary card for the saved one, or removes it', () => {
    const withTemp = { ...board, columns: [{ ...board.columns[0], cards: [card(-1, 10, 4000)] }] };
    expect(replaceCard(withTemp, -1, card(99, 10, 4000)).columns[0].cards.map((c) => c.id)).toEqual([99]);
    expect(replaceCard(board, 1, null).columns[0].cards.map((c) => c.id)).toEqual([2, 3]);
  });
});

describe('isOverdue / formToCardInput', () => {
  it('is overdue only before today and outside the Done column', () => {
    expect(isOverdue('2026-11-07', '2026-11-08', false)).toBe(true);
    expect(isOverdue('2026-11-08', '2026-11-08', false)).toBe(false);
    expect(isOverdue('2026-11-07', '2026-11-08', true)).toBe(false);
    expect(isOverdue(null, '2026-11-08', false)).toBe(false);
  });

  it('trims text and sends null for an empty due date', () => {
    expect(formToCardInput({ title: ' Pack ', description: ' ', due_date: '', label: 'red' })).toEqual({
      title: 'Pack',
      description: '',
      due_date: null,
      label: 'red',
    });
  });
});
