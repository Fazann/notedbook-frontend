# AGENTS.md — Frontend (Next.js)

Guide for AI coding agents working on this repo. Read it fully before making changes.

## Project overview

A personal life-management web app with three modules:

1. **Expense** — record expenses (USD / KHR), categories, monthly summary and charts, optional budgets.
2. **Planning** — goals with target dates, milestones (checklist), progress %.
3. **Board** — Trello-style kanban: boards → columns → cards, with drag and drop.

This repo is the **frontend only**. It is a UI client for the Go REST API (separate repo).
The frontend holds **no business logic** that must be trusted: totals, permissions and validation are
always enforced by the API. Client-side validation is for UX only.

## Tech stack

| Concern | Choice |
|---|---|
| Framework | Next.js (App Router), React, TypeScript (`strict: true`) |
| UI components | shadcn/ui (Radix UI primitives + Tailwind), icons from `lucide-react`, toasts with `sonner` |
| Styling | Tailwind CSS with shadcn theme tokens (CSS variables) |
| Server state | TanStack Query (all data from the API) |
| Client global state | Zustand (UI state only — see "State management") |
| Forms | react-hook-form + zod |
| Drag and drop | dnd-kit (`@dnd-kit/core`, `@dnd-kit/sortable`) |
| Charts | Recharts |
| Dates | date-fns (math only; display via next-intl formatter) |
| i18n | next-intl — languages: English (`en`, default) and Khmer (`km`) |
| Fonts | `next/font/google`: Inter (Latin) + Kantumruy Pro (Khmer) |
| Lint / format | ESLint + Prettier (with `prettier-plugin-tailwindcss`) |
| Package manager | pnpm |
| Tests | Vitest + React Testing Library; Playwright for e2e |

Do **not** add new dependencies without a clear reason. Prefer what is already installed.
Never add a second library for something already covered above (e.g. no axios, no Redux / Jotai /
React Context for global state, no moment, no CSS-in-JS, and no other UI kit such as MUI, Ant Design,
Chakra, Mantine or Headless UI — use shadcn/ui).

## Commands

```bash
pnpm install          # install deps
pnpm dev              # dev server at http://localhost:3000
pnpm build            # production build — must pass before you finish
pnpm lint             # ESLint — must pass
pnpm lint:fix         # ESLint with --fix
pnpm format           # Prettier --write
pnpm format:check     # Prettier --check — must pass
pnpm typecheck        # tsc --noEmit — must pass
pnpm test             # unit tests (Vitest)
pnpm test:e2e         # Playwright e2e (needs API running)
```

Before saying a task is done, run: `pnpm lint && pnpm format:check && pnpm typecheck && pnpm test`.

## Environment

