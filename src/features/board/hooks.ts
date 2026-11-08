'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { qk } from '@/lib/query-keys';
import * as api from '@/services/board/board-service';

import type { Board, BoardListItem, Card, CardInput } from './types';
import { moveCardInBoard, replaceCard } from './utils';

export function useBoards() {
  return useQuery({ queryKey: qk.boards.list(), queryFn: api.listBoards });
}

export function useDueCards(days: number) {
  return useQuery({ queryKey: qk.boards.dueCards(days), queryFn: () => api.listDueCards(days) });
}

export function useBoard(id: number) {
  return useQuery({ queryKey: qk.boards.detail(id), queryFn: () => api.getBoard(id) });
}

export function useCreateBoard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; columns: string[] }) => api.createBoard(input),
    onSuccess: (board) => queryClient.setQueryData(qk.boards.detail(board.id), board),
    onSettled: () => queryClient.invalidateQueries({ queryKey: qk.boards.list() }),
  });
}

/** Optimistic: the board leaves the list at once and comes back if the API refuses. */
export function useDeleteBoard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteBoard(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: qk.boards.list() });
      const previous = queryClient.getQueryData<BoardListItem[]>(qk.boards.list());
      queryClient.setQueryData<BoardListItem[]>(qk.boards.list(), (list) => list?.filter((b) => b.id !== id));
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) queryClient.setQueryData(qk.boards.list(), context.previous);
    },
    onSuccess: (_data, id) => queryClient.removeQueries({ queryKey: qk.boards.detail(id) }),
    // Due cards on the dashboard may have come from this board.
    onSettled: () => queryClient.invalidateQueries({ queryKey: qk.boards.all }),
  });
}

/** One key per board, so a refresh waits until the last pending change on it is done (no flicker mid-drag). */
const boardMutationKey = (id: number) => ['boards', 'mutate', id] as const;

/** Shared optimistic plumbing for changes inside one board: apply, roll back, refresh once at the end. */
function useBoardCache(boardId: number) {
  const queryClient = useQueryClient();
  const key = qk.boards.detail(boardId);
  return {
    apply: async (change: (board: Board) => Board) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Board>(key);
      if (previous) queryClient.setQueryData<Board>(key, change(previous));
      return { previous };
    },
    set: (change: (board: Board) => Board) => queryClient.setQueryData<Board>(key, (b) => b && change(b)),
    rollback: (context: { previous?: Board } | undefined) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    settle: () => {
      if (queryClient.isMutating({ mutationKey: boardMutationKey(boardId) }) > 1) return;
      // The detail, the list's card counts and the dashboard's due cards.
      return queryClient.invalidateQueries({ queryKey: qk.boards.all });
    },
  };
}

export function useRenameBoard(boardId: number) {
  const cache = useBoardCache(boardId);
  return useMutation({
    mutationKey: boardMutationKey(boardId),
    mutationFn: (name: string) => api.renameBoard(boardId, name),
    onMutate: (name) => cache.apply((b) => ({ ...b, name })),
    onError: (_error, _name, context) => cache.rollback(context),
    onSettled: cache.settle,
  });
}

export function useCreateColumn(boardId: number) {
  const cache = useBoardCache(boardId);
  return useMutation({
    mutationKey: boardMutationKey(boardId),
    mutationFn: (name: string) => api.createColumn(boardId, name),
    onSuccess: (column) => cache.set((b) => ({ ...b, columns: [...b.columns, { ...column, cards: [] }] })),
    onSettled: cache.settle,
  });
}

export function useRenameColumn(boardId: number) {
  const cache = useBoardCache(boardId);
  return useMutation({
    mutationKey: boardMutationKey(boardId),
    mutationFn: ({ id, name }: { id: number; name: string }) => api.renameColumn(id, name),
    onMutate: ({ id, name }) =>
      cache.apply((b) => ({ ...b, columns: b.columns.map((c) => (c.id === id ? { ...c, name } : c)) })),
    onError: (_error, _vars, context) => cache.rollback(context),
    onSettled: cache.settle,
  });
}

export function useDeleteColumn(boardId: number) {
  const cache = useBoardCache(boardId);
  return useMutation({
    mutationKey: boardMutationKey(boardId),
    mutationFn: (id: number) => api.deleteColumn(id),
    onMutate: (id) => cache.apply((b) => ({ ...b, columns: b.columns.filter((c) => c.id !== id) })),
    onError: (_error, _id, context) => cache.rollback(context),
    onSettled: cache.settle,
  });
}

let tempIds = 0;

/** Optimistic: the card shows at the bottom of the column with a temporary (negative) id until saved. */
export function useCreateCard(boardId: number) {
  const cache = useBoardCache(boardId);
  return useMutation({
    mutationKey: boardMutationKey(boardId),
    mutationFn: ({ columnId, input }: { columnId: number; input: CardInput; tempId: number }) =>
      api.createCard(columnId, input),
    onMutate: ({ columnId, input, tempId }) =>
      cache.apply((b) => ({
        ...b,
        columns: b.columns.map((c) => {
          if (c.id !== columnId) return c;
          const position = (c.cards.at(-1)?.position ?? 0) + 1000;
          return { ...c, cards: [...c.cards, { ...input, id: tempId, column_id: columnId, position }] };
        }),
      })),
    onSuccess: (card, { tempId }) => cache.set((b) => replaceCard(b, tempId, card)),
    onError: (_error, _vars, context) => cache.rollback(context),
    onSettled: cache.settle,
  });
}

/** A new temporary id for `useCreateCard`. Cards with one can't be moved or edited until saved. */
export const nextTempCardId = () => -++tempIds;

export function useUpdateCard(boardId: number) {
  const cache = useBoardCache(boardId);
  return useMutation({
    mutationKey: boardMutationKey(boardId),
    mutationFn: ({ card, input }: { card: Card; input: CardInput }) => api.updateCard(card.id, input),
    onMutate: ({ card, input }) => cache.apply((b) => replaceCard(b, card.id, { ...card, ...input })),
    onError: (_error, _vars, context) => cache.rollback(context),
    onSettled: cache.settle,
  });
}

/** Optimistic: the card stays where it was dropped and jumps back (with a toast from the caller) on error. */
export function useMoveCard(boardId: number) {
  const cache = useBoardCache(boardId);
  return useMutation({
    mutationKey: boardMutationKey(boardId),
    mutationFn: ({ id, columnId, position }: { id: number; columnId: number; position: number }) =>
      api.moveCard(id, columnId, position),
    onMutate: ({ id, columnId, position }) => cache.apply((b) => moveCardInBoard(b, id, columnId, position)),
    onError: (_error, _vars, context) => cache.rollback(context),
    onSettled: cache.settle,
  });
}

export function useDeleteCard(boardId: number) {
  const cache = useBoardCache(boardId);
  return useMutation({
    mutationKey: boardMutationKey(boardId),
    mutationFn: (id: number) => api.deleteCard(id),
    onMutate: (id) => cache.apply((b) => replaceCard(b, id, null)),
    onError: (_error, _id, context) => cache.rollback(context),
    onSettled: cache.settle,
  });
}
