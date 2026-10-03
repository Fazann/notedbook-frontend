import {
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  type Category,
  type CategoryFormValues,
  type Expense,
  type ExpenseInput,
  type ExpenseSummary,
} from '@/features/expense/types';
import { type Currency, minorToInput, parseMoneyInput } from '@/lib/money';

import en from '../../messages/en.json';

/** `CategoryRes` of the Go API. */
export type ApiCategory = {
  id: number;
  /** Base name (for default categories: the English name). */
  name: string;
  /** Name in the request language, falling back to `name`. */
  display_name: string;
  /** Names per language (en, km, ms). */
  translations: Record<string, string>;
  is_default: boolean;
  expense_count: number;
  icon: string;
  color: string;
  created_at: string;
  updated_at: string;
};

/** `ExpenseRes` of the Go API: `amount` is a decimal string in the major unit ("12.50", "40000"). */
export type ApiExpense = {
  id: number;
  amount: string;
  currency: Currency;
  category_id: number;
  spent_at: string;
  note: string;
  created_at: string;
  updated_at: string;
};

/** `ExpenseSummaryRes` of the Go API, amounts as decimal strings. */
export type ApiExpenseSummary = {
  month: string;
  totals: { currency: Currency; amount: string; count: number }[];
  by_category: { category_id: number; currency: Currency; amount: string; count: number }[];
};

/**
 * Default categories are matched to `category.defaults.<key>` by their English base name ("Phone & Internet" →
 * `phoneInternet`), so they are translated like the rest of the UI.
 * TODO(api): return a stable `key` for default categories instead of relying on the English name.
 */
const DEFAULT_KEYS = new Map(Object.entries(en.category.defaults).map(([key, name]) => [name, key]));

const isIcon = (v: string): v is Category['icon'] => (CATEGORY_ICONS as readonly string[]).includes(v);
const isColor = (v: string): v is Category['color'] => (CATEGORY_COLORS as readonly string[]).includes(v);

export function toCategory(c: ApiCategory): Category {
  return {
    id: c.id,
    key: c.is_default ? (DEFAULT_KEYS.get(c.name) ?? null) : null,
    // A default without a known key shows the API's translated name.
    name: c.is_default && !DEFAULT_KEYS.has(c.name) ? c.display_name : c.name,
    nameKm: c.translations.km ?? '',
    // An icon or color this app version does not know yet falls back instead of breaking the page.
    icon: isIcon(c.icon) ? c.icon : 'ellipsis',
    color: isColor(c.color) ? c.color : 'slate',
    isDefault: c.is_default,
    expenseCount: c.expense_count,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  };
}

/**
 * Request body for create / update. The form edits only the Khmer name; `current` keeps the other translations
 * (an update replaces all of them). A blank Khmer name removes it.
 */
export function toCategoryBody(input: CategoryFormValues, current: Record<string, string> = {}) {
  return {
    name: input.name,
    translations: { ...current, km: input.nameKm },
    icon: input.icon,
    color: input.color,
  };
}

/** "12.50" USD → 1250. Throws on a value the API should never send, rather than showing a wrong amount. */
export function decimalToMinor(amount: string, currency: Currency): number {
  const minor = parseMoneyInput(amount, currency);
  if (minor === null) throw new Error(`Invalid ${currency} amount from the API: "${amount}"`);
  return minor;
}

export function toExpense(e: ApiExpense): Expense {
  return {
    id: e.id,
    amount: decimalToMinor(e.amount, e.currency),
    currency: e.currency,
    category_id: e.category_id,
    note: e.note,
    spent_at: e.spent_at,
    created_at: e.created_at,
  };
}

export function toExpenseBody(input: ExpenseInput) {
  return { ...input, amount: minorToInput(input.amount, input.currency) };
}

export function toExpenseSummary(s: ApiExpenseSummary): ExpenseSummary {
  return {
    month: s.month,
    totals: s.totals.map((t) => ({
      currency: t.currency,
      amount: decimalToMinor(t.amount, t.currency),
      count: t.count,
    })),
    by_category: s.by_category.map((c) => ({
      category_id: c.category_id,
      currency: c.currency,
      amount: decimalToMinor(c.amount, c.currency),
    })),
  };
}

/** List sort keys are camelCase in the app and snake_case in the API: "-expenseCount" → "-expense_count". */
export function toApiSort(sort: string): string {
  return sort.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}
