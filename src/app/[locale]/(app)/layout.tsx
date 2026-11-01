import { AppShell } from '@/components/layout/app-shell';
import { AccountMenu } from '@/features/auth/components/account-menu';
import { BudgetAlertWatcher } from '@/features/budget/components/budget-alert-watcher';
import { QuickAddExpense } from '@/features/expense/components/quick-add-expense';

// Signed-out users are redirected to /login by proxy.ts.
export default async function AppLayout({ children }: LayoutProps<'/[locale]'>) {
  return (
    <AppShell
      headerUser={<AccountMenu variant="avatar" />}
      sidebarUser={<AccountMenu variant="sidebar" />}
      overlays={
        <>
          <QuickAddExpense />
          <BudgetAlertWatcher />
        </>
      }
    >
      {children}
    </AppShell>
  );
}
