import { NotebookPen } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { EmptyState } from '@/components/shared/empty-state';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

export async function generateMetadata({ params }: PageProps<'/[locale]/login'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: 'auth' });
  return { title: t('loginTitle') };
}

// TODO(api): real auth. The login form is a later build step; this placeholder lets "Log out" land somewhere.
export default async function LoginPage({ params }: PageProps<'/[locale]/login'>) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations();

  return (
    <main className="bg-muted/40 relative flex min-h-dvh items-center justify-center p-4">
      <LanguageSwitcher showLabel className="absolute top-4 right-4" />
      <Card className="w-full max-w-sm">
        <EmptyState
          icon={<NotebookPen />}
          title={t('auth.loginTitle')}
          description={t('common.comingSoonDescription')}
          action={
            <Button asChild size="touch">
              <Link href="/dashboard">{t('common.backToDashboard')}</Link>
            </Button>
          }
        />
      </Card>
    </main>
  );
}
