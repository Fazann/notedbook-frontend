'use client';

import { UserMenu } from '@/components/layout/user-menu';

import { useMe } from '../hooks';
import { useSignOut } from '../use-sign-out';

export type AccountMenuProps = { variant?: 'avatar' | 'sidebar' };

export function AccountMenu({ variant }: AccountMenuProps) {
  const me = useMe();
  const signOut = useSignOut();
  const logout = () => signOut();

  const user = me.data && {
    name: me.data.fullname,
    detail: me.data.email || me.data.username,
    avatarUrl: me.data.avatar?.thumbnail_url || me.data.avatar?.url,
  };

  return <UserMenu user={user} onLogout={logout} variant={variant} />;
}
