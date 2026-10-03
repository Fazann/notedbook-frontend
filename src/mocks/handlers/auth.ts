import type { Attachment, LoginValues, ProfileUpdate, RegisterValues, User } from '@/features/auth/types';
import { ApiError } from '@/services/core/api-call';

import { copy, delay } from '../delay';
import { demoUser } from '../seed';

/** The only account the mock API knows. Shown on the login page in mock mode. */
export const DEMO_CREDENTIALS = { username: 'demo', password: 'password' } as const;

/** Usernames / emails that belong to "another user", to try the taken errors. */
const TAKEN_USERNAMES = ['admin'];
const TAKEN_EMAILS = ['admin@example.com'];

let me: User = copy(demoUser);
let password: string = DEMO_CREDENTIALS.password;
/** Uploaded images by attachment id, so `avatar_id` can be turned back into an avatar. */
const uploads = new Map<number, NonNullable<User['avatar']>>();
let nextAttachmentId = 1;

export async function getMe(): Promise<User> {
  await delay();
  return copy(me);
}

/** POST /auth/login — usernames are case-insensitive, passwords are not. */
export async function login({ username, password: given }: LoginValues): Promise<User> {
  await delay();
  if (username.trim().toLowerCase() !== me.username.toLowerCase() || given !== password) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid username or password');
  }
  return copy(me);
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
  return copy({ ...demoUser, id: demoUser.id + 1, username, fullname, email: email ?? '' });
}

/** PATCH /auth/profile — "admin" / "admin@example.com" are taken by another user. */
export async function updateProfile({ avatar_id, ...values }: ProfileUpdate): Promise<User> {
  await delay();
  if (values.username && TAKEN_USERNAMES.includes(values.username.toLowerCase())) {
    throw new ApiError(409, 'USERNAME_TAKEN', 'This username is already taken.');
  }
  if (values.email && TAKEN_EMAILS.includes(values.email.toLowerCase())) {
    throw new ApiError(409, 'EMAIL_TAKEN', 'This email is already registered.');
  }
  const avatar = avatar_id === undefined ? me.avatar : (uploads.get(avatar_id) ?? null);
  me = { ...me, ...values, email: values.email?.toLowerCase() ?? me.email, avatar };
  return copy(me);
}

/** PUT /auth/change-password */
export async function changePassword(body: { current_password: string; new_password: string }): Promise<User> {
  await delay();
  if (body.current_password !== password) {
    throw new ApiError(400, 'INCORRECT_PASSWORD', 'The current password is incorrect.');
  }
  password = body.new_password;
  return copy(me);
}

/** POST /attachments — keeps the file in the browser as an object URL. */
export async function uploadImage(file: File): Promise<Attachment> {
  await delay();
  const id = nextAttachmentId++;
  const url = URL.createObjectURL(file);
  uploads.set(id, { id, url });
  return { id, path: url };
}
