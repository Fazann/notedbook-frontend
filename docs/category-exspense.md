# Feature spec — Expense Categories page (CRUD)

Task brief for the coding agent. Read `AGENTS.md` and `STARTER.md` first; all their rules apply
(shadcn/ui, TanStack Query, Zustand, i18n en + km, responsive, mock data in Phase 1, ESLint/Prettier).

## 1. Goal

A page where the user can **list, search, sort, create, edit and delete** expense categories,
with **pagination**. It is built on a **reusable list page system** that the Expenses list, Goals list
and Boards list will reuse later.

- Route: `/[locale]/expenses/categories`
- Entry points: a `Tabs` switch on the Expenses page header — **Expenses | Categories** — and a
  "Manage categories" item at the bottom of the category combobox in the expense form.
- Phase 1: data from the mock layer (`src/mocks/handlers/category.ts`). No backend.

## 2. Step 0 — reuse or create the reusable list components

**Before writing anything, search** `src/components/shared/`, `src/components/layout/` and `src/hooks/` for
existing list, table, pagination or toolbar components (`list-page`, `data-list`, `data-table`,
`pagination`, `use-list-params`...).

- If they exist → use them. If something is missing, **extend** them with a new prop or variant.
  Do not create a second version.
- If they do not exist → create the components below in `components/shared/` (and the hook in
  `hooks/`), then build the categories page with them.

Add the shadcn parts they need with the CLI if missing:

```bash
pnpm dlx shadcn@latest add table pagination select input button dropdown-menu skeleton badge
```

### 2.1 Shared types — `src/lib/list.ts`

```ts
export type SortDir = "asc" | "desc";

export type ListParams = {
  page: number;        // 1-based
  pageSize: number;    // 10 | 20 | 50
  search: string;
  sort?: string;       // e.g. "name" | "-name" | "-expenseCount"  ("-" = desc)
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;       // total items matching the filter
  totalPages: number;
};

export type Paginated<T> = { data: T[]; meta: PaginationMeta };

export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
export const DEFAULT_PAGE_SIZE = 10;
```

The real API must return this same `Paginated<T>` shape — the mock handlers return it now.

### 2.2 `useListParams` — `src/hooks/use-list-params.ts`

Keeps list state in the **URL search params** (shareable, back button works). Not in Zustand.

```ts
const { params, setPage, setPageSize, setSearch, setSort } = useListParams({ defaultSort: "name" });
// URL: /en/expenses/categories?page=2&pageSize=20&q=food&sort=-expenseCount
```

Rules:
- Parse and validate with zod; invalid values fall back to defaults (`page=1`, `pageSize=10`).
- `setSearch` is debounced (300 ms, `useDebounce`) and **resets page to 1**.
- `setPageSize` and `setSort` also reset page to 1.
- Uses the locale-aware router from `src/i18n/navigation.ts` with `router.replace(..., { scroll: false })`.
- Default values are removed from the URL (clean URLs).

### 2.3 Components

| Component | File | Purpose |
|---|---|---|
| `ListPage` | `components/shared/list-page.tsx` | Page layout: `PageHeader` (title, description, primary action) + toolbar slot + content + pagination slot |
| `ListToolbar` | `components/shared/list-toolbar.tsx` | Search input (with clear button) + `filters` slot + `actions` slot; stacks on phones |
| `DataList<T>` | `components/shared/data-list.tsx` | Generic list: `Table` on `md+`, card list on phones; handles loading / empty / no results / error |
| `DataListRowActions` | `components/shared/data-list-row-actions.tsx` | "⋯" `DropdownMenu` built from an `actions` array (label, icon, onSelect, destructive, disabled) |
| `SortableHeader` | `components/shared/sortable-header.tsx` | Clickable column header showing ↑ / ↓, with `aria-sort` |
| `Pagination` | `components/shared/pagination.tsx` | Page controls + "Showing X–Y of Z" + page size select |

`DataList<T>` props (generic, no knowledge of categories):

