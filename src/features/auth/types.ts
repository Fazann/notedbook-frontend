import { z } from 'zod';

/** Field names follow the API's profile response (`GET /auth/profile`). */
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  fullname: z.string(),
  email: z.string(),
  avatar: z.object({ id: z.number(), url: z.string(), thumbnail_url: z.string().optional() }).nullable(),
  created_at: z.string(),
});
export type User = z.infer<typeof userSchema>;

/** Messages are keys under `auth.validation`, translated in the form. */
export const loginSchema = z.object({
  username: z.string().trim().min(1, 'required'),
  // Not trimmed: spaces can be part of a password.
  password: z.string().min(1, 'required'),
});
export type LoginValues = z.infer<typeof loginSchema>;

/** Register limits match the API's `RegisterReq` (fullname 50, username 50, email 80, password 6–20). */
export const USERNAME_MIN = 3;
export const USERNAME_MAX = 50;
export const FULLNAME_MAX = 50;
export const REGISTER_EMAIL_MAX = 80;
/** Profile email limit (the API's `UpdateProfileReq`). */
export const EMAIL_MAX = 100;
export const PASSWORD_MIN = 6;
export const PASSWORD_MAX = 20;

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
    .max(REGISTER_EMAIL_MAX, 'emailTooLong')
    .refine((v) => v === '' || emailFormat.safeParse(v).success, 'emailInvalid'),
  password: z.string().min(1, 'required').min(PASSWORD_MIN, 'passwordTooShort').max(PASSWORD_MAX, 'passwordTooLong'),
});
export type RegisterValues = z.infer<typeof registerSchema>;

/** Limits of `PATCH /auth/profile` (stricter than the register form). */
export const PROFILE_NAME_MIN = 2;
export const PROFILE_NAME_MAX = 50;
/** Letters and numbers, with single spaces between words — the API's username rule. */
const PROFILE_USERNAME_FORMAT = /^[A-Za-z0-9]+( [A-Za-z0-9]+)*$/;
/** Bigger files are refused before upload; the API itself accepts up to 100 MB. */
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

/** Messages are keys under `auth.validation`, translated in the form. */
export const profileSchema = z.object({
  fullname: z
    .string()
    .trim()
    .min(1, 'required')
    .min(PROFILE_NAME_MIN, 'fullnameTooShort')
    .max(PROFILE_NAME_MAX, 'fullnameTooLong'),
  username: z
    .string()
    .trim()
    .min(1, 'required')
    .min(PROFILE_NAME_MIN, 'usernameMinLength')
    .max(PROFILE_NAME_MAX, 'usernameTooLong')
    .regex(PROFILE_USERNAME_FORMAT, 'profileUsernameFormat'),
  // Empty means "no change" when the account has no email yet; the API cannot clear an email.
  email: z
    .string()
    .trim()
    .max(EMAIL_MAX, 'emailTooLong')
    .refine((v) => v === '' || emailFormat.safeParse(v).success, 'emailInvalid'),
});
export type ProfileValues = z.infer<typeof profileSchema>;

/** Body of `PATCH /auth/profile`: only the fields that changed. */
export type ProfileUpdate = Partial<ProfileValues> & { avatar_id?: number };

/** Limits of `PUT /auth/change-password`. */
export const NEW_PASSWORD_MIN = 6;
export const NEW_PASSWORD_MAX = 20;

/** Messages are keys under `auth.validation`, translated in the form. */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'required'),
    newPassword: z
      .string()
      .min(1, 'required')
      .min(NEW_PASSWORD_MIN, 'passwordTooShort')
      .max(NEW_PASSWORD_MAX, 'passwordTooLong'),
    confirmPassword: z.string().min(1, 'required'),
  })
  .refine((v) => v.confirmPassword === v.newPassword, { path: ['confirmPassword'], message: 'passwordMismatch' })
  .refine((v) => v.newPassword !== v.currentPassword, { path: ['newPassword'], message: 'passwordSame' });
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

/** Uploaded file, as returned by `POST /attachments` (only the fields the app uses). */
export type Attachment = { id: number; path: string; thumbnail_url?: string };

/** Password reset: the API emails a 6-digit code; wait this long before asking for another one. */
export const RESET_CODE_LENGTH = 6;
export const RESET_RESEND_SECONDS = 60;

/** Messages are keys under `auth.validation`, translated in the form. */
export const resetEmailSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'required')
    .max(EMAIL_MAX, 'emailTooLong')
    .refine((v) => emailFormat.safeParse(v).success, 'emailInvalid'),
});
export type ResetEmailValues = z.infer<typeof resetEmailSchema>;

/** Khmer digits are turned into Latin ones while typing (see `ResetCodeForm`). */
export const resetCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'required')
    .regex(new RegExp(`^\\d{${RESET_CODE_LENGTH}}$`), 'codeInvalid'),
});
export type ResetCodeValues = z.infer<typeof resetCodeSchema>;

/** Limits of `POST /auth/reset-password` (same as a new password in Settings). */
export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(1, 'required')
      .min(NEW_PASSWORD_MIN, 'passwordTooShort')
      .max(NEW_PASSWORD_MAX, 'passwordTooLong'),
    confirmPassword: z.string().min(1, 'required'),
  })
  .refine((v) => v.confirmPassword === v.newPassword, { path: ['confirmPassword'], message: 'passwordMismatch' });
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
