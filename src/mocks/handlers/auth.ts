import type { LoginValues, RegisterValues, User } from '@/features/auth/types';
import { ApiError } from '@/lib/api-client';

import { copy, delay } from '../delay';
import { demoUser } from '../seed';

/** The only account the mock API knows. Shown on the login page in mock mode. */
export const DEMO_CREDENTIALS = { username: 'demo', password: 'password' } as const;

export async function getMe(): Promise<User> {
  await delay();
  return copy(demoUser);
}

/** POST /auth/login — usernames are case-insensitive, passwords are not. */
export async function login({ username, password }: LoginValues): Promise<User> {
  await delay();
  if (username.trim().toLowerCase() !== DEMO_CREDENTIALS.username || password !== DEMO_CREDENTIALS.password) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid username or password');
  }
  return copy(demoUser);
}

/** POST /auth/register — the demo username is taken; any other username succeeds. */
export async function register({
  fullname,
  username,
  email,
}: Omit<RegisterValues, 'email'> & { email?: string }): Promise<User> {
  await delay();
  if (username.trim().toLowerCase() === DEMO_CREDENTIALS.username) {
    throw new ApiError(409, 'USERNAME_TAKEN', 'Username is already taken');
  }
  return copy({ ...demoUser, id: demoUser.id + 1, name: fullname, email: email ?? '' });
}
