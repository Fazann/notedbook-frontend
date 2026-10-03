'use client';

import { useQueryClient } from '@tanstack/react-query';

import { UserMenu } from '@/components/layout/user-menu';
import { useRouter } from '@/i18n/navigation';
import { logout as endSession } from '@/services/auth-service';
import { usePreferencesStore } from '@/stores/preferences-store';
import { useUiStore } from '@/stores/ui-store';

import { useMe } from '../hooks';

export type AccountMenuProps = { variant?: 'avatar' | 'sidebar' };

export function AccountMenu({ variant }: AccountMenuProps) {
  const me = useMe();
  const queryClient = useQueryClient();
  const router = useRouter();

  const logout = () => {
    endSession();
    useUiStore.getState().reset();
    usePreferencesStore.getState().reset();
    queryClient.clear();
    router.push('/login');
  };

  const user = me.data && {
    name: me.data.fullname,
    detail: me.data.email || me.data.username,
    avatarUrl: me.data.avatar?.thumbnail_url || me.data.avatar?.url,
  };

  return <UserMenu user={user} onLogout={logout} variant={variant} />;
}
