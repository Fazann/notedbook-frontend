'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CircleAlert, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { FormPasswordInput } from '@/components/shared/form-password-input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { useErrorMessage } from '@/hooks/use-error-message';

import { useChangePassword } from '../hooks';
import { changePasswordSchema, NEW_PASSWORD_MAX, NEW_PASSWORD_MIN, type ChangePasswordValues } from '../types';
import { setApiFieldErrors } from '../utils';

const EMPTY: ChangePasswordValues = { currentPassword: '', newPassword: '', confirmPassword: '' };
const API_ERRORS = {
  codes: { INCORRECT_PASSWORD: 'currentPassword' },
  fields: { current_password: 'currentPassword', new_password: 'newPassword' },
} as const;

export function ChangePasswordForm() {
  const t = useTranslations();
  const errorMessage = useErrorMessage();
  const changePassword = useChangePassword();
  /** Error for the whole form (network, server...), shown above the fields. */
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<ChangePasswordValues>({ resolver: zodResolver(changePasswordSchema), defaultValues: EMPTY });
  const { isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      await changePassword.mutateAsync(values);
      form.reset(EMPTY);
      toast.success(t('settings.password.changed'));
    } catch (error) {
      if (!setApiFieldErrors(error, form, API_ERRORS)) setFormError(errorMessage(error));
    }
  });

  /**
   * Zod messages are keys under `auth.validation`, API codes are keys under `auth.errors`;
   * other API field messages are shown as sent.
   */
  const errorText = (key: string) => {
    if (t.has(`auth.validation.${key}`)) return t(`auth.validation.${key}`, { min: NEW_PASSWORD_MIN });
    if (t.has(`auth.errors.${key}`)) return t(`auth.errors.${key}`);
    return key;
  };

  const toggle = { showLabel: t('auth.showPassword'), hideLabel: t('auth.hidePassword') };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {formError && (
        <Alert variant="destructive">
          <CircleAlert aria-hidden />
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <FieldGroup className="gap-5">
        <FormPasswordInput
          control={form.control}
          name="currentPassword"
          label={t('settings.password.current')}
          autoComplete="current-password"
          translateError={errorText}
          {...toggle}
        />
        <FormPasswordInput
          control={form.control}
          name="newPassword"
          label={t('settings.password.new')}
          description={t('settings.password.newHint', { min: NEW_PASSWORD_MIN, max: NEW_PASSWORD_MAX })}
          autoComplete="new-password"
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

      <div className="flex md:justify-end">
        <Button type="submit" size="touch" className="w-full md:w-auto" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
          {t('settings.password.submit')}
        </Button>
      </div>
    </form>
  );
}
