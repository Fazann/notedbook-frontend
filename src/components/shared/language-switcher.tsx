'use client';

import { Check, Languages } from 'lucide-react';
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

export type LanguageSwitcherProps = {
  className?: string;
  /** Show the language name next to the icon. */
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
          size={showLabel ? 'touch' : 'icon-touch'}
          className={cn(showLabel && 'justify-start', className)}
          aria-label={showLabel ? undefined : t('label')}
          disabled={isPending}
        >
          <Languages aria-hidden />
          {showLabel && <span>{t(locale)}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t('label')}</DropdownMenuLabel>
        {routing.locales.map((l) => (
          <DropdownMenuItem key={l} lang={l} onSelect={() => switchTo(l)} className="min-h-10">
            <span className="flex-1">{t(l)}</span>
            {l === locale && <Check aria-hidden />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
