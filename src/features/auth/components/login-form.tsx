'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CircleAlert, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { FormInput } from '@/components/shared/form-input';
import { FormPasswordInput } from '@/components/shared/form-password-input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { useErrorMessage } from '@/hooks/use-error-message';
import { Link, useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { ApiError } from '@/services/api-call';

import { useLogin } from '../hooks';
import { loginSchema, type LoginValues } from '../types';

const EMPTY: LoginValues = { username: '', password: '' };

export type LoginFormProps = {
  /** Page to open after logging in (already checked with `safeRedirectPath`); defaults to the dashboard. */
  next?: string;
};

export function LoginForm({ next = '/dashboard' }: LoginFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const login = useLogin();
  const errorMessage = useErrorMessage();
  /** Error for the whole form (wrong credentials, network...), shown above the fields. */
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: EMPTY });
  const { isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      await login.mutateAsync(values);
      router.replace(next);
    } catch (error) {
      if (error instanceof ApiError && error.fields) {
        for (const [name, message] of Object.entries(error.fields)) {
          if (name === 'username' || name === 'password') form.setError(name, { message });
        }
      }
      if (error instanceof ApiError && error.code === 'INVALID_CREDENTIALS') {
        setFormError(t('auth.errors.invalidCredentials'));
        form.resetField('password');
        form.setFocus('password');
      } else {
        // e.g. TOO_MANY_ATTEMPTS or ACCOUNT_DISABLED: the API message is already in the user's language.
        setFormError(errorMessage(error));
      }
    }
  });

  /** Zod messages are keys under `auth.validation`; API field messages are shown as sent. */
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
          name="username"
          label={t('auth.username')}
          placeholder={t('auth.usernamePlaceholder')}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          autoFocus
          translateError={errorText}
        />
        <div className="space-y-2">
          <FormPasswordInput
            control={form.control}
            name="password"
            label={t('auth.password')}
            autoComplete="current-password"
            showLabel={t('auth.showPassword')}
            hideLabel={t('auth.hidePassword')}
            translateError={errorText}
          />
          <div className="flex justify-end">
            <Button asChild variant="link" size="touch" className="-mr-2.5 px-2.5">
              <Link href="/forgot-password">{t('auth.forgotPassword')}</Link>
            </Button>
          </div>
        </div>
      </FieldGroup>

      <Button type="submit" size="touch" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
        {t('auth.submit')}
      </Button>

      <p className="text-muted-foreground text-center text-sm leading-relaxed">
        {t.rich('auth.noAccount', {
          link: (chunks) => (
            <Link
              href="/register"
              className={cn(
                'text-primary inline-flex min-h-11 items-center font-medium',
                'underline-offset-4 hover:underline md:min-h-0'
              )}
            >
              {chunks}
            </Link>
          ),
        })}
      </p>
    </form>
  );
}