```ts
export type DataListColumn<T> = {
  id: string;
  header: React.ReactNode;                 // translated text passed in by the caller
  cell: (item: T) => React.ReactNode;
  sortKey?: string;                        // if set, header is sortable
  className?: string;
  align?: "start" | "end";
};

export type DataListProps<T> = {
  items: T[] | undefined;
  columns: DataListColumn<T>[];
  getRowId: (item: T) => string | number;
  renderMobileItem: (item: T) => React.ReactNode; // card layout for phones
  rowActions?: (item: T) => RowAction[];
  onRowClick?: (item: T) => void;
  sort?: string;
  onSortChange?: (sort: string) => void;
  isLoading?: boolean;          // first load → skeleton rows (count = pageSize, max 10)
  isFetching?: boolean;         // page change → keep old rows, dim them, no layout jump
  isError?: boolean;
  onRetry?: () => void;
  isFiltered?: boolean;         // decides "no results" vs "empty"
  emptyState: React.ReactNode;  // shown when there is no data at all
  noResultsState?: React.ReactNode; // default: shared "No results for “{query}”" + clear button
  caption?: string;             // screen-reader caption for the table
};
```

`Pagination` props:

```ts
export type PaginationProps = {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: readonly number[];
  disabled?: boolean;
};
```

Pagination behavior:
- Desktop (`md+`): "Showing 11–20 of 47" · page size select · ‹ Prev · 1 … 4 **5** 6 … 12 · Next ›
  (max 7 page buttons, ellipsis for gaps).
- Phone: "Page 2 of 5" · ‹ · › only (44px targets). Page size select hidden.
- Hidden completely when `total === 0`; page numbers hidden when `totalPages === 1`.
- Current page has `aria-current="page"`; nav wrapper has `aria-label` from translations.
- Prev disabled on page 1, Next disabled on the last page.
- On page change, scroll the list top into view (smooth), not the whole window to 0.
- Numbers formatted with next-intl `format.number` (so Khmer locale works).

Rules for all these components:
- **No hardcoded text.** Common list text comes from the `list.*` namespace (see §6); feature text is
  passed in by the caller as props.
- No data fetching inside them. They get data and callbacks via props.
- Theme tokens only; responsive at 360px; keyboard accessible; forward `className`.
- Unit tests for `Pagination` (page ranges, ellipsis, disabled states) and `useListParams`
  (parsing, reset-to-page-1 rules).

## 3. Data model

```ts
// features/expense/types.ts
export type CategoryColor = "chart-1" | "chart-2" | "chart-3" | "chart-4" | "chart-5"
  | "red" | "orange" | "amber" | "green" | "teal" | "blue" | "violet" | "pink" | "slate";
  // each maps to a theme token --category-<color> (light + dark) in globals.css

export type Category = {
  id: number;
  key: string | null;       // "food" for default categories → translated; null for user-created
  name: string;             // user's text (shown as-is when key is null)
  icon: string;             // lucide icon name from CATEGORY_ICONS
  color: CategoryColor;
  isDefault: boolean;       // default categories cannot be deleted
  expenseCount: number;     // number of expenses using it
  createdAt: string;        // RFC3339
  updatedAt: string;
};

export const categoryFormSchema = z.object({
  name: z.string().trim().min(1, "required").max(50, "tooLong"),
  icon: z.enum(CATEGORY_ICONS),
  color: z.enum(CATEGORY_COLORS),
});
export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
// zod messages are translation KEYS ("required", "tooLong"), translated in the form (see AGENTS.md)
```

`CATEGORY_ICONS` (lucide, ~24 icons): `utensils, coffee, bike, car, bus, home, wifi, smartphone, users,
baby, shopping-bag, shirt, heart-pulse, pill, book-open, graduation-cap, gift, plane, gamepad-2,
dumbbell, dog, receipt, piggy-bank, ellipsis`.

Display name helper (in `features/expense/utils.ts`):
`getCategoryName(category, t)` → `category.key ? t(\`category.defaults.${category.key}\`) : category.name`.
Use it **everywhere** a category name is shown (list, badges, charts, combobox).

## 4. CRUD functions

### 4.1 API contract (the mock implements it now)

```
GET    /categories?page=1&pageSize=10&q=food&sort=-expenseCount   → Paginated<Category>
GET    /categories/all                                            → Category[]  (for comboboxes, no paging)
POST   /categories            { name, icon, color }               → Category (201)
PUT    /categories/:id        { name, icon, color }               → Category
DELETE /categories/:id?reassignTo=:otherId                        → 204
```

Errors (`ApiError.code`):
- `CATEGORY_NAME_TAKEN` (409) — name already exists for this user (case-insensitive, trimmed)
- `CATEGORY_IS_DEFAULT` (400) — trying to delete a default category
- `CATEGORY_IN_USE` (409) — has expenses and no `reassignTo` given
- `NOT_FOUND` (404)

