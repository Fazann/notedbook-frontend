import { LifeBuoy } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

/** Logged-out pages: one centered card, with a help link and the language switcher in the top corners. */
export default async function AuthLayout({ children }: LayoutProps<'/[locale]'>) {
  const t = await getTranslations('help');

  return (
    <main
      className={cn(
        'bg-muted/40 relative flex min-h-dvh flex-col items-center',
        'px-4 pt-16 pb-8 sm:justify-center sm:pt-8'
      )}
    >
      <Button asChild variant="ghost" size="touch" className="absolute top-4 left-4">
        <Link href="/help">
          <LifeBuoy aria-hidden />
          {t('link')}
        </Link>
      </Button>
      <LanguageSwitcher showLabel className="absolute top-4 right-4" />
      {children}
    </main>
  );
}
