'use client';

import { useQuery } from '@tanstack/react-query';

import { qk } from '@/lib/query-keys';
import * as api from '@/services/board-service';

export function useBoards() {
  return useQuery({ queryKey: qk.boards.list(), queryFn: api.listBoards });
}

export function useDueCards(days: number) {
  return useQuery({ queryKey: qk.boards.dueCards(days), queryFn: () => api.listDueCards(days) });
}
