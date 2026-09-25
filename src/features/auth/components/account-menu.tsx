'use client';

import { useQueryClient } from '@tanstack/react-query';

import { UserMenu } from '@/components/layout/user-menu';
import { useRouter } from '@/i18n/navigation';
import { usePreferencesStore } from '@/stores/preferences-store';
import { useUiStore } from '@/stores/ui-store';

import { useMe } from '../hooks';

export type AccountMenuProps = { variant?: 'avatar' | 'sidebar' };

export function AccountMenu({ variant }: AccountMenuProps) {
  const me = useMe();
  const queryClient = useQueryClient();
  const router = useRouter();

  const logout = () => {
    // TODO(api): call POST /auth/logout once real auth exists.
    useUiStore.getState().reset();
    usePreferencesStore.getState().reset();
    queryClient.clear();
    router.push('/login');
  };

  return <UserMenu user={me.data} onLogout={logout} variant={variant} />;
}