```
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

Copy `.env.example` to `.env.local`. Never commit `.env.local` or any secret.
Only `NEXT_PUBLIC_*` variables are exposed to the browser — never put secrets in them.

## Folder structure

```
messages/
├── en.json                        # English strings (source of truth for keys)
└── km.json                        # Khmer strings — must have the same keys as en.json
src/
├── i18n/
│   ├── routing.ts                 # defineRouting({ locales: ['en','km'], defaultLocale: 'en' })
│   ├── navigation.ts              # locale-aware Link, redirect, useRouter, usePathname
│   └── request.ts                 # getRequestConfig: loads messages/<locale>.json
├── app/
│   └── [locale]/                  # every page lives under the locale segment
│       ├── layout.tsx             # <html lang={locale}>, fonts, NextIntlClientProvider
│       ├── providers.tsx          # QueryClientProvider, theme, toaster
│       ├── (auth)/
│       │   ├── login/page.tsx
│       │   └── register/page.tsx
│       └── (app)/                 # routes that require login
│           ├── layout.tsx         # sidebar + language switcher + auth guard
│           ├── dashboard/page.tsx
│           ├── expenses/page.tsx
│           ├── planning/page.tsx
│           ├── planning/[goalId]/page.tsx
│           ├── boards/page.tsx
│           └── boards/[boardId]/page.tsx
├── features/                      # one folder per module
│   ├── auth/
│   ├── expense/
│   ├── planning/
│   └── board/
│       ├── api.ts                 # fetch functions for this module
│       ├── hooks.ts               # TanStack Query hooks (useBoard, useMoveCard...)
│       ├── store.ts               # (optional) Zustand store for this feature's UI state
│       ├── types.ts               # TS types + zod schemas
│       ├── components/            # module-specific components
│       └── utils.ts               # pure helpers (e.g. position calc)
├── components/
│   ├── ui/                        # shadcn/ui primitives (Button, Input, Dialog...) — base layer
│   ├── shared/                    # reusable app components (PageHeader, EmptyState, MoneyText,
│   │                              #   ConfirmDialog, DataList, FormField, ResponsiveDialog...)
│   └── layout/                    # AppShell, Sidebar, MobileNav, Container
├── stores/                        # app-wide Zustand stores (ui-store.ts, preferences-store.ts)
├── hooks/                         # shared hooks (useMediaQuery, useDebounce...)
├── lib/
│   ├── api-client.ts              # the ONLY place that calls fetch()
│   ├── money.ts                   # money formatting / parsing
│   ├── query-keys.ts              # all TanStack Query keys
│   └── utils.ts                   # cn() etc.
└── middleware.ts                  # next-intl locale middleware + redirect to /[locale]/login if no session cookie
```

Rules:
- Code for one module stays in `features/<module>/`. Do not import one feature's internals from another;
  move shared code to `components/shared` or `lib/`.
- Pages in `app/` should be thin: compose feature components, no fetch logic inline.

## API integration

- All requests go through `lib/api-client.ts`. It:
  - prefixes `NEXT_PUBLIC_API_URL`
  - sends `credentials: "include"` (auth is an **httpOnly session cookie** set by the API)
  - parses JSON and throws a typed `ApiError { status, code, message, fields? }` on non-2xx
  - on `401`, clears the query cache and redirects to `/login`
- Never store tokens in `localStorage` / `sessionStorage`. The browser handles the cookie.
- Validate API responses with zod schemas in `features/*/types.ts` where the data drives important UI.
- Main endpoints (see backend repo for full contract):

```
POST   /auth/register | /auth/login | /auth/logout      GET /me
GET    /expenses?month=YYYY-MM&category_id=              POST /expenses
PUT    /expenses/:id                                     DELETE /expenses/:id
GET    /expenses/summary?month=YYYY-MM
CRUD   /categories
CRUD   /goals          POST /goals/:id/milestones        PATCH /milestones/:id
GET    /boards         GET /boards/:id  (board + columns + cards)
POST   /boards/:id/columns               POST /columns/:id/cards
PUT    /cards/:id      PATCH /cards/:id/move {column_id, position}   DELETE /cards/:id
```

## Data fetching (TanStack Query)

- Every query key comes from `lib/query-keys.ts`, e.g.
  `qk.expenses.list(month)`, `qk.expenses.summary(month)`, `qk.boards.detail(id)`.
- Mutations must invalidate or update the related queries. Example: creating an expense invalidates
  both `qk.expenses.list(month)` and `qk.expenses.summary(month)`.
- Use **optimistic updates** for fast interactions: moving a card, toggling a milestone, deleting an item.
  Always implement `onError` rollback and `onSettled` invalidation.
- Show loading skeletons, empty states and error states for every list — never a blank screen.

## State management (Zustand)

There are two kinds of state. Keep them separate:

| Kind | Tool | Examples |
|---|---|---|
| **Server state** (comes from the API) | TanStack Query | expenses, summary, goals, boards, cards, current user |
| **Client UI state** (lives only in the browser) | Zustand | sidebar open, selected month, active filters, quick-add dialog open, theme, default currency |
| **Local component state** | `useState` | input value, hover, a dropdown open inside one component |

Rules:
- **Never copy API data into Zustand.** No `setExpenses(data)`. Read it from TanStack Query hooks.
- Use Zustand only when state is shared by components that are far apart. If only one component or a
  parent/child pair uses it, use `useState` / props.
- One store per concern, small and typed. App-wide stores go in `src/stores/`; feature-only stores go in
  `features/<module>/store.ts`.
- Always select the smallest slice to avoid re-renders:
  `const isOpen = useUiStore((s) => s.isSidebarOpen)` — never `const store = useUiStore()`.
  When selecting several values, use `useShallow`.
- Actions live inside the store and are named as verbs (`openQuickAdd`, `setMonth`, `toggleSidebar`).
- Use the `persist` middleware only for user preferences (theme, default currency, sidebar collapsed)
  and give it a versioned key (`app-preferences-v1`). Never persist auth data or API data.
- Zustand stores are client-only: use them only in `"use client"` components. Server Components must not
  import stores. Guard persisted values against hydration mismatch (render after mount or use
  `skipHydration` + rehydrate in a client effect).
- Reset stores on logout (each store exposes `reset()`).

Example:

```ts
// src/stores/ui-store.ts
import { create } from "zustand";

type UiState = {
  isSidebarOpen: boolean;
  isQuickAddOpen: boolean;
  toggleSidebar: () => void;
  openQuickAdd: () => void;
  closeQuickAdd: () => void;
  reset: () => void;
};

const initial = { isSidebarOpen: false, isQuickAddOpen: false };

export const useUiStore = create<UiState>()((set) => ({
  ...initial,
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  openQuickAdd: () => set({ isQuickAddOpen: true }),
  closeQuickAdd: () => set({ isQuickAddOpen: false }),
  reset: () => set(initial),
}));
```

## Money rules (important)

- The API sends amounts as **integers**:
  - `USD` → cents (`1250` = $12.50)
  - `KHR` → whole riel (`40000` = ៛40,000)
- Never use floats for money math. Never sum USD and KHR together unless an explicit exchange rate is given.
- Use helpers in `lib/money.ts` only:
  - `formatMoney(amount, currency, locale)` → `"$12.50"` / `"៛40,000"` (uses `Intl.NumberFormat`)
  - `parseMoneyInput(input, currency)` → integer minor units; must accept both Latin digits (`0-9`)
    and Khmer digits (`០-៩`) typed by Khmer keyboard users
- Display components use `<MoneyText amount currency />`.

## Dates

- API dates are ISO strings: `YYYY-MM-DD` for dates, RFC3339 for timestamps.
- Month filters use `YYYY-MM`.
- User timezone is Asia/Phnom_Penh (UTC+7). Do not convert a `DATE` (e.g. `spent_at`) through `new Date()`
  in a way that can shift it by a day — treat it as a plain date string or use date-fns `parseISO` carefully.

## Board / drag-and-drop rules

- Use dnd-kit with `SortableContext` per column. Cards can move within a column and across columns.
- Ordering uses a numeric `position` (float). When a card is dropped:
  - between A and B → `position = (A.position + B.position) / 2`
  - at top → `first.position - 1000` ; at bottom → `last.position + 1000` ; empty column → `1000`
- Put this logic in `features/board/utils.ts` as a pure function `calcPosition(prev?, next?)` with unit tests.
- Send only `PATCH /cards/:id/move { column_id, position }`. Never re-send the whole board.
- Update the UI optimistically; roll back on error with a toast.
- Keyboard drag must work (dnd-kit `KeyboardSensor`).

## UI and code conventions

- TypeScript strict. No `any`; use `unknown` + narrowing if needed.
- Function components only. Server Components by default; add `"use client"` only for interactive parts
  (forms, drag and drop, TanStack Query hooks).
- File names: `kebab-case.tsx`; components: `PascalCase`; hooks: `useSomething`.
- Styling with Tailwind classes and `cn()`. No inline style objects except for dnd-kit transforms.
- The quick "add expense" flow must take ≤ 10 seconds on a phone.
- Accessibility: labels on all inputs, buttons have text or `aria-label`, visible focus states, color is
  never the only signal.
- Forms: zod schema + react-hook-form; show field errors from the API (`ApiError.fields`) under inputs.
- All user-facing text comes from translation files (see i18n section). English copy is simple and clear.

## Responsive design

**Mobile first.** Write base classes for phones, then add larger breakpoints (`sm:`, `md:`, `lg:`).
Never design desktop first and "fix" mobile with `max-*` classes.

Target widths (Tailwind defaults):

| Device | Width | Layout |
|---|---|---|
| Phone | 360–639px (base) | Bottom nav bar, single column, full-screen sheets for forms, floating "+" button for quick add |
| Tablet | `md` 768px+ | Collapsible sidebar, 2-column grids |
| Desktop | `lg` 1024px+ | Fixed sidebar, 3–4 column dashboard grid, dialogs instead of sheets |

Module specifics:
- **Expenses:** table on `md+`, card list on phones (same data, two components chosen by breakpoint
  with CSS, not duplicated fetching).
- **Board:** columns scroll horizontally with `snap-x` on phones (one column ≈ 85% of screen width);
  side by side on desktop. Drag and drop must work with touch (`TouchSensor` / `PointerSensor` with an
  activation delay so scrolling still works).
- **Charts:** use `ResponsiveContainer`; hide the legend or move it below the chart on small screens.
- **Forms:** open in a bottom `Sheet` on phones and a `Dialog` on desktop — use the shared
  `ResponsiveDialog` component, do not write this switch again in each feature.

Rules:
- Prefer CSS (Tailwind breakpoints) for layout changes. Use the `useMediaQuery` hook only when the
  component tree must differ (e.g. Sheet vs Dialog), and handle the first render without flicker.
- Touch targets are at least 44×44px. No hover-only actions — anything shown on hover must also be
  reachable by tap (e.g. a "⋯" menu).
- Use `min-h-dvh` (not `h-screen`) for full-height layouts; respect safe areas on iOS
  (`pb-[env(safe-area-inset-bottom)]` on the bottom nav).
- No horizontal page scroll at 360px, except inside the board's column scroller.
- Use `Container` from `components/layout` for page width and padding (`px-4 md:px-6 lg:px-8`, max width).
- Test every change at 360px, 768px and 1280px, in both English and Khmer.

## UI components (shadcn/ui)

All base UI comes from **shadcn/ui**. shadcn is not an npm package: its CLI copies component source code
into `src/components/ui/`, and we own that code.

**Adding components**
- Check `src/components/ui/` first. If the component is missing, add it with the CLI — never write it by
  hand or copy it from the website:

  ```bash
  pnpm dlx shadcn@latest add button input form dialog sheet
  ```

- The CLI reads `components.json` (style, aliases, Tailwind CSS file, icon library). Read it before adding
  components and do not change it unless the user asks.
- Commit the generated files together with the feature that first uses them.
- Do not run `shadcn add --overwrite` on a component that already exists — it would erase our changes.
  If an update is needed, show the diff to the user first.

**Which shadcn component to use**

| Need | Use |
|---|---|
| Buttons, links styled as buttons | `Button` (`variant`, `size`; `asChild` with our i18n `Link`) |
| Forms | `Form` + `FormField` / `FormItem` / `FormLabel` / `FormControl` / `FormMessage` with react-hook-form + zod |
| Text, number, money input | `Input` (wrapped by our `MoneyInput`), `Textarea` |
| Select one option | `Select`; searchable (e.g. categories) → `Command` inside `Popover` (combobox) |
| Dates | `Calendar` inside `Popover` (date picker); wrapped by our `MonthPicker` / `DatePicker` |
| Modal on desktop / sheet on phone | `Dialog` + `Drawer` (or `Sheet`), combined in our `ResponsiveDialog` |
| Confirm delete | `AlertDialog`, wrapped by our `ConfirmDialog` |
| Row / card actions ("⋯") | `DropdownMenu` |
| Tabs (e.g. month / year view) | `Tabs` |
| Toasts | `sonner` (`toast.success`, `toast.error`) — one `<Toaster />` in `providers.tsx` |
| Loading | `Skeleton` |
| Goal progress | `Progress` |
| Card labels, statuses | `Badge` |
| Expense table (md+) | `Table` |
| Charts | shadcn `Chart` (`ChartContainer`, built on Recharts) |
| Sidebar / navigation | `Sidebar`, `Sheet` for the mobile menu |
| Hints on icon buttons | `Tooltip` (desktop only — the action must also work without it) |

**Customizing**
- Style changes go in the shadcn component's `cva` variants (e.g. add `variant: "income" | "expense"` to
  `Badge`), not by overriding classes at every call site.
- Keep changes to `components/ui/*` small and generic. Anything app-specific (translations, money, API)
  goes in a wrapper in `components/shared/`, not in the ui file.
- Do not remove Radix accessibility props (`aria-*`, focus handling, `asChild`) when editing.

**Theming**
- Colors, radius and fonts come from the CSS variables in `globals.css` (`--background`, `--foreground`,
  `--primary`, `--muted`, `--destructive`, `--radius`...). Use the token classes: `bg-background`,
  `text-muted-foreground`, `border-border`, `bg-primary`.
- **Never hardcode colors** such as `bg-blue-500` or `#1e40af` in components. Need a new meaning (for
  example income vs expense)? Add a token (`--income`, `--expense`) to `globals.css` for both light and
  dark mode, and register it in the Tailwind theme.
- Dark mode uses the `.dark` class (via `next-themes`); every screen must look right in light and dark.
- Chart colors use `--chart-1` … `--chart-5`.

**Icons**: only `lucide-react`. Icon-only buttons need an `aria-label` from translations
(`aria-label={t("common.delete")}`).

## Reusable components

Build once, reuse everywhere. Before creating a component, **search `components/ui`, `components/shared`
and the feature folder** for something that already does it. Extend an existing component (new prop or
variant) instead of copying it.

Layers (lower layers must not import higher ones):

```
components/ui        → shadcn/ui primitives, no business logic, no API calls, no translations
components/shared    → app-level reusable pieces built from ui/ (may use t() for common text)
components/layout    → AppShell, Sidebar, MobileNav, Container
features/*/components→ feature-specific; may use all of the above
app/[locale]/…       → pages that only compose feature components
```

Rules for reusable components:
- **Presentational and data-agnostic:** they receive data and callbacks via props. No fetching, no
  Zustand, no hardcoded feature logic inside `ui/` or `shared/`.
- **Typed props**, exported as `XxxProps`. Extend native props where sensible
  (`React.ComponentProps<"button">`) and forward `className` merged with `cn()`.
- **Variants with `cva`** (class-variance-authority, used by shadcn) instead of many boolean props.
  Good: `<Badge variant="success" size="sm" />`. Bad: `<Badge green small />`.
- **Composition over configuration:** accept `children` / slots (`icon`, `actions`, `footer`) rather than
  dozens of props.
- Forward refs where the component wraps a focusable element (for forms and dnd-kit).
- Accessible by default: correct roles, labels, keyboard support, focus-visible styles.
- Responsive by default: a shared component must look right at 360px without the caller adding fixes.
- No user-facing text hardcoded inside `ui/`; pass it as props or children so it can be translated.
- One component per file; file name in kebab-case matches the component (`empty-state.tsx` →
  `EmptyState`). Export from the file directly — no big barrel `index.ts` files that hurt tree-shaking.
- If a pattern appears in **2 or more features**, move it to `components/shared`.

Expected shared components (create them when first needed):
`PageHeader`, `Container`, `EmptyState`, `ErrorState`, `LoadingSkeleton`, `MoneyText`, `MoneyInput`,
`CurrencySelect`, `MonthPicker`, `ConfirmDialog`, `ResponsiveDialog`, `FormField`, `DataList`,
`StatCard`, `ProgressBar`, `LanguageSwitcher`.

## Linting and formatting (ESLint + Prettier)

**Read the config before writing code.** At the start of a task, open and follow:
- `eslint.config.mjs` (flat config) — rules, plugins, import order, restricted imports
- `.prettierrc` (or `prettier.config.mjs`) and `.prettierignore`
- `tsconfig.json` — `strict` options and the `@/*` path alias
- `.editorconfig` if present

The config files are the source of truth. If this document and a config file disagree, **the config wins** —
tell the user about the difference.

Rules:
- Match the existing Prettier style (quotes, semicolons, trailing commas, print width). Do not format by hand;
  run `pnpm format` on the files you changed.
- Tailwind classes are sorted automatically by `prettier-plugin-tailwindcss`; do not sort them manually.
- Fix lint errors properly. **Do not** add `eslint-disable`, `// @ts-ignore` or `// @ts-expect-error`
  to hide a problem. If a disable is truly needed, use a single-line disable for one specific rule with
  a comment explaining why.
- **Do not change** `eslint.config.mjs`, `.prettierrc` or `tsconfig.json` unless the user asks. If a rule
  blocks the work, explain it and ask.
- Do not reformat files you did not otherwise change (keeps diffs small and reviewable).
- Use the `@/` import alias (`@/components/shared/empty-state`), not long `../../../` paths.
- Keep import order as the ESLint config defines it (usually: React/Next → external packages →
  `@/` internal → relative → styles).

## Internationalization (i18n): English + Khmer

Library: **next-intl**. Locales: `en` (default) and `km`. URLs are prefixed: `/en/expenses`, `/km/expenses`.

**Setup rules**
- Locale config lives only in `src/i18n/routing.ts`. Never hardcode the locale list elsewhere.
- `middleware.ts` runs the next-intl middleware first (detects locale from cookie `NEXT_LOCALE`,
  then `Accept-Language`, then falls back to `en`), then the auth check.
- Always navigate with `Link` / `useRouter` / `redirect` from `src/i18n/navigation.ts`, never from
  `next/link` or `next/navigation` directly, so the locale prefix is kept.
- Root `<html lang={locale}>` must match the active locale (`en` or `km`).

**Translation files**
- Strings live in `messages/en.json` and `messages/km.json`, namespaced by feature:

```json
{
  "common":   { "save": "Save", "cancel": "Cancel", "delete": "Delete", "loading": "Loading..." },
  "nav":      { "dashboard": "Dashboard", "expenses": "Expenses", "planning": "Planning", "boards": "Boards" },
  "expense":  { "title": "Expenses", "add": "Add expense", "total": "Total this month",
                "count": "{count, plural, =0 {No expenses} one {# expense} other {# expenses}}" },
  "planning": { "progress": "{percent}% done" },
  "board":    { "addCard": "Add card", "moveError": "Could not move the card. Please try again." },
  "errors":   { "required": "This field is required", "network": "Network error. Please try again." }
}
```

```json
{
  "common":   { "save": "រក្សាទុក", "cancel": "បោះបង់", "delete": "លុប", "loading": "កំពុងផ្ទុក..." },
  "nav":      { "dashboard": "ផ្ទាំងគ្រប់គ្រង", "expenses": "ការចំណាយ", "planning": "ផែនការ", "boards": "ក្ដារកិច្ចការ" },
  "expense":  { "title": "ការចំណាយ", "add": "បន្ថែមការចំណាយ", "total": "សរុបខែនេះ",
                "count": "{count, plural, =0 {គ្មានការចំណាយ} other {ការចំណាយ # }}" }
}
```

- `en.json` is the source of truth. Every key added to `en.json` must be added to `km.json` in the same
  change. If you are not confident in a Khmer translation, still add the key, copy the English text,
  and mark it in `messages/TODO-km.md` for a native speaker to review. Never leave a key missing.
- Use ICU message syntax for variables and plurals (`{count, plural, ...}`). Never build sentences by
  string concatenation — word order differs between English and Khmer.
- Key names are English, camelCase, grouped by feature. Do not use the English sentence as the key.

**Using translations**
- Server Components: `const t = await getTranslations('expense')`.
- Client Components: `const t = useTranslations('expense')`.
- Dates, numbers, relative time: use next-intl `useFormatter()` / `getFormatter()`
  (`format.dateTime`, `format.number`, `format.relativeTime`) so they follow the locale.
- Zod validation messages must be translation keys, translated in the form component — not
  hardcoded English inside schemas.
- API error messages: map `ApiError.code` to a key in `errors.*`. Only show the raw API `message` as a fallback.
- Page metadata (`generateMetadata`) must be translated too.

**User-created data is not translated.** Category names the user types, goal titles, card text, etc. are
shown exactly as entered. Only the default seed categories (Food, Transport, Rent...) are translated,
using a stable `key` from the API (e.g. `category.food`), falling back to `name`.

**Khmer typography**
- Load Kantumruy Pro for `km` via `next/font/google` and apply it with a CSS variable; keep Inter for `en`.
- Khmer script needs more vertical space: use `leading-relaxed` (≥ 1.6) for Khmer body text and do not
  set fixed heights on buttons, badges or cards that contain text — let them grow.
- Khmer text has no spaces between words, so long strings may not wrap: add `break-words` on
  containers with user text and test narrow widths (375px) in `km`.
- Do not use `uppercase` / letter-spacing styling on text that may be Khmer.

**Language switcher**
- A switcher (English / ខ្មែរ) sits in the sidebar and on the auth pages. It keeps the current path,
  sets the `NEXT_LOCALE` cookie, and does not reload data unnecessarily.
- Optional: save the preference to the user profile via the API (`PUT /me { locale }`) so it follows
  the user across devices.

## Testing

- Unit test pure helpers: `money.ts`, `calcPosition`, summary/progress calculations.
- Component tests for forms (validation, submit) and the board (move card calls the right mutation).
- Mock the API with MSW in tests; do not hit the real backend in unit tests.
- Wrap components in `NextIntlClientProvider` in tests (use a shared `renderWithIntl` helper).
- A test (`pnpm test`) checks that `en.json` and `km.json` have exactly the same keys.
- Playwright: run the main flows (login, add expense, move card) in both `en` and `km`.
- Add or update tests with every behavior change.

## Do not

- Do not hardcode user-facing text in components — always use `t('...')`.
- Do not import `Link`/`useRouter`/`redirect` from `next/link` or `next/navigation`; use `src/i18n/navigation.ts`.
- Do not concatenate translated strings; use ICU placeholders.
- Do not call `fetch` outside `lib/api-client.ts`.
- Do not put API data in Zustand, and do not use React Context or another library for global state.
- Do not duplicate a component that already exists — extend it.
- Do not install another UI library or hand-write a component shadcn provides; add it with the shadcn CLI.
- Do not hardcode colors; use shadcn theme tokens.
- Do not disable ESLint rules or edit lint/format/ts configs to make errors go away.
- Do not store auth tokens or personal data in localStorage.
- Do not use floats for money or mix currencies in one total.
- Do not edit generated files in `components/ui/` beyond small styling tweaks.
- Do not change the API contract from the frontend; if an endpoint is missing, leave a `// TODO(api):` note
  and tell the user.
- Do not commit `.env.local`, build output, or `node_modules`.

## Definition of done

- [ ] `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm test` all pass; `pnpm build` passes for larger changes
- [ ] Reused existing components; new reusable pieces placed in `components/shared`
- [ ] UI built from shadcn components and theme tokens; checked in light and dark mode
- [ ] Global UI state (if any) in a small Zustand store; API data only in TanStack Query
- [ ] Checked at 360px, 768px and 1280px
- [ ] Loading, empty and error states handled
- [ ] No hardcoded UI text; new keys added to both `en.json` and `km.json`
- [ ] Checked in both English and Khmer (text fits, wraps, and is readable)
- [ ] Works on mobile width (375px) and keyboard only
- [ ] Related queries invalidated / optimistic updates rolled back on error
- [ ] Tests added or updated

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
