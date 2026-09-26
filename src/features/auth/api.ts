import { apiClient } from '@/lib/api-client';
import { env } from '@/lib/env';
import * as mock from '@/mocks/handlers/auth';

import type { LoginValues, RegisterValues, User } from './types';

export function getMe(): Promise<User> {
  if (env.useMocks) return mock.getMe();
  return apiClient.get('/me');
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
