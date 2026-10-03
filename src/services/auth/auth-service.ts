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

import { apiCall, clearSession, startSession } from '../core/api-call';
import { ApiEndpoint } from '../core/api-endpoints';
import type { Tokens } from '../core/token-store';

import { getDeviceInfo } from './device';

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

/**
 * POST /auth/mail-otp/request — emails a 6-digit code if the address belongs to an account (the answer is the same
 * either way). One request per email per minute: 429 `TOO_MANY_REQUESTS`. Returns seconds until the code expires.
 */
export async function requestResetCode(email: string): Promise<{ expiresIn: number }> {
  if (isMocked('auth')) return mock.requestResetCode();
  const res = await apiCall.post<{ expires_in: number }>(ApiEndpoint.AuthMailOtpRequest, { email });
  return { expiresIn: res.expires_in };
}

/**
 * POST /auth/mail-otp/verify — returns a single-use key for `resetPassword`.
 * Wrong or expired code: 400 `INVALID_OTP`; after 5 wrong codes: 429 `OTP_TOO_MANY_ATTEMPTS` (a new code is needed).
 */
export async function verifyResetCode(email: string, code: string): Promise<{ key: string; expiresIn: number }> {
  if (isMocked('auth')) return mock.verifyResetCode(email, code);
  const res = await apiCall.post<{ key: string; expires_in: number }>(ApiEndpoint.AuthMailOtpVerify, {
    email,
    otp: code,
  });
  return { key: res.key, expiresIn: res.expires_in };
}

/** POST /auth/reset-password — signs the user out everywhere. Used or expired key: 400 `INVALID_RESET_KEY`. */
export async function resetPassword(key: string, newPassword: string): Promise<void> {
  if (isMocked('auth')) return mock.resetPassword(key, newPassword);
  await apiCall.post(ApiEndpoint.AuthResetPassword, { key, new_password: newPassword });
}

/** TODO(api): the backend has no logout endpoint, so the session is only forgotten on this device. */
export function logout() {
  clearSession();
}
