'use client';

import { useUiStore } from '@/stores/ui-store';

import { ExpenseFormDialog } from './expense-form-dialog';

/** The app-wide "add expense" dialog, opened from the FAB or any "Add expense" button via the ui store. */
export function QuickAddExpense() {
  const open = useUiStore((s) => s.isQuickAddOpen);
  const close = useUiStore((s) => s.closeQuickAdd);
  return <ExpenseFormDialog open={open} onOpenChange={(next) => !next && close()} />;
}
