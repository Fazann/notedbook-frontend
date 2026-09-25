import { z } from 'zod';

import type { ListParams } from '@/lib/list';
import { CURRENCIES, type Currency } from '@/lib/money';

export const currencySchema = z.enum(CURRENCIES);

/** Lucide icon names a category can use. */
export const CATEGORY_ICONS = [
  'utensils',
  'coffee',
  'bike',
  'car',
  'bus',
  'home',
  'wifi',
  'smartphone',
  'users',
  'baby',
  'shopping-bag',
  'shirt',
  'heart-pulse',
  'pill',
  'book-open',
  'graduation-cap',
  'gift',
  'plane',
  'gamepad-2',
  'dumbbell',
  'dog',
  'receipt',
  'piggy-bank',
  'ellipsis',
] as const;

/** Each maps to a `--category-<color>` theme token (light + dark) in globals.css. */
export const CATEGORY_COLORS = [
  'chart-1',
  'chart-2',
  'chart-3',
  'chart-4',
  'chart-5',
  'red',
  'orange',
  'amber',
  'green',
  'teal',
  'blue',
  'violet',
  'pink',
  'slate',
] as const;

export const categorySchema = z.object({
  id: z.number(),
  /** "food" for default categories → translated as `category.defaults.<key>`; null for user-created. */
  key: z.string().nullable(),
  /** The user's text — shown as-is when `key` is null (and in English, or when `nameKm` is empty). */
  name: z.string(),
  /** Optional Khmer name, shown instead of `name` in the Khmer UI; '' when not set. Unused for defaults. */
  nameKm: z.string(),
  icon: z.enum(CATEGORY_ICONS),
  color: z.enum(CATEGORY_COLORS),
  /** Default categories cannot be deleted, and their name follows the app language. */
  isDefault: z.boolean(),
  /** Number of expenses using this category. */
  expenseCount: z.number().int(),
  /** RFC3339 */
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Category = z.infer<typeof categorySchema>;
export type CategoryIcon = Category['icon'];
export type CategoryColor = Category['color'];

/** Sort keys the categories list accepts (prefix "-" for descending). */
export const CATEGORY_SORT_KEYS = ['name', 'expenseCount', 'createdAt'] as const;

/** Form schema. Messages are keys under `category.validation`, translated in the form. */
export const categoryFormSchema = z.object({
  name: z.string().trim().min(1, 'required').max(50, 'tooLong'),
  /** Optional. */
  nameKm: z.string().trim().max(50, 'tooLong'),
  icon: z.enum(CATEGORY_ICONS),
  color: z.enum(CATEGORY_COLORS),
});
export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
export const CATEGORY_NAME_MAX = 50;

export const expenseSchema = z.object({
  id: z.number(),
  /** Integer minor units: USD cents, KHR riel. */
  amount: z.number().int(),
  currency: currencySchema,
  category_id: z.number(),
  note: z.string(),
  /** Plain date `YYYY-MM-DD`. */
  spent_at: z.string(),
  created_at: z.string(),
});
export type Expense = z.infer<typeof expenseSchema>;

export type ExpenseInput = Pick<Expense, 'amount' | 'currency' | 'category_id' | 'note' | 'spent_at'>;

/** Sort keys the expenses list accepts (prefix "-" for descending). */
export const EXPENSE_SORT_KEYS = ['spent_at', 'amount'] as const;
export const EXPENSE_DEFAULT_SORT = '-spent_at';

/** URL filters of the expenses list (besides page / search / sort). Empty string = not set. */
export const EXPENSE_FILTER_KEYS = ['month', 'category', 'currency'] as const;
export type ExpenseFilterKey = (typeof EXPENSE_FILTER_KEYS)[number];

/** Expenses list query: one month, optionally one category and / or currency. `search` matches the note. */
export type ExpenseListParams = ListParams & {
  /** `YYYY-MM` */
  month: string;
  categoryId?: number;
  currency?: Currency;
};

export const expenseSummarySchema = z.object({
  month: z.string(),
  totals: z.array(z.object({ currency: currencySchema, amount: z.number().int(), count: z.number().int() })),
  by_category: z.array(z.object({ category_id: z.number(), currency: currencySchema, amount: z.number().int() })),
});
export type ExpenseSummary = z.infer<typeof expenseSummarySchema>;

/** Form schema. Messages are translation keys (`expense.form.*`), translated in the form component. */
export const expenseFormSchema = z.object({
  amount: z.string().min(1, 'amountRequired'),
  currency: currencySchema,
  category_id: z.number({ error: 'categoryRequired' }).int().positive('categoryRequired'),
  spent_at: z.string().min(1, 'dateRequired'),
  note: z.string().max(200, 'noteTooLong'),
});
export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;
