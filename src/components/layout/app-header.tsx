'use client';

import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/ui-store';

import { ALL_NAV, isActive } from './nav-items';

export type AppHeaderProps = {
  /** Account avatar menu, shown on the right. */
  userSlot?: React.ReactNode;
};

export function AppHeader({ userSlot }: AppHeaderProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const openSearch = useUiStore((s) => s.setSearchOpen);
  const current = ALL_NAV.find((item) => isActive(pathname, item.href));

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b px-2 md:px-4',
        'bg-background/80 backdrop-blur'
      )}
    >
      {/* Opens the menu sheet on phones, collapses the sidebar on tablets; hidden on desktop (fixed sidebar). */}
      <SidebarTrigger className="size-11 md:size-9 lg:hidden" aria-label={t('nav.openMenu')} />
      <p className="min-w-0 flex-1 truncate font-medium">{current && t(`nav.${current.key}`)}</p>
      <div className="hidden items-center md:flex">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
      {userSlot}
    </header>
  );
}
