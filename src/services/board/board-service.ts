import type { BoardListItem, DueCard } from '@/features/board/types';
import { isMocked, usesRealApi } from '@/lib/env';
import * as mock from '@/mocks/handlers/board';

import { apiCall } from '../core/api-call';
import { ApiEndpoint } from '../core/api-endpoints';

/**
 * TODO(api): the backend has no board / card routes yet. Until it does, board data is demo data from the mock and is
 * only used when the whole app runs on mocks, so it never mixes with real data (e.g. on the dashboard).
 */
export const hasBoardData = () => isMocked('board') && !usesRealApi();

export function listBoards(): Promise<BoardListItem[]> {
  if (isMocked('board')) return mock.listBoards();
  return apiCall.get(ApiEndpoint.Boards);
}

export function listDueCards(days: number): Promise<DueCard[]> {
  if (isMocked('board')) return mock.listDueCards(days);
  // TODO(api): no endpoint returns cards due soon across all boards; needs e.g. GET /cards/due?days=7.
  return apiCall.get(ApiEndpoint.CardsDue, { days });
}
