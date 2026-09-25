'use client';

import { Check } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useTransition } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { cn } from '@/lib/utils';

import { LocaleFlag } from './locale-flag';

export type LanguageSwitcherProps = {
  className?: string;
  /** Always show the language name next to the flag. Otherwise it is hidden on phones (header). */
  showLabel?: boolean;
};

export function LanguageSwitcher({ className, showLabel = false }: LanguageSwitcherProps) {
  const t = useTranslations('language');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // next-intl sets the NEXT_LOCALE cookie on navigation; query data stays cached.
  const switchTo = (next: typeof locale) => startTransition(() => router.replace(pathname, { locale: next }));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="touch"
          className={cn('justify-start gap-2', className)}
          aria-label={t('current', { name: t(locale) })}
          disabled={isPending}
        >
          <LocaleFlag locale={locale} />
          <span lang={locale} className={cn(!showLabel && 'sr-only sm:not-sr-only')}>
            {t(locale)}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t('label')}</DropdownMenuLabel>
        {routing.locales.map((l) => (
          <DropdownMenuItem key={l} lang={l} onSelect={() => switchTo(l)} className="min-h-10 gap-2">
            <LocaleFlag locale={l} />
            <span className="flex-1">{t(l)}</span>
            {l === locale && <Check aria-hidden />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
