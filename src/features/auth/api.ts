import { apiClient } from '@/lib/api-client';
import { env } from '@/lib/env';
import * as mock from '@/mocks/handlers/auth';

import type { Attachment, ChangePasswordValues, LoginValues, ProfileUpdate, RegisterValues, User } from './types';

// TODO(api): the Go API serves under /api/v1 and wraps success bodies in `{ message, data, status_code }`;
// apiClient does not unwrap `data` yet, and the API authenticates with a Bearer token, not a cookie.
export function getMe(): Promise<User> {
  if (env.useMocks) return mock.getMe();
  return apiClient.get('/auth/profile');
}

/**
 * PATCH /auth/profile — changes only the fields sent and returns the updated profile.
 * Taken username / email: 409 with `USERNAME_TAKEN` / `EMAIL_TAKEN`.
 */
export function updateProfile(values: ProfileUpdate): Promise<User> {
  if (env.useMocks) return mock.updateProfile(values);
  return apiClient.patch('/auth/profile', values);
}

/** PUT /auth/change-password — wrong current password: 400 with `INCORRECT_PASSWORD`. Returns the profile. */
export function changePassword({ currentPassword, newPassword }: ChangePasswordValues): Promise<User> {
  const body = { current_password: currentPassword, new_password: newPassword };
  if (env.useMocks) return mock.changePassword(body);
  return apiClient.put('/auth/change-password', body);
}

/** POST /attachments (multipart, field `file`). The returned id is then sent as the profile's `avatar_id`. */
export function uploadImage(file: File): Promise<Attachment> {
  if (env.useMocks) return mock.uploadImage(file);
  const body = new FormData();
  body.append('file', file);
  return apiClient.post('/attachments', body);
}

/**
 * POST /auth/login — the API sets the httpOnly session cookie and returns the user.
 * Wrong credentials: 401 with code `INVALID_CREDENTIALS`.
 */
// TODO(api): confirm the backend accepts `{ username, password }` (the contract does not list the body yet).
export function login(values: LoginValues): Promise<User> {
  if (env.useMocks) return mock.login(values);
  return apiClient.post('/auth/login', values);
}

/**
 * POST /auth/register — creates the account, then (like login) sets the session cookie and returns the user.
 * Username already used: 409 with code `USERNAME_TAKEN`. An empty email is left out of the body.
 */
// TODO(api): the backend has no /auth/register handler yet.
// Confirm the body `{ fullname, username, email?, password }`.
export function register({ email, ...values }: RegisterValues): Promise<User> {
  const body = email ? { ...values, email } : values;
  if (env.useMocks) return mock.register(body);
  return apiClient.post('/auth/register', body);
}
