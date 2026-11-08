import { z } from 'zod';

import {
  type Board,
  type BoardListItem,
  boardListItemSchema,
  boardSchema,
  type Card,
  type CardInput,
  cardSchema,
  type Column,
  columnSchema,
  type DueCard,
} from '@/features/board/types';

import { apiCall } from '../core/api-call';
import { ApiEndpoint, buildPath } from '../core/api-endpoints';

export async function listBoards(): Promise<BoardListItem[]> {
  return z.array(boardListItemSchema).parse(await apiCall.get(ApiEndpoint.Boards));
}

export function listDueCards(days: number): Promise<DueCard[]> {
  return apiCall.get(ApiEndpoint.CardsDue, { days });
}

/** The board with its columns and cards, each sorted by position. */
export async function getBoard(id: number): Promise<Board> {
  return boardSchema.parse(await apiCall.get(buildPath(ApiEndpoint.BoardDetail, { id })));
}

/** `columns`: the names to start with, left to right, in the user's language. */
export async function createBoard(input: { name: string; columns: string[] }): Promise<Board> {
  return boardSchema.parse(await apiCall.post(ApiEndpoint.Boards, input));
}

export async function renameBoard(id: number, name: string): Promise<Board> {
  return boardSchema.parse(await apiCall.put(buildPath(ApiEndpoint.BoardDetail, { id }), { name }));
}

export function deleteBoard(id: number): Promise<void> {
  return apiCall.delete(buildPath(ApiEndpoint.BoardDetail, { id }));
}

export async function createColumn(boardId: number, name: string): Promise<Column> {
  return columnSchema.parse(await apiCall.post(buildPath(ApiEndpoint.BoardColumns, { id: boardId }), { name }));
}

export async function renameColumn(id: number, name: string): Promise<Column> {
  return columnSchema.parse(await apiCall.put(buildPath(ApiEndpoint.ColumnDetail, { id }), { name }));
}

export function deleteColumn(id: number): Promise<void> {
  return apiCall.delete(buildPath(ApiEndpoint.ColumnDetail, { id }));
}

export async function createCard(columnId: number, input: CardInput): Promise<Card> {
  return cardSchema.parse(await apiCall.post(buildPath(ApiEndpoint.ColumnCards, { id: columnId }), input));
}

export async function updateCard(id: number, input: CardInput): Promise<Card> {
  return cardSchema.parse(await apiCall.put(buildPath(ApiEndpoint.CardDetail, { id }), input));
}

/** Only the target column and the new position: never the whole board. */
export async function moveCard(id: number, columnId: number, position: number): Promise<Card> {
  return cardSchema.parse(
    await apiCall.patch(buildPath(ApiEndpoint.CardMove, { id }), { column_id: columnId, position })
  );
}

export function deleteCard(id: number): Promise<void> {
  return apiCall.delete(buildPath(ApiEndpoint.CardDetail, { id }));
}
