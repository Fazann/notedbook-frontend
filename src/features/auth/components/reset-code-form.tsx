'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CircleAlert, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { FormField } from '@/components/shared/form-field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useErrorMessage } from '@/hooks/use-error-message';
import { toLatinDigits } from '@/lib/money';

import { useRequestResetCode, useVerifyResetCode } from '../hooks';
import { RESET_CODE_LENGTH, RESET_RESEND_SECONDS, resetCodeSchema, type ResetCodeValues } from '../types';
import { setApiFieldErrors } from '../utils';

export type ResetCodeFormProps = {
  email: string;
  /** Called with the single-use key once the code is right. */
  onVerified: (key: string) => void;
  onChangeEmail: () => void;
};

/** Seconds left until `until` (a timestamp), counting down every second; 0 once it has passed. */
function useSecondsLeft(until: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  return Math.max(0, Math.ceil((until - now) / 1000));
}

/** Step 2 of the password reset: the 6-digit code from the email, with "Resend code" after a short wait. */
export function ResetCodeForm({ email, onVerified, onChangeEmail }: ResetCodeFormProps) {
  const t = useTranslations();
  const errorMessage = useErrorMessage();
  const verify = useVerifyResetCode();
  const resend = useRequestResetCode();
  const [formError, setFormError] = useState<string | null>(null);
  // The code was just sent by the previous step.
  const [resendAt, setResendAt] = useState(() => Date.now() + RESET_RESEND_SECONDS * 1000);
  const secondsLeft = useSecondsLeft(resendAt);

  const form = useForm<ResetCodeValues>({ resolver: zodResolver(resetCodeSchema), defaultValues: { code: '' } });
  const { isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async ({ code }) => {
    setFormError(null);
    try {
      const { key } = await verify.mutateAsync({ email, code });
      onVerified(key);
    } catch (error) {
      // OTP_TOO_MANY_ATTEMPTS cancels the code: the message tells the user to request a new one.
      if (!setApiFieldErrors(error, form, { codes: { INVALID_OTP: 'code' }, fields: { otp: 'code' } })) {
        setFormError(errorMessage(error));
      }
    }
  });

  const onResend = async () => {
    setFormError(null);
    try {
      await resend.mutateAsync(email);
      form.reset({ code: '' });
      setResendAt(Date.now() + RESET_RESEND_SECONDS * 1000);
      toast.success(t('auth.reset.resent'));
    } catch (error) {
      setFormError(errorMessage(error));
    }
  };

  const errorText = (key: string) => {
    if (t.has(`auth.validation.${key}`)) return t(`auth.validation.${key}`, { length: RESET_CODE_LENGTH });
    if (t.has(`auth.errors.${key}`)) return t(`auth.errors.${key}`);
    return key;
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {formError && (
        <Alert variant="destructive">
          <CircleAlert aria-hidden />
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <FieldGroup className="gap-5">
        <FormField control={form.control} name="code" label={t('auth.reset.code')} translateError={errorText}>
          {({ field, id, describedBy, invalid }) => (
            <Input
              {...field}
              // Khmer keyboards type ០-៩; keep only digits.
              onChange={(e) =>
                field.onChange(toLatinDigits(e.target.value).replace(/\D/g, '').slice(0, RESET_CODE_LENGTH))
              }
              id={id}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={RESET_CODE_LENGTH}
              autoFocus
              aria-invalid={invalid}
              aria-describedby={describedBy}
              className="h-11 text-center font-mono text-lg tracking-[0.5em] tabular-nums md:h-10"
            />
          )}
        </FormField>
      </FieldGroup>

      <div className="space-y-2">
        <Button type="submit" size="touch" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
          {t('auth.reset.verify')}
        </Button>
        <div className="flex flex-wrap justify-between gap-x-2">
          <Button type="button" variant="link" size="touch" className="-ml-2.5 px-2.5" onClick={onChangeEmail}>
            {t('auth.reset.changeEmail')}
          </Button>
          <Button
            type="button"
            variant="link"
            size="touch"
            className="-mr-2.5 px-2.5"
            onClick={onResend}
            disabled={secondsLeft > 0 || resend.isPending}
          >
            {resend.isPending && <Loader2 className="animate-spin" aria-hidden />}
            {secondsLeft > 0 ? t('auth.reset.resendIn', { seconds: secondsLeft }) : t('auth.reset.resend')}
          </Button>
        </div>
      </div>
    </form>
  );
}
