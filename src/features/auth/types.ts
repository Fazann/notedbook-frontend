import { z } from 'zod';

import { routing } from '@/i18n/routing';

export const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  locale: z.enum(routing.locales),
});
export type User = z.infer<typeof userSchema>;

/** Messages are keys under `auth.validation`, translated in the form. */
export const loginSchema = z.object({
  username: z.string().trim().min(1, 'required'),
  // Not trimmed: spaces can be part of a password.
  password: z.string().min(1, 'required'),
});
export type LoginValues = z.infer<typeof loginSchema>;

/** Limits match the API's `users` table (fullname 100, username 50, email 100). */
export const USERNAME_MIN = 3;
export const USERNAME_MAX = 50;
export const FULLNAME_MAX = 100;
export const EMAIL_MAX = 100;
export const PASSWORD_MIN = 8;
/** bcrypt ignores bytes after 72. */
export const PASSWORD_MAX = 72;

const emailFormat = z.email();

/** Messages are keys under `auth.validation`, translated in the form. */
export const registerSchema = z.object({
  fullname: z.string().trim().min(1, 'required').max(FULLNAME_MAX, 'fullnameTooLong'),
  username: z
    .string()
    .trim()
    .min(1, 'required')
    .min(USERNAME_MIN, 'usernameTooShort')
    .max(USERNAME_MAX, 'usernameTooLong')
    .regex(/^[a-zA-Z0-9._]+$/, 'usernameFormat'),
  // Optional: an empty string means "no email".
  email: z
    .string()
    .trim()
    .max(EMAIL_MAX, 'emailTooLong')
    .refine((v) => v === '' || emailFormat.safeParse(v).success, 'emailInvalid'),
  password: z.string().min(1, 'required').min(PASSWORD_MIN, 'passwordTooShort').max(PASSWORD_MAX, 'passwordTooLong'),
});
export type RegisterValues = z.infer<typeof registerSchema>;
