'use client';

import { CircleCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';

import { AuthCard } from './auth-card';
import { ResetCodeForm } from './reset-code-form';
import { ResetEmailForm } from './reset-email-form';
import { ResetPasswordForm } from './reset-password-form';

type Step = { name: 'email' } | { name: 'code' } | { name: 'password'; key: string } | { name: 'done' };

/**
 * Password reset with an emailed code: email → 6-digit code → new password → done.
 * The reset signs the user out on every device, so "done" leads to the login page.
 */
export function ForgotPasswordFlow() {
  const t = useTranslations('auth');
  const [step, setStep] = useState<Step>({ name: 'email' });
  const [email, setEmail] = useState('');
  const startAgain = () => setStep({ name: 'email' });

  const backToLogin = (
    <Button asChild variant="link" size="touch" className="w-full">
      <Link href="/login">{t('backToLogin')}</Link>
    </Button>
  );

  switch (step.name) {
    case 'email':
      return (
        <AuthCard title={t('forgotPasswordTitle')} description={t('reset.emailDescription')}>
          <ResetEmailForm
            defaultEmail={email}
            onSent={(sentTo) => {
              setEmail(sentTo);
              setStep({ name: 'code' });
            }}
          />
          <div className="mt-2">{backToLogin}</div>
        </AuthCard>
      );
    case 'code':
      return (
        <AuthCard title={t('reset.codeTitle')} description={t('reset.codeDescription', { email })}>
          <ResetCodeForm
            email={email}
            onVerified={(key) => setStep({ name: 'password', key })}
            onChangeEmail={startAgain}
          />
        </AuthCard>
      );
    case 'password':
      return (
        <AuthCard title={t('reset.passwordTitle')} description={t('reset.passwordDescription')}>
          <ResetPasswordForm resetKey={step.key} onDone={() => setStep({ name: 'done' })} onStartAgain={startAgain} />
        </AuthCard>
      );
    case 'done':
      return (
        <AuthCard title={t('reset.doneTitle')}>
          <EmptyState
            className="py-2"
            icon={<CircleCheck />}
            title={t('reset.doneDescription')}
            action={
              <Button asChild size="touch" className="w-full">
                <Link href="/login">{t('reset.logIn')}</Link>
              </Button>
            }
          />
        </AuthCard>
      );
  }
}
