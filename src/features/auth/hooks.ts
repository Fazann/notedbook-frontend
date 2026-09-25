'use client';

import { useQuery } from '@tanstack/react-query';

import { qk } from '@/lib/query-keys';

import * as api from './api';

export function useMe() {
  return useQuery({ queryKey: qk.me, queryFn: api.getMe, staleTime: Infinity });
}
