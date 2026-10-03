import type { BoardListItem, DueCard } from '@/features/board/types';
import { env } from '@/lib/env';
import * as mock from '@/mocks/handlers/board';

import { apiCall } from './api-call';
import { ApiEndpoint } from './api-endpoints';

export function listBoards(): Promise<BoardListItem[]> {
  if (env.useMocks) return mock.listBoards();
  return apiCall.get(ApiEndpoint.Boards);
}

export function listDueCards(days: number): Promise<DueCard[]> {
  if (env.useMocks) return mock.listDueCards(days);
  // TODO(api): no endpoint returns cards due soon across all boards; needs e.g. GET /cards/due?days=7.
  return apiCall.get(ApiEndpoint.CardsDue, { days });
}
