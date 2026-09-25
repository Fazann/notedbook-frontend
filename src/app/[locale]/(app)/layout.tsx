import { setRequestLocale } from 'next-intl/server';

import { AppShell } from '@/components/layout/app-shell';
import { AccountMenu } from '@/features/auth/components/account-menu';
import { QuickAddExpense } from '@/features/expense/components/quick-add-expense';
import type { Locale } from '@/i18n/routing';

// TODO(api): protect these routes (session cookie check in proxy.ts) once real auth exists.
export default async function AppLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  return (
    <AppShell
      headerUser={<AccountMenu variant="avatar" />}
      sidebarUser={<AccountMenu variant="sidebar" />}
      overlays={<QuickAddExpense />}
    >
      {children}
    </AppShell>
  );
}