Sort keys allowed: `name`, `expenseCount`, `createdAt` (with `-` for desc). Default `name`.
Search: case-insensitive match on the **displayed** name (translated name for default categories in the
current locale — the mock receives `locale` for this; the real API will get `Accept-Language`).

### 4.2 `features/expense/api.ts`

```ts
export function listCategories(params: ListParams): Promise<Paginated<Category>>;
export function listAllCategories(): Promise<Category[]>;
export function createCategory(input: CategoryFormValues): Promise<Category>;
export function updateCategory(id: number, input: CategoryFormValues): Promise<Category>;
export function deleteCategory(id: number, reassignTo?: number): Promise<void>;
```

Each function: `env.useMocks ? mockHandlers.x(...) : apiClient.x(...)` (see `STARTER.md §2`).

### 4.3 Mock handlers — `src/mocks/handlers/category.ts`

- Seed: the 10 default categories from `STARTER.md` **plus ~15 user categories** (e.g. "Gym", "Netflix",
  "Wedding gifts", "Motorbike repair", "Pet food", "Books", "Haircut"...) so pagination shows 3 pages at
  size 10.
- Implement search, sort, paging and the error codes above exactly like the contract.
- `expenseCount` is computed from the mock expenses.
- Delete with `reassignTo` moves those mock expenses to the other category.
- Use `delay()` and the optional random error (`NEXT_PUBLIC_MOCK_ERRORS`).

### 4.4 Query keys and hooks — `lib/query-keys.ts`, `features/expense/hooks.ts`

```ts
qk.categories.all                  // ["categories"]
qk.categories.list(params)         // ["categories", "list", params]
qk.categories.options()            // ["categories", "options"]   (listAllCategories)
```

| Hook | Notes |
|---|---|
| `useCategories(params)` | `placeholderData: keepPreviousData` so page changes don't flash empty; `isFetching` dims the list |
| `useCategoryOptions()` | for the expense form combobox; `staleTime: 5 min` |
| `useCreateCategory()` | on success: toast, invalidate `qk.categories.all`, close dialog |
| `useUpdateCategory()` | on success: toast, invalidate `qk.categories.all` **and** expense lists/summary (names/colors show there) |
| `useDeleteCategory()` | **optimistic**: remove row from the current page cache; `onError` rollback + error toast; `onSettled` invalidate categories + expenses + summary |

After a delete, if the current page becomes empty and `page > 1`, go to `page - 1`
(check `meta.totalPages` after refetch and clamp).

## 5. Page UI

Files:
```
app/[locale]/(app)/expenses/categories/page.tsx          # thin: renders <CategoriesPage />
features/expense/components/categories-page.tsx          # uses ListPage + DataList + Pagination
features/expense/components/category-form-dialog.tsx     # create + edit (same component)
features/expense/components/category-delete-dialog.tsx   # confirm + reassign
features/expense/components/category-icon-picker.tsx
features/expense/components/category-color-picker.tsx
features/expense/components/category-badge.tsx          # icon + color + name (reused in expense list)
```

### 5.1 Layout

```
Desktop (md+)
┌───────────────────────────────────────────────────────────────────┐
│ Expenses › Categories                              [+ Add category]│
│ [ Expenses | Categories ]  (tabs)                                  │
├───────────────────────────────────────────────────────────────────┤
│ [🔍 Search categories…        ✕]                    Sort: [Name ▾] │
├───────────────────────────────────────────────────────────────────┤
│ Category ↑            │ Expenses ↕ │ Created ↕     │              │
│ 🍜 Food   [Default]    │ 18         │ 1 Sep 2026    │     ⋯        │
│ 🏋 Gym                 │ 4          │ 12 Sep 2026   │     ⋯        │
│ …                                                                 │
├───────────────────────────────────────────────────────────────────┤
│ Showing 1–10 of 25   Rows per page [10 ▾]    ‹ Prev  1 2 3  Next › │
└───────────────────────────────────────────────────────────────────┘

Phone
┌─────────────────────────────┐
│ Categories              [+] │
│ [ Expenses | Categories ]   │
│ [🔍 Search…            ✕]   │
│ ┌─────────────────────────┐ │
│ │ 🍜 Food  Default     ⋯  │ │
│ │ 18 expenses             │ │
│ └─────────────────────────┘ │
│ …                           │
│  ‹   Page 1 of 3   ›        │
└─────────────────────────────┘
```

