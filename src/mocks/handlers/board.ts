import { addDays, format } from 'date-fns';

import type { BoardListItem, DueCard } from '@/features/board/types';

import { db } from '../db';
import { copy, delay } from '../delay';

export async function listBoards(): Promise<BoardListItem[]> {
  await delay();
  return db.boards.map((b) => ({
    id: b.id,
    name: b.name,
    card_count: b.columns.reduce((n, c) => n + c.cards.length, 0),
  }));
}

/**
 * Cards with a due date up to `days` from today (overdue included), from all boards,
 * skipping the last column of each board (treated as "Done").
 */
export async function listDueCards(days: number): Promise<DueCard[]> {
  await delay();
  const until = format(addDays(new Date(), days), 'yyyy-MM-dd');
  const result: DueCard[] = [];
  for (const board of db.boards) {
    const open = [...board.columns].sort((a, b) => a.position - b.position).slice(0, -1);
    for (const column of open) {
      for (const card of column.cards) {
        if (card.due_date && card.due_date <= until) {
          result.push({ ...card, board_id: board.id, board_name: board.name, column_name: column.name });
        }
      }
    }
  }
  return copy(result);
}
