import { AppShell } from '@/components/layout/app-shell';
import { AccountMenu } from '@/features/auth/components/account-menu';
import { QuickAddExpense } from '@/features/expense/components/quick-add-expense';

// Signed-out users are redirected to /login by proxy.ts.
export default async function AppLayout({ children }: LayoutProps<'/[locale]'>) {
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
