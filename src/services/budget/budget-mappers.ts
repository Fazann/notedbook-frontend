import type { Budget, BudgetInput } from '@/features/budget/types';
import { minorToInput, type Currency } from '@/lib/money';

import { decimalToMinor } from '../expense/expense-mappers';

/** `BudgetRes` of the Go API: `amount` is a decimal string in the major unit ("200.00", "400000"). */
export type ApiBudget = {
  id: number;
  amount: string;
  currency: Currency;
  alert_percent: number;
  created_at: string;
  updated_at: string;
};

/** `BudgetStatusRes` of the Go API: a budget compared with one month. */
export type ApiBudgetStatus = ApiBudget & { spent: string; percent: number; status: Budget['status'] };

export function toBudget(b: ApiBudgetStatus): Budget {
  return {
    ...b,
    amount: decimalToMinor(b.amount, b.currency),
    spent: decimalToMinor(b.spent, b.currency),
  };
}

export function toBudgetBody(input: BudgetInput) {
  return { ...input, amount: minorToInput(input.amount, input.currency) };
}
