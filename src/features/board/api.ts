import { apiClient } from '@/lib/api-client';
import { env } from '@/lib/env';
import * as mock from '@/mocks/handlers/board';

import type { BoardListItem, DueCard } from './types';

export function listBoards(): Promise<BoardListItem[]> {
  if (env.useMocks) return mock.listBoards();
  return apiClient.get('/boards');
}

export function listDueCards(days: number): Promise<DueCard[]> {
  if (env.useMocks) return mock.listDueCards(days);
  // TODO(api): no endpoint returns cards due soon across all boards; needs e.g. GET /cards/due?days=7.
  return apiClient.get(`/cards/due?days=${days}`);
}
