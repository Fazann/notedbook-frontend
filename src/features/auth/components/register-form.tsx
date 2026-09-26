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
import { Link, useRouter } from '@/i18n/navigation';
import { ApiError } from '@/lib/api-client';
import { cn } from '@/lib/utils';

import { useRegister } from '../hooks';
import { EMAIL_MAX, FULLNAME_MAX, PASSWORD_MIN, registerSchema, USERNAME_MAX, type RegisterValues } from '../types';

const EMPTY: RegisterValues = { fullname: '', username: '', email: '', password: '' };
const FIELDS = Object.keys(EMPTY) as (keyof RegisterValues)[];
/** API error codes that belong to one field; shown under that field instead of above the form. */
const FIELD_CODES: Record<string, keyof RegisterValues> = { USERNAME_TAKEN: 'username', EMAIL_TAKEN: 'email' };

export function RegisterForm() {
  const t = useTranslations();
  const router = useRouter();
  const register = useRegister();
  /** Error for the whole form (network, server...), shown above the fields. */
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<RegisterValues>({ resolver: zodResolver(registerSchema), defaultValues: EMPTY });
  const { isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      await register.mutateAsync(values);
      router.replace('/dashboard');
    } catch (error) {
      if (!(error instanceof ApiError)) {
        setFormError(t('errors.generic'));
        return;
      }
      const field = FIELD_CODES[error.code];
      if (field) {
        form.setError(field, { message: error.code }, { shouldFocus: true });
        return;
      }
      if (error.fields) {
        for (const [name, message] of Object.entries(error.fields)) {
          if (FIELDS.includes(name as keyof RegisterValues)) {
            form.setError(name as keyof RegisterValues, { message });
          }
        }
        return;
      }
      setFormError(t.has(`errors.${error.code}`) ? t(`errors.${error.code}`) : t('errors.generic'));
    }
  });

  /**
   * Zod messages are keys under `auth.validation`, API codes are keys under `auth.errors`;
   * other API field messages are shown as sent.
   */
  const errorText = (key: string) => {
    if (t.has(`auth.validation.${key}`)) return t(`auth.validation.${key}`, { min: PASSWORD_MIN });
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
        <FormInput
          control={form.control}
          name="fullname"
          label={t('auth.fullname')}
          placeholder={t('auth.fullnamePlaceholder')}
          autoComplete="name"
          maxLength={FULLNAME_MAX}
          autoFocus
          translateError={errorText}
        />
        <FormInput
          control={form.control}
          name="username"
          label={t('auth.username')}
          placeholder={t('auth.usernamePlaceholder')}
          description={t('auth.usernameHint')}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={USERNAME_MAX}
          translateError={errorText}
        />
        <FormInput
          control={form.control}
          name="email"
          type="email"
          label={t('auth.emailOptional')}
          placeholder={t('auth.emailPlaceholder')}
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          inputMode="email"
          maxLength={EMAIL_MAX}
          translateError={errorText}
        />
        <FormPasswordInput
          control={form.control}
          name="password"
          label={t('auth.password')}
          description={t('auth.passwordHint', { min: PASSWORD_MIN })}
          autoComplete="new-password"
          showLabel={t('auth.showPassword')}
          hideLabel={t('auth.hidePassword')}
          translateError={errorText}
        />
      </FieldGroup>

      <Button type="submit" size="touch" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
        {t('auth.registerSubmit')}
      </Button>

      <p className="text-muted-foreground text-center text-sm leading-relaxed">
        {t.rich('auth.hasAccount', {
          link: (chunks) => (
            <Link
              href="/login"
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
