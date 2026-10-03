import { CURRENCIES, type Currency } from '@/lib/money';
import { ApiError } from '@/services/api-call';

import type { Category, CategoryColor, ExpenseFilterKey } from './types';

/** The part of a next-intl translator these helpers need (a root `useTranslations()` / `getTranslations()`). */
type Translate = { (key: string, values?: Record<string, string | number>): string; has: (key: string) => boolean };

/**
 * The name to display for a category: default categories are translated by `key`; user-created ones are shown
 * exactly as typed — the Khmer name in the Khmer UI when there is one, otherwise the name.
 * Use it everywhere a category name is shown.
 */
export function getCategoryName(
  category: (Pick<Category, 'key' | 'name'> & Partial<Pick<Category, 'nameKm'>>) | undefined,
  t: Translate,
  locale: string
): string {
  if (!category) return '';
  const key = `category.defaults.${category.key}`;
  if (category.key && t.has(key)) return t(key);
  return (locale === 'km' && category.nameKm?.trim()) || category.name;
}

/** Maps category API errors to translated text. */
export function categoryErrorMessage(error: unknown, t: Translate): string {
  if (error instanceof ApiError) {
    if (error.code === 'CATEGORY_NAME_TAKEN') return t('category.validation.nameTaken');
    if (error.code === 'CATEGORY_IS_DEFAULT') return t('category.defaultCannotDelete');
  }
  return t('category.toast.error');
}

/** Static class names (so Tailwind can see them) for each category color. */
export const CATEGORY_COLOR_CLASSES: Record<CategoryColor, { solid: string; soft: string }> = {
  'chart-1': { solid: 'bg-category-chart-1', soft: 'bg-category-chart-1/15 text-category-chart-1' },
  'chart-2': { solid: 'bg-category-chart-2', soft: 'bg-category-chart-2/15 text-category-chart-2' },
  'chart-3': { solid: 'bg-category-chart-3', soft: 'bg-category-chart-3/15 text-category-chart-3' },
  'chart-4': { solid: 'bg-category-chart-4', soft: 'bg-category-chart-4/15 text-category-chart-4' },
  'chart-5': { solid: 'bg-category-chart-5', soft: 'bg-category-chart-5/15 text-category-chart-5' },
  red: { solid: 'bg-category-red', soft: 'bg-category-red/15 text-category-red' },
  orange: { solid: 'bg-category-orange', soft: 'bg-category-orange/15 text-category-orange' },
  amber: { solid: 'bg-category-amber', soft: 'bg-category-amber/15 text-category-amber' },
  green: { solid: 'bg-category-green', soft: 'bg-category-green/15 text-category-green' },
  teal: { solid: 'bg-category-teal', soft: 'bg-category-teal/15 text-category-teal' },
  blue: { solid: 'bg-category-blue', soft: 'bg-category-blue/15 text-category-blue' },
  violet: { solid: 'bg-category-violet', soft: 'bg-category-violet/15 text-category-violet' },
  pink: { solid: 'bg-category-pink', soft: 'bg-category-pink/15 text-category-pink' },
  slate: { solid: 'bg-category-slate', soft: 'bg-category-slate/15 text-category-slate' },
};

export type ExpenseFilters = { month: string; categoryId?: number; currency?: Currency };

/**
 * Validates the expenses list's URL filters. An invalid or missing month means `fallbackMonth`
 * (the current month); an invalid category or currency means "all".
 */
export function parseExpenseFilters(raw: Record<ExpenseFilterKey, string>, fallbackMonth: string): ExpenseFilters {
  const categoryId = Number(raw.category);
  return {
    month: /^\d{4}-(0[1-9]|1[0-2])$/.test(raw.month) ? raw.month : fallbackMonth,
    categoryId: raw.category !== '' && Number.isInteger(categoryId) && categoryId > 0 ? categoryId : undefined,
    currency: (CURRENCIES as readonly string[]).includes(raw.currency) ? (raw.currency as Currency) : undefined,
  };
}
