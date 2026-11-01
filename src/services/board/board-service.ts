import type { BoardListItem, DueCard } from '@/features/board/types';

import { apiCall } from '../core/api-call';
import { ApiEndpoint } from '../core/api-endpoints';

export function listBoards(): Promise<BoardListItem[]> {
  return apiCall.get(ApiEndpoint.Boards);
}

export function listDueCards(days: number): Promise<DueCard[]> {
  return apiCall.get(ApiEndpoint.CardsDue, { days });
}