- Columns: **Category** (`CategoryBadge`, sortable by `name`), **Expenses** (count, sortable, links to
  `/expenses?category=<id>`), **Created** (date via `format.dateTime`, sortable), **actions** (⋯).
- Row actions: *Edit*, *View expenses*, *Delete* (destructive; disabled with a tooltip/description
  "Default categories can't be deleted" when `isDefault`).
- Phone: the sort control is a `Select` in the toolbar (table headers are not visible).
- Default categories show a `Badge variant="secondary"` "Default".

### 5.2 Create / edit dialog (`ResponsiveDialog`)

Fields:
1. **Name** — `Input`, autofocus, max 50 chars with counter. For a default category, the name field
   shows the translated name and is **read-only** with a hint "Default names follow the app language"
   (only icon and color can change).
2. **Icon** — grid of icon buttons (`role="radiogroup"`, arrow-key navigation).
3. **Color** — row of color swatches (`role="radiogroup"`, each swatch has a translated `aria-label`,
   selected swatch shows a ✓ so color is not the only signal).
4. **Preview** — live `CategoryBadge` with the current values.

- Buttons: Cancel / Save (Save shows a spinner and is disabled while submitting).
- Server error `CATEGORY_NAME_TAKEN` → shown under the Name field (`form.setError`).
- Unsaved changes + close → ask "Discard changes?" (`ConfirmDialog`).
- Create success toast: "Category created". Edit: "Changes saved".

### 5.3 Delete dialog (`ConfirmDialog` / `AlertDialog`)

- `expenseCount === 0` → "Delete “{name}”? This can't be undone." → Delete.
- `expenseCount > 0` → explain "{count} expenses use this category. Move them to:" + category `Select`
  (required, excludes itself, default "Other") → Delete and move.
- Success toast: "Category deleted".

### 5.4 States

| State | UI |
|---|---|
| First load | 10 skeleton rows (table) / 5 skeleton cards (phone) |
| Changing page / sort | old rows stay, dimmed (`opacity-60`), pagination disabled |
| Empty (no categories) | `EmptyState` icon `tags`, "No categories yet", button "Add category" |
| No results for search | "No results for “{query}”" + "Clear search" button |
| Error | `ErrorState` "Could not load categories" + "Try again" (`refetch`) |

## 6. Translations (en + km)

Add to **both** `messages/en.json` and `messages/km.json` in the same change. Khmer below is a draft —
add every Khmer key to `messages/TODO-km.md` for native-speaker review.

### 6.1 Shared list namespace — `list` (used by the reusable components)

| Key | en | km |
|---|---|---|
| `list.search` | Search… | ស្វែងរក… |
| `list.clearSearch` | Clear search | សម្អាតការស្វែងរក |
| `list.sortBy` | Sort by | តម្រៀបតាម |
| `list.actions` | Actions | សកម្មភាព |
| `list.moreActions` | More actions | សកម្មភាពបន្ថែម |
| `list.noResults` | No results for “{query}” | រកមិនឃើញលទ្ធផលសម្រាប់ «{query}» |
| `list.errorTitle` | Could not load data | មិនអាចផ្ទុកទិន្នន័យបានទេ |
| `list.retry` | Try again | ព្យាយាមម្ដងទៀត |
| `list.pagination.label` | Pagination | ការបែងចែកទំព័រ |
| `list.pagination.previous` | Previous | មុន |
| `list.pagination.next` | Next | បន្ទាប់ |
| `list.pagination.goToPage` | Go to page {page} | ទៅទំព័រ {page} |
| `list.pagination.pageOf` | Page {page} of {totalPages} | ទំព័រ {page} នៃ {totalPages} |
| `list.pagination.showing` | Showing {from}–{to} of {total} | បង្ហាញ {from}–{to} នៃ {total} |
| `list.pagination.rowsPerPage` | Rows per page | ចំនួនជួរក្នុងមួយទំព័រ |
| `list.sortAsc` | Sorted ascending | តម្រៀបពីតូចទៅធំ |
| `list.sortDesc` | Sorted descending | តម្រៀបពីធំទៅតូច |

### 6.2 Feature namespace — `category`

