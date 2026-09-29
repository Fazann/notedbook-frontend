'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CircleAlert, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { FormInput } from '@/components/shared/form-input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { useErrorMessage } from '@/hooks/use-error-message';

import { useUpdateProfile } from '../hooks';
import {
  EMAIL_MAX,
  PROFILE_NAME_MAX,
  PROFILE_NAME_MIN,
  profileSchema,
  type ProfileUpdate,
  type ProfileValues,
  type User,
} from '../types';
import { setApiFieldErrors } from '../utils';

const FIELDS = ['fullname', 'username', 'email'] as const;
const API_ERRORS = {
  codes: {
    USERNAME_TAKEN: 'username',
    INVALID_USERNAME: 'username',
    EMAIL_TAKEN: 'email',
    INVALID_EMAIL: 'email',
    INVALID_FULLNAME: 'fullname',
  },
  fields: { fullname: 'fullname', username: 'username', email: 'email' },
} as const;

const toValues = (user: User): ProfileValues => ({
  fullname: user.fullname,
  username: user.username,
  email: user.email,
});

export type ProfileFormProps = { user: User };

/** Full name, username and email. Only changed fields are sent. */
export function ProfileForm({ user }: ProfileFormProps) {
  const t = useTranslations();
  const errorMessage = useErrorMessage();
  const update = useUpdateProfile();
  /** Error for the whole form (network, server...), shown above the fields. */
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<ProfileValues>({ resolver: zodResolver(profileSchema), defaultValues: toValues(user) });
  const { isSubmitting, isDirty } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    // The API cannot remove an email, only replace it.
    if (values.email === '' && user.email !== '') {
      form.setError('email', { message: 'emailCannotClear' }, { shouldFocus: true });
      return;
    }

    const changes: ProfileUpdate = {};
    for (const field of FIELDS) {
      if (values[field] !== user[field] && values[field] !== '') changes[field] = values[field];
    }
    if (Object.keys(changes).length === 0) {
      form.reset(toValues(user));
      return;
    }

    try {
      const saved = await update.mutateAsync(changes);
      form.reset(toValues(saved));
      toast.success(t('settings.profile.saved'));
    } catch (error) {
      if (!setApiFieldErrors(error, form, API_ERRORS)) setFormError(errorMessage(error));
    }
  });

  /**
   * Zod messages are keys under `auth.validation`, API codes are keys under `auth.errors`;
   * other API field messages are shown as sent.
   */
  const errorText = (key: string) => {
    if (t.has(`auth.validation.${key}`)) return t(`auth.validation.${key}`, { min: PROFILE_NAME_MIN });
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
          maxLength={PROFILE_NAME_MAX}
          translateError={errorText}
        />
        <FormInput
          control={form.control}
          name="username"
          label={t('auth.username')}
          placeholder={t('auth.usernamePlaceholder')}
          description={t('settings.profile.usernameHint')}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={PROFILE_NAME_MAX}
          translateError={errorText}
        />
        <FormInput
          control={form.control}
          name="email"
          type="email"
          label={t('settings.profile.email')}
          placeholder={t('auth.emailPlaceholder')}
          description={t('settings.profile.emailHint')}
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          inputMode="email"
          maxLength={EMAIL_MAX}
          translateError={errorText}
        />
      </FieldGroup>

      <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end">
        <Button
          type="button"
          variant="outline"
          size="touch"
          disabled={!isDirty || isSubmitting}
          onClick={() => {
            setFormError(null);
            form.reset(toValues(user));
          }}
        >
          {t('common.cancel')}
        </Button>
        <Button type="submit" size="touch" disabled={!isDirty || isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
          {t('settings.profile.save')}
        </Button>
      </div>
    </form>
  );
}
