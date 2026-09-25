'use client';

import { NotebookPen } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

import { isActive, MAIN_NAV, SETTINGS_NAV, type NavItem } from './nav-items';

export type AppSidebarProps = {
  /** Account menu rendered at the bottom (e.g. avatar + name). */
  userSlot?: React.ReactNode;
};

export function AppSidebar({ userSlot }: AppSidebarProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  const renderItem = ({ key, href, icon: Icon }: NavItem) => {
    const label = t(`nav.${key}`);
    return (
      <SidebarMenuItem key={key}>
        <SidebarMenuButton asChild isActive={isActive(pathname, href)} tooltip={label} size="lg">
          <Link href={href} onClick={() => isMobile && setOpenMobile(false)}>
            <Icon aria-hidden />
            <span>{label}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon" aria-label={t('nav.main')}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip={t('app.name')}>
              <Link href="/dashboard">
                <span
                  className={cn(
                    'flex aspect-square size-8 items-center justify-center rounded-lg',
                    'bg-primary text-primary-foreground'
                  )}
                >
                  <NotebookPen className="size-4" aria-hidden />
                </span>
                <span className="font-heading text-base font-semibold">{t('app.name')}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>{MAIN_NAV.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>{renderItem(SETTINGS_NAV)}</SidebarMenu>
        {/* On phones the header has no room for these, so they live in the menu sheet. */}
        {isMobile && (
          <div className="flex items-center gap-1">
            <LanguageSwitcher showLabel className="flex-1" />
            <ThemeToggle />
          </div>
        )}
        <SidebarSeparator className="mx-0" />
        {userSlot}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
