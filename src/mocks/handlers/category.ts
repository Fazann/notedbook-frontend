import type { Category, CategoryFormValues } from '@/features/expense/types';
import { ApiError } from '@/lib/api-client';
import { paginate, parseSort, type ListParams, type Paginated } from '@/lib/list';

import en from '../../../messages/en.json';
import km from '../../../messages/km.json';
import ms from '../../../messages/ms.json';
import { db, nextId } from '../db';
import { copy, delay } from '../delay';
import type { StoredCategory } from '../seed';

const DEFAULT_NAMES: Record<string, Record<string, string>> = {
  en: en.category.defaults,
  km: km.category.defaults,
  ms: ms.category.defaults,
};

/** The name the user sees — what search and sort use (the real API does the same with Accept-Language). */
function displayName(category: StoredCategory, locale: string): string {
  if (category.key && DEFAULT_NAMES[locale]?.[category.key]) return DEFAULT_NAMES[locale][category.key];
  return (locale === 'km' && category.nameKm.trim()) || category.name;
}

/** Search matches the shown name and both typed names, so "gym" and "ហាត់ប្រាណ" both find Gym in any language. */
function matches(category: StoredCategory, query: string, locale: string): boolean {
  return [displayName(category, locale), category.name, category.nameKm].some((n) =>
    n.toLocaleLowerCase(locale).includes(query)
  );
}

function withCount(category: StoredCategory): Category {
  return { ...category, expenseCount: db.expenses.filter((e) => e.category_id === category.id).length };
}

const normalize = (name: string) => name.trim().toLocaleLowerCase();

function assertNameFree(name: string, exceptId?: number) {
  const taken = db.categories.some((c) => c.id !== exceptId && normalize(c.name) === normalize(name));
  if (taken) throw new ApiError(409, 'CATEGORY_NAME_TAKEN', 'A category with this name already exists');
}

function find(id: number): StoredCategory {
  const category = db.categories.find((c) => c.id === id);
  if (!category) throw new ApiError(404, 'NOT_FOUND', 'Category not found');
  return category;
}

/** GET /categories?page=&pageSize=&q=&sort= */
export async function listCategories(params: ListParams, locale = 'en'): Promise<Paginated<Category>> {
  await delay();
  const query = params.search.trim().toLocaleLowerCase(locale);
  const items = db.categories.filter((c) => !query || matches(c, query, locale)).map(withCount);

  const sort = parseSort(params.sort) ?? { key: 'name', dir: 'asc' };
  const byName = (a: Category, b: Category) => displayName(a, locale).localeCompare(displayName(b, locale), locale);
  const compare: Record<string, (a: Category, b: Category) => number> = {
    name: byName,
    expenseCount: (a, b) => a.expenseCount - b.expenseCount || byName(a, b),
    createdAt: (a, b) => a.createdAt.localeCompare(b.createdAt) || a.id - b.id,
  };
  const fn = compare[sort.key] ?? byName;
  items.sort((a, b) => (sort.dir === 'desc' ? -fn(a, b) : fn(a, b)));

  return copy(paginate(items, params.page, params.pageSize));
}

/** GET /categories/all — for comboboxes, no paging. Defaults first, then in creation order. */
export async function listAllCategories(): Promise<Category[]> {
  await delay();
  return copy(db.categories.map(withCount));
}

/** POST /categories */
export async function createCategory(input: CategoryFormValues): Promise<Category> {
  await delay();
  assertNameFree(input.name);
  const now = new Date().toISOString();
  const category: StoredCategory = {
    id: nextId(db.categories),
    key: null,
    name: input.name.trim(),
    nameKm: input.nameKm.trim(),
    icon: input.icon,
    color: input.color,
    isDefault: false,
    createdAt: now,
    updatedAt: now,
  };
  db.categories.push(category);
  return copy(withCount(category));
}

/** PUT /categories/:id — the name of a default category cannot change (it follows the app language). */
export async function updateCategory(id: number, input: CategoryFormValues): Promise<Category> {
  await delay();
  const category = find(id);
  if (!category.isDefault) assertNameFree(input.name, id);
  Object.assign(category, {
    name: category.isDefault ? category.name : input.name.trim(),
    nameKm: category.isDefault ? category.nameKm : input.nameKm.trim(),
    icon: input.icon,
    color: input.color,
    updatedAt: new Date().toISOString(),
  });
  return copy(withCount(category));
}

/** DELETE /categories/:id?reassignTo=:otherId */
export async function deleteCategory(id: number, reassignTo?: number): Promise<void> {
  await delay();
  const category = find(id);
  if (category.isDefault) throw new ApiError(400, 'CATEGORY_IS_DEFAULT', 'Default categories cannot be deleted');

  const inUse = db.expenses.some((e) => e.category_id === id);
  if (inUse) {
    if (reassignTo === undefined) throw new ApiError(409, 'CATEGORY_IN_USE', 'Category has expenses');
    if (reassignTo === id) throw new ApiError(400, 'INVALID_REASSIGN', 'Cannot move expenses to the same category');
    find(reassignTo);
    db.expenses = db.expenses.map((e) => (e.category_id === id ? { ...e, category_id: reassignTo } : e));
  }
  db.categories = db.categories.filter((c) => c.id !== id);
}