```json
// en.json
"category": {
  "title": "Categories",
  "description": "Group your expenses to see where your money goes.",
  "tabExpenses": "Expenses",
  "tabCategories": "Categories",
  "add": "Add category",
  "edit": "Edit category",
  "delete": "Delete",
  "viewExpenses": "View expenses",
  "searchPlaceholder": "Search categories…",
  "defaultBadge": "Default",
  "defaultCannotDelete": "Default categories can't be deleted",
  "defaultNameHint": "Default names follow the app language",
  "columns": { "name": "Category", "expenses": "Expenses", "created": "Created" },
  "sort": { "nameAsc": "Name (A–Z)", "nameDesc": "Name (Z–A)", "mostUsed": "Most used", "newest": "Newest" },
  "expenseCount": "{count, plural, =0 {No expenses} one {# expense} other {# expenses}}",
  "form": {
    "name": "Name",
    "namePlaceholder": "e.g. Gym",
    "icon": "Icon",
    "color": "Color",
    "preview": "Preview",
    "save": "Save",
    "cancel": "Cancel",
    "discardTitle": "Discard changes?",
    "discardConfirm": "Discard"
  },
  "validation": {
    "required": "Please enter a name",
    "tooLong": "Name is too long (max {max} characters)",
    "nameTaken": "You already have a category with this name"
  },
  "deleteDialog": {
    "title": "Delete “{name}”?",
    "descriptionEmpty": "This can't be undone.",
    "descriptionInUse": "{count, plural, one {# expense uses} other {# expenses use}} this category. Move {count, plural, one {it} other {them}} to:",
    "moveTo": "Move expenses to",
    "confirm": "Delete",
    "confirmAndMove": "Delete and move"
  },
  "toast": {
    "created": "Category created",
    "updated": "Changes saved",
    "deleted": "Category deleted",
    "error": "Something went wrong. Please try again."
  },
  "empty": { "title": "No categories yet", "description": "Add a category to organize your expenses." },
  "loadError": "Could not load categories",
  "colors": {
    "chart-1": "Color 1", "chart-2": "Color 2", "chart-3": "Color 3", "chart-4": "Color 4", "chart-5": "Color 5",
    "red": "Red", "orange": "Orange", "amber": "Amber", "green": "Green", "teal": "Teal",
    "blue": "Blue", "violet": "Violet", "pink": "Pink", "slate": "Gray"
  },
  "defaults": {
    "food": "Food", "coffee": "Coffee", "transport": "Transport", "rent": "Rent",
    "phoneInternet": "Phone & Internet", "family": "Family", "shopping": "Shopping",
    "health": "Health", "education": "Education", "other": "Other"
  }
}
```

```json
// km.json
"category": {
  "title": "ប្រភេទចំណាយ",
  "description": "ដាក់ការចំណាយជាក្រុម ដើម្បីដឹងថាលុយរបស់អ្នកចាយទៅលើអ្វីខ្លះ។",
  "tabExpenses": "ការចំណាយ",
  "tabCategories": "ប្រភេទ",
  "add": "បន្ថែមប្រភេទ",
  "edit": "កែប្រភេទ",
  "delete": "លុប",
  "viewExpenses": "មើលការចំណាយ",
  "searchPlaceholder": "ស្វែងរកប្រភេទ…",
  "defaultBadge": "លំនាំដើម",
  "defaultCannotDelete": "មិនអាចលុបប្រភេទលំនាំដើមបានទេ",
  "defaultNameHint": "ឈ្មោះលំនាំដើមប្តូរតាមភាសារបស់កម្មវិធី",
  "columns": { "name": "ប្រភេទ", "expenses": "ការចំណាយ", "created": "ថ្ងៃបង្កើត" },
  "sort": { "nameAsc": "ឈ្មោះ (ក–អ)", "nameDesc": "ឈ្មោះ (អ–ក)", "mostUsed": "ប្រើច្រើនបំផុត", "newest": "ថ្មីបំផុត" },
  "expenseCount": "{count, plural, =0 {គ្មានការចំណាយ} other {ការចំណាយ # ដង}}",
  "form": {
    "name": "ឈ្មោះ",
    "namePlaceholder": "ឧ. ហាត់ប្រាណ",
    "icon": "រូបតំណាង",
    "color": "ពណ៌",
    "preview": "មើលជាមុន",
    "save": "រក្សាទុក",
    "cancel": "បោះបង់",
    "discardTitle": "បោះបង់ការកែប្រែ?",
    "discardConfirm": "បោះបង់"
  },
  "validation": {
    "required": "សូមបញ្ចូលឈ្មោះ",
    "tooLong": "ឈ្មោះវែងពេក (អតិបរមា {max} តួអក្សរ)",
    "nameTaken": "អ្នកមានប្រភេទដែលមានឈ្មោះនេះរួចហើយ"
  },
  "deleteDialog": {
    "title": "លុប «{name}»?",
    "descriptionEmpty": "សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។",
    "descriptionInUse": "មានការចំណាយ {count} ដែលប្រើប្រភេទនេះ។ ផ្លាស់ទីវាទៅ៖",
    "moveTo": "ផ្លាស់ទីការចំណាយទៅ",
    "confirm": "លុប",
    "confirmAndMove": "លុប និងផ្លាស់ទី"
  },
  "toast": {
    "created": "បានបង្កើតប្រភេទ",
    "updated": "បានរក្សាទុកការកែប្រែ",
    "deleted": "បានលុបប្រភេទ",
    "error": "មានបញ្ហាកើតឡើង។ សូមព្យាយាមម្ដងទៀត។"
  },
  "empty": { "title": "មិនទាន់មានប្រភេទនៅឡើយ", "description": "បន្ថែមប្រភេទ ដើម្បីរៀបចំការចំណាយរបស់អ្នក។" },
  "loadError": "មិនអាចផ្ទុកប្រភេទបានទេ",
  "colors": {
    "chart-1": "ពណ៌ ១", "chart-2": "ពណ៌ ២", "chart-3": "ពណ៌ ៣", "chart-4": "ពណ៌ ៤", "chart-5": "ពណ៌ ៥",
    "red": "ក្រហម", "orange": "ទឹកក្រូច", "amber": "លឿងទុំ", "green": "បៃតង", "teal": "ខៀវបៃតង",
    "blue": "ខៀវ", "violet": "ស្វាយ", "pink": "ផ្កាឈូក", "slate": "ប្រផេះ"
  },
  "defaults": {
    "food": "អាហារ", "coffee": "កាហ្វេ", "transport": "ការធ្វើដំណើរ", "rent": "ថ្លៃផ្ទះ",
    "phoneInternet": "ទូរស័ព្ទ និងអ៊ីនធឺណិត", "family": "គ្រួសារ", "shopping": "ការទិញទំនិញ",
    "health": "សុខភាព", "education": "ការសិក្សា", "other": "ផ្សេងៗ"
  }
}
```

