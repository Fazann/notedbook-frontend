'use client';

import { ChevronsUpDown, LogOut, Settings, User as UserIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from '@/i18n/navigation';

export type UserMenuProps = {
  /** `detail` is the second line under the name (e.g. email or username). */
  user?: { name: string; detail: string; avatarUrl?: string };
  onLogout: () => void;
  /** `avatar`: round button for the header. `sidebar`: full row with name and email. */
  variant?: 'avatar' | 'sidebar';
};

function initials(name: string) {
  return name.trim().slice(0, 1).toUpperCase();
}

export function UserMenu({ user, onLogout, variant = 'avatar' }: UserMenuProps) {
  const t = useTranslations('user');

  // Round in the header (inside a round button), rounded square in the sidebar row.
  const avatar = (
    <Avatar shape={variant === 'sidebar' ? 'square' : 'circle'}>
      {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
      <AvatarFallback className="bg-primary/10 text-primary font-medium">
        {user ? initials(user.name) : ''}
      </AvatarFallback>
    </Avatar>
  );

  const trigger =
    variant === 'sidebar' ? (
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" tooltip={user?.name ?? t('menu')} aria-label={t('menu')}>
              {avatar}
              <span className="grid flex-1 text-left text-sm leading-tight">
                {user ? (
                  <>
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="text-muted-foreground truncate text-xs">{user.detail}</span>
                  </>
                ) : (
                  <Skeleton className="h-4 w-24" />
                )}
              </span>
              <ChevronsUpDown className="ml-auto size-4" aria-hidden />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
        </SidebarMenuItem>
      </SidebarMenu>
    ) : (
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-touch" className="rounded-full" aria-label={t('menu')}>
          {avatar}
        </Button>
      </DropdownMenuTrigger>
    );

  return (
    <DropdownMenu>
      {trigger}
      <DropdownMenuContent align="end" side={variant === 'sidebar' ? 'top' : 'bottom'} className="min-w-56">
        {user && (
          <DropdownMenuLabel className="font-normal">
            <p className="truncate font-medium">{user.name}</p>
            <p className="text-muted-foreground truncate text-xs">{user.detail}</p>
          </DropdownMenuLabel>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="min-h-10">
          <Link href="/settings/profile">
            <UserIcon aria-hidden />
            {t('profile')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="min-h-10">
          <Link href="/settings">
            <Settings aria-hidden />
            {t('settings')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onLogout} className="min-h-10">
          <LogOut aria-hidden />
          {t('logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
