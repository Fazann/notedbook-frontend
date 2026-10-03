'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { qk } from '@/lib/query-keys';
import * as api from '@/services/auth/auth-service';

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

/** Saves profile fields and caches the returned profile (menu, greeting and form update at once). */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.updateProfile,
    onSuccess: (user) => queryClient.setQueryData(qk.me, user),
  });
}

/** Uploads the image, then sets it as the avatar. */
export function useChangeAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const image = await api.uploadImage(file);
      return api.updateProfile({ avatar_id: image.id });
    },
    onSuccess: (user) => queryClient.setQueryData(qk.me, user),
  });
}

export function useChangePassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.changePassword,
    onSuccess: (user) => queryClient.setQueryData(qk.me, user),
  });
}

export function useRequestResetCode() {
  return useMutation({ mutationFn: (email: string) => api.requestResetCode(email) });
}

export function useVerifyResetCode() {
  return useMutation({
    mutationFn: ({ email, code }: { email: string; code: string }) => api.verifyResetCode(email, code),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({ key, newPassword }: { key: string; newPassword: string }) => api.resetPassword(key, newPassword),
  });
}
