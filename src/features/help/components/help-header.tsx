import { LifeBuoy } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { Container } from '@/components/layout/container';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

/** Top bar of the public help pages: help home, language, theme and a way into the app. */
export async function HelpHeader() {
  const t = await getTranslations();

  return (
    <header className="bg-background/80 sticky top-0 z-30 border-b backdrop-blur">
      <Container className="flex h-14 items-center gap-1">
        <Link
          href="/help"
          aria-label={t('help.home')}
          className={cn(
            'mr-auto flex min-h-11 min-w-0 items-center gap-2 rounded-lg pr-2',
            'focus-visible:ring-ring/50 outline-none focus-visible:ring-3'
          )}
        >
          <span
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-lg',
              'bg-primary text-primary-foreground'
            )}
          >
            <LifeBuoy className="size-4" aria-hidden />
          </span>
          <span className="truncate font-semibold">
            <span className="hidden sm:inline">{t('app.name')} · </span>
            {t('help.link')}
          </span>
        </Link>
        <LanguageSwitcher />
        <ThemeToggle />
        {/* Signed-out visitors are sent on to the login page by the proxy. */}
        <Button asChild size="touch" className="ml-1">
          <Link href="/dashboard">{t('help.openApp')}</Link>
        </Button>
      </Container>
    </header>
  );
}
