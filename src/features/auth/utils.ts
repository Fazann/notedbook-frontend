import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';

import { ApiError } from '@/services/core/api-call';

export type ApiFieldMap<T extends FieldValues> = {
  /** API error codes that belong to one field (e.g. `USERNAME_TAKEN` → `username`); the code is the message. */
  codes?: Partial<Record<string, Path<T>>>;
  /** API field names → form fields, for `VALIDATION_FAILED` errors (e.g. `new_password` → `newPassword`). */
  fields?: Partial<Record<string, Path<T>>>;
};

/**
 * Shows an API error under the form fields it belongs to.
 * Returns false when it does not belong to a field, so the caller shows it for the whole form.
 */
export function setApiFieldErrors<T extends FieldValues>(
  error: unknown,
  form: Pick<UseFormReturn<T>, 'setError'>,
  { codes = {}, fields = {} }: ApiFieldMap<T>
): boolean {
  if (!(error instanceof ApiError)) return false;

  const field = codes[error.code];
  if (field) {
    form.setError(field, { message: error.code }, { shouldFocus: true });
    return true;
  }

  let shown = false;
  for (const [name, message] of Object.entries(error.fields ?? {})) {
    const target = fields[name];
    if (target) {
      form.setError(target, { message }, { shouldFocus: !shown });
      shown = true;
    }
  }
  return shown;
}
