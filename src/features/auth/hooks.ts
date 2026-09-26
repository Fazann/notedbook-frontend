'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { qk } from '@/lib/query-keys';

import * as api from './api';

export function useMe() {
  return useQuery({ queryKey: qk.me, queryFn: api.getMe, staleTime: Infinity });
}

/** Logs in and caches the returned user, so the app shell does not fetch /me again. */
export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.login,
    onSuccess: (user) => queryClient.setQueryData(qk.me, user),
  });
}

/** Creates the account and caches the returned user (the API logs the new user in). */
export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.register,
    onSuccess: (user) => queryClient.setQueryData(qk.me, user),
  });
}
