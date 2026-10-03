'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CircleAlert, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { FormPasswordInput } from '@/components/shared/form-password-input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { useErrorMessage } from '@/hooks/use-error-message';
import { ApiError } from '@/services/core/api-call';

import { useResetPassword } from '../hooks';
import { NEW_PASSWORD_MAX, NEW_PASSWORD_MIN, resetPasswordSchema, type ResetPasswordValues } from '../types';
import { setApiFieldErrors } from '../utils';

export type ResetPasswordFormProps = {
  /** Single-use key from the code step. */
  resetKey: string;
  onDone: () => void;
  /** The key expired or was used: go back to the first step. */
  onStartAgain: () => void;
};

/** Step 3 of the password reset: the new password, typed twice. */
export function ResetPasswordForm({ resetKey, onDone, onStartAgain }: ResetPasswordFormProps) {
  const t = useTranslations();
  const errorMessage = useErrorMessage();
  const reset = useResetPassword();
  const [formError, setFormError] = useState<{ message: string; startAgain: boolean } | null>(null);

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });
  const { isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async ({ newPassword }) => {
    setFormError(null);
    try {
      await reset.mutateAsync({ key: resetKey, newPassword });
      onDone();
    } catch (error) {
      if (setApiFieldErrors(error, form, { fields: { new_password: 'newPassword' } })) return;
      const expired = error instanceof ApiError && error.code === 'INVALID_RESET_KEY';
      setFormError({ message: errorMessage(error), startAgain: expired });
    }
  });

  const errorText = (key: string) =>
    t.has(`auth.validation.${key}`) ? t(`auth.validation.${key}`, { min: NEW_PASSWORD_MIN }) : key;
  const toggle = { showLabel: t('auth.showPassword'), hideLabel: t('auth.hidePassword') };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {formError && (
        <Alert variant="destructive">
          <CircleAlert aria-hidden />
          <AlertDescription className="gap-2">
            {formError.message}
            {formError.startAgain && (
              <Button type="button" variant="outline" size="touch" onClick={onStartAgain}>
                {t('auth.reset.startAgain')}
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      <FieldGroup className="gap-5">
        <FormPasswordInput
          control={form.control}
          name="newPassword"
          label={t('settings.password.new')}
          description={t('settings.password.newHint', { min: NEW_PASSWORD_MIN, max: NEW_PASSWORD_MAX })}
          autoComplete="new-password"
          autoFocus
          translateError={errorText}
          {...toggle}
        />
        <FormPasswordInput
          control={form.control}
          name="confirmPassword"
          label={t('settings.password.confirm')}
          autoComplete="new-password"
          translateError={errorText}
          {...toggle}
        />
      </FieldGroup>

      <Button type="submit" size="touch" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
        {t('auth.reset.submit')}
      </Button>
    </form>
  );
}
