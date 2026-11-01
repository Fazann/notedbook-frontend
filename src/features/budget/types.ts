import { z } from 'zod';

import { CURRENCIES } from '@/lib/money';

export const BUDGET_STATUSES = ['ok', 'near', 'over'] as const;
export type BudgetStatus = (typeof BUDGET_STATUSES)[number];

/** Share of the limit at which the user can choose to be warned. */
export const ALERT_PERCENTS = [50, 60, 70, 80, 90, 100] as const;
export const DEFAULT_ALERT_PERCENT = 80;

/**
 * A monthly limit on total spending in one currency (at most one per currency), compared by the API with one month.
 * `spent` and `amount` are integer minor units: USD cents, KHR riel, MYR sen.
 */
export const budgetSchema = z.object({
  id: z.number(),
  amount: z.number().int(),
  currency: z.enum(CURRENCIES),
  alert_percent: z.number().int(),
  spent: z.number().int(),
  /** Share of `amount` spent, rounded down; above 100 when over budget. */
  percent: z.number().int(),
  status: z.enum(BUDGET_STATUSES),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Budget = z.infer<typeof budgetSchema>;

export type BudgetInput = Pick<Budget, 'amount' | 'currency' | 'alert_percent'>;

/** Form schema. Messages are translation keys (`budget.form.*`), translated in the form component. */
export const budgetFormSchema = z.object({
  amount: z.string().min(1, 'amountRequired'),
  currency: z.enum(CURRENCIES),
  alert_percent: z.number().int(),
});
export type BudgetFormValues = z.infer<typeof budgetFormSchema>;
