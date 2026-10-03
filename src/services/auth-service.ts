import type {
  Attachment,
  ChangePasswordValues,
  LoginValues,
  ProfileUpdate,
  RegisterValues,
  User,
} from '@/features/auth/types';
import { isMocked } from '@/lib/env';
import * as mock from '@/mocks/handlers/auth';

import { apiCall, clearSession, startSession } from './api-call';
import { ApiEndpoint } from './api-endpoints';
import { getDeviceInfo } from './device';
import type { Tokens } from './token-store';

export function getMe(): Promise<User> {
  if (isMocked('auth')) return mock.getMe();
  return apiCall.get(ApiEndpoint.AuthProfile);
}

/**
 * PATCH /auth/profile — changes only the fields sent and returns the updated profile.
 * Taken username / email: 409 with `USERNAME_TAKEN` / `EMAIL_TAKEN`.
 */
export function updateProfile(values: ProfileUpdate): Promise<User> {
  if (isMocked('auth')) return mock.updateProfile(values);
  return apiCall.patch(ApiEndpoint.AuthProfile, values);
}

/** PUT /auth/change-password — wrong current password: 400 with `INCORRECT_PASSWORD`. Returns the profile. */
export function changePassword({ currentPassword, newPassword }: ChangePasswordValues): Promise<User> {
  const body = { current_password: currentPassword, new_password: newPassword };
  if (isMocked('auth')) return mock.changePassword(body);
  return apiCall.put(ApiEndpoint.AuthChangePassword, body);
}

/** POST /attachments (multipart, field `file`). The returned id is then sent as the profile's `avatar_id`. */
export function uploadImage(file: File): Promise<Attachment> {
  if (isMocked('auth')) return mock.uploadImage(file);
  const body = new FormData();
  body.append('file', file);
  return apiCall.post(ApiEndpoint.Attachments, body);
}

/**
 * POST /auth/login — saves the returned tokens, then loads the profile.
 * Wrong credentials: 401 with code `INVALID_CREDENTIALS`.
 */
export async function login(values: LoginValues): Promise<User> {
  if (isMocked('auth')) return mock.login(values);
  startSession(await apiCall.post<Tokens>(ApiEndpoint.AuthLogin, { ...values, device: getDeviceInfo() }));
  return getMe();
}

/**
 * POST /auth/register — creates the account and, like login, starts a session and loads the profile.
 * Username already used: 409 with code `USERNAME_TAKEN`. An empty email is left out of the body.
 */
export async function register({ email, ...values }: RegisterValues): Promise<User> {
  const body = email ? { ...values, email } : values;
  if (isMocked('auth')) return mock.register(body);
  startSession(await apiCall.post<Tokens>(ApiEndpoint.AuthRegister, { ...body, device: getDeviceInfo() }));
  return getMe();
}

/** TODO(api): the backend has no logout endpoint, so the session is only forgotten on this device. */
export function logout() {
  clearSession();
}
