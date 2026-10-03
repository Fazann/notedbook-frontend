'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CircleAlert, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { FormInput } from '@/components/shared/form-input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { useErrorMessage } from '@/hooks/use-error-message';

import { useRequestResetCode } from '../hooks';
import { resetEmailSchema, type ResetEmailValues } from '../types';
import { setApiFieldErrors } from '../utils';

export type ResetEmailFormProps = {
  defaultEmail?: string;
  /** Called once the code was requested, with the email it was sent to. */
  onSent: (email: string) => void;
};

/** Step 1 of the password reset: the account email. */
export function ResetEmailForm({ defaultEmail = '', onSent }: ResetEmailFormProps) {
  const t = useTranslations();
  const errorMessage = useErrorMessage();
  const request = useRequestResetCode();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<ResetEmailValues>({
    resolver: zodResolver(resetEmailSchema),
    defaultValues: { email: defaultEmail },
  });
  const { isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async ({ email }) => {
    setFormError(null);
    try {
      await request.mutateAsync(email);
      onSent(email);
    } catch (error) {
      // e.g. TOO_MANY_REQUESTS: the API message (with the wait time) is already in the user's language.
      if (!setApiFieldErrors(error, form, { fields: { email: 'email' } })) setFormError(errorMessage(error));
    }
  });

  const errorText = (key: string) => (t.has(`auth.validation.${key}`) ? t(`auth.validation.${key}`) : key);

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {formError && (
        <Alert variant="destructive">
          <CircleAlert aria-hidden />
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <FieldGroup className="gap-5">
        <FormInput
          control={form.control}
          name="email"
          type="email"
          label={t('auth.reset.email')}
          description={t('auth.reset.emailHint')}
          placeholder={t('auth.reset.emailPlaceholder')}
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          autoFocus
          translateError={errorText}
        />
      </FieldGroup>

      <Button type="submit" size="touch" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
        {t('auth.reset.sendCode')}
      </Button>
    </form>
  );
}