i18n rules for this feature:
- User-created category names are **never translated**; only `defaults.*` via `getCategoryName`.
- Plurals and numbers through ICU / `format.number` — never `count + " expenses"`.
- Page title via `generateMetadata` using `category.title`.
- Check the page in `km` at 360px: long Khmer names wrap (`break-words`), badges grow in height,
  sort `Select` and pagination still fit on one line.
- Map API error codes: `CATEGORY_NAME_TAKEN → category.validation.nameTaken`,
  `CATEGORY_IS_DEFAULT → category.defaultCannotDelete`, others → `category.toast.error`.

## 7. Tests

- `useListParams`: parses URL, invalid values fall back, search/sort/pageSize reset page to 1.
- `Pagination`: page ranges with ellipsis (1 … 4 5 6 … 12), disabled prev/next, hidden when empty,
  `aria-current`, renders in `en` and `km`.
- `DataList`: loading skeleton, empty vs no-results, error + retry, row actions menu.
- Mock category handler: search, sort, paging meta, name-taken error, delete with reassign.
- `CategoryFormDialog`: validation messages (translated), name-taken server error shown on field,
  submit calls create vs update.
- `CategoryDeleteDialog`: requires "move to" when `expenseCount > 0`; default category can't be deleted.
- Translation key test: `en.json` and `km.json` still have identical keys.

## 8. Acceptance criteria

- [ ] Reusable `ListPage`, `ListToolbar`, `DataList`, `DataListRowActions`, `SortableHeader`, `Pagination`,
      `useListParams` exist in `components/shared` / `hooks` (reused if they existed, created if not) and
      contain no category-specific code.
- [ ] Categories page lists, searches, sorts and paginates (URL keeps state; refresh keeps the same view).
- [ ] Create, edit and delete work against the mock layer; delete with reassign moves the expenses;
      default categories can't be deleted.
- [ ] Optimistic delete rolls back on error (test with `NEXT_PUBLIC_MOCK_ERRORS=true`).
- [ ] Category changes are reflected on the Expenses page and Dashboard (invalidation).
- [ ] All text in `en` and `km`; no hardcoded strings; Khmer keys listed in `messages/TODO-km.md`.
- [ ] Works at 360 / 768 / 1280px, light and dark mode, keyboard only.
- [ ] `pnpm lint && pnpm format:check && pnpm typecheck && pnpm test` pass.