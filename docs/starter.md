# STARTER.md — Phase 1: UI prototype (mock data, no backend)

This is the task brief for the **first build** of the frontend. Read `AGENTS.md` first — all its rules
(stack, shadcn/ui, Zustand, i18n, responsive, ESLint/Prettier) still apply. This file only says
**what to build now**.

## Goal

A clickable prototype of the whole app with a real layout and realistic **mock data**, so we can review the
design and flows before the Go API exists.

**In scope**
- Project setup (Next.js, Tailwind, shadcn/ui, next-intl, TanStack Query, Zustand, ESLint, Prettier)
- App shell: sidebar, top header, mobile bottom nav, language + theme switch
- Dashboard page (full design)
- Prototype pages: Expenses, Planning (goals), Boards (kanban with drag and drop), Settings
- Fake login/register screens (UI only)
- Mock data layer that behaves like the API (with delay), so switching to the real API later is small

**Out of scope (later)**
- Real backend calls, real authentication, sessions, route protection
- Budgets per category, recurring expenses, exports, income tracking
- Saving data after page reload (mock data resets on refresh — this is fine)

## 1. Project setup

```bash
pnpm create next-app@latest frontend --ts --tailwind --eslint --app --src-dir --import-alias "@/*"
cd frontend
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button card input label textarea select form dialog drawer sheet \
  alert-dialog dropdown-menu popover command calendar tabs badge progress skeleton table \
  avatar separator tooltip sidebar chart scroll-area checkbox sonner
pnpm add next-intl @tanstack/react-query zustand react-hook-form zod @hookform/resolvers \
  @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities date-fns next-themes lucide-react
pnpm add -D prettier prettier-plugin-tailwindcss vitest @testing-library/react @testing-library/jest-dom jsdom
```

Then add scripts to `package.json`: `lint`, `lint:fix`, `format`, `format:check`, `typecheck`, `test`
(see `AGENTS.md → Commands`). Add `.env.example` with:

```
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXT_PUBLIC_USE_MOCKS=true
```

## 2. Mock data layer

Goal: pages and hooks must not know whether data is mock or real.

```
src/mocks/
├── db.ts            # in-memory "database" created from the seed (module-level variable)
├── seed.ts          # generates mock data, dates relative to TODAY (so the demo always looks current)
├── delay.ts         # await delay(300–600ms random) to show loading states
└── handlers/
    ├── expense.ts   # listExpenses, createExpense, updateExpense, deleteExpense, getSummary
    ├── planning.ts  # listGoals, getGoal, createGoal, toggleMilestone...
    └── board.ts     # listBoards, getBoard, createCard, moveCard...
```

- `features/<module>/api.ts` exports the same functions the real API will have. Each one does:
  `if (env.useMocks) return mockHandlers.x(args); return apiClient.x(args);`
  (For now only the mock branch needs to work; leave the real branch as `apiClient` calls matching the
  endpoints in `AGENTS.md`.)
- Mock handlers return the **same TypeScript types** as the real API (`features/*/types.ts`), and money uses
  integer minor units (USD cents, KHR riel).
- Mutations change the in-memory db, so add/edit/delete/move work during the session.
- Add a 5% random failure option (`NEXT_PUBLIC_MOCK_ERRORS=true`) to test error states and optimistic rollback.
- Use a fixed demo user: `{ id: 1, name: "Sokha", email: "demo@example.com", locale: "en" }`.
- Never import `src/mocks` from components or pages — only from `features/*/api.ts`.

### Seed content (realistic, Cambodia context)

**Categories** (with `key` for translation, lucide icon, chart color token):
Food 🍜 `utensils`, Coffee `coffee`, Transport `bike`, Rent `home`, Phone & Internet `wifi`,
Family `users`, Shopping `shopping-bag`, Health `heart-pulse`, Education `book-open`, Other `ellipsis`.

**Expenses** — about 60 items across this month and last month, mixed currencies. Examples:

| Note | Category | Amount | Currency |
|---|---|---|---|
| Bai sach chrouk breakfast | Food | 8000 | KHR (៛8,000) |
| Iced latte | Coffee | 225 | USD ($2.25) |
| PassApp to office | Transport | 6000 | KHR |
| Monthly rent | Rent | 25000 | USD ($250.00) |
| Smart top-up | Phone & Internet | 500 | USD ($5.00) |
| Send to parents | Family | 5000 | USD ($50.00) |
| Lunch with team | Food | 450 | USD ($4.50) |
| Aeon Mall shopping | Shopping | 3850 | USD ($38.50) |
| Pharmacy | Health | 15000 | KHR |
| English course | Education | 6000 | USD ($60.00) |

**Goals** — 4 goals with milestones:
1. *Save $500 for a new laptop* — due in 3 months — 5 milestones, 2 done
2. *Pass IELTS 6.5* — due in 5 months — 4 milestones, 1 done
3. *Run a 10K* — due in 2 months — 4 milestones, 3 done
4. *Visit Siem Reap with family* — status done — all milestones done

**Boards** — 2 boards:
- *Personal*: columns **Todo / Doing / Done**, 10 cards (e.g. "Pay electricity bill" due in 2 days,
  "Renew motorbike tax" due next week, "Call bank about card", "Clean room") with labels
  `red | yellow | green | blue | purple`
- *Side project*: columns **Backlog / In progress / Review / Done**, 8 cards

Card and column `position` values are 1000, 2000, 3000… (see `AGENTS.md → Board rules`).

## 3. App shell (layout)

Route group `app/[locale]/(app)/layout.tsx`, built with the shadcn `Sidebar` component.

```
Desktop (lg+)
┌────────────┬─────────────────────────────────────────────────┐
│  ◉ LifeApp │  Page title        [Search]   [EN|ខ្មែរ] [☀/☾] (S)│  ← header
│            ├─────────────────────────────────────────────────┤
│ ▣ Dashboard│                                                 │
│ ◎ Expenses │                                                 │
│ ◇ Planning │                  page content                   │
│ ▤ Boards   │              (Container, max-w-7xl)             │
│            │                                                 │
│ ────────── │                                                 │
│ ⚙ Settings │                                                 │
│ (S) Sokha ▾│                                                 │
└────────────┴─────────────────────────────────────────────────┘

Phone (base)
┌───────────────────────────────┐
│ ☰  Dashboard        (S)       │  ← header; ☰ opens Sheet with full nav
├───────────────────────────────┤
│                               │
│         page content          │
│                          (+)  │  ← floating "Quick add expense" button
├───────────────────────────────┤
│  ▣     ◎     ◇     ▤          │  ← bottom nav (4 main items), safe-area padding
└───────────────────────────────┘
```

Components (`components/layout/`): `AppShell`, `AppSidebar`, `AppHeader`, `MobileNav`, `UserMenu`,
`Container`; shared: `LanguageSwitcher`, `ThemeToggle`, `PageHeader`.

Requirements:
- Sidebar: collapsible to icons on `md`, fixed on `lg`, hidden on phones (use the Sheet menu instead).
  Collapsed state saved in the Zustand `preferences-store` (persisted).
- Active nav item is highlighted based on the current path (locale-aware `usePathname`).
- User menu (avatar dropdown): Profile (disabled), Settings, Log out (goes to `/login`, resets stores).
- Header search is a visual placeholder for now (can open a `Command` dialog with nav links only).
- Nav labels come from `messages/*.json` (`nav.*`).

## 4. Dashboard (main design work)

Route: `/[locale]/dashboard`. Shows the **current month**, with a `MonthPicker` in the page header.

```
Desktop (lg+) — 12-column grid
┌──────────────────────────────────────────────────────────────────────┐
│ Good evening, Sokha 👋                             [◀ Sep 2026 ▶] [+ Add]│
├───────────────┬───────────────┬───────────────┬──────────────────────┤
│ Spent (USD)   │ Spent (KHR)   │ vs last month │ Tasks due this week  │  ← StatCard x4
│ $412.75       │ ៛186,000      │ ▲ 12%         │ 5                    │
├───────────────┴───────────────┴──────┬────────┴──────────────────────┤
│ Daily spending (bar chart, USD)      │ By category (donut + legend)  │
│ ▂▅▃▇▂▁▄▆ …                           │  ◔ Rent 48% · Food 21% …      │
│              (8 cols)                │           (4 cols)            │
├──────────────────────────────────────┼───────────────────────────────┤
│ Recent expenses (6 rows, "View all") │ Active goals (progress bars)  │
│ 🍜 Lunch with team   Food   -$4.50    │ Laptop fund      ▓▓▓░░ 40%   │
│ ☕ Iced latte        Coffee -$2.25    │ IELTS 6.5        ▓░░░░ 25%   │
│ …                                    │ Run 10K          ▓▓▓▓░ 75%   │
│              (7 cols)                │           (5 cols)            │
├──────────────────────────────────────┴───────────────────────────────┤
│ Tasks due soon (from all boards): title · board · due · label  (12)  │
└──────────────────────────────────────────────────────────────────────┘

Phone: one column in this order → greeting + month picker, StatCards (2×2 grid), Recent expenses,
Active goals, Tasks due soon, Daily spending chart, By category chart.
Tablet (md): 2 columns.
```

Widgets (each is its own component in `features/dashboard/components/`, with its own loading skeleton,
empty state and error state):

| Widget | Data | Details |
|---|---|---|
| `SpendingStats` | expense summary | USD and KHR shown **separately**; "vs last month" per currency; green down / red up arrows (plus text, not color only) |
| `DailySpendingChart` | expenses of month | shadcn `Chart` bar chart; currency tabs USD / KHR; tooltip with formatted money |
| `CategoryBreakdownChart` | summary by category | donut + legend with amount and %; currency tabs; click a slice → go to Expenses filtered by that category |
| `RecentExpenses` | last 6 expenses | icon, note, category badge, date (relative: "Today", "Yesterday"), amount; row click opens edit dialog |
| `ActiveGoals` | goals not done | title, `Progress`, % and "x of y steps", days left (red if < 7) |
| `TasksDueSoon` | cards due in next 7 days | sorted by due date; overdue shown first with a red badge; click → board page |
| `QuickAddExpense` | — | `ResponsiveDialog` with amount, currency, category (combobox), date (default today), note; submit in ≤ 10 s |

Greeting text depends on time of day (morning / afternoon / evening), translated.

## 5. Feature prototypes

### Expenses — `/[locale]/expenses`
- Page header: title, `MonthPicker`, "Add expense" button.
- Filters bar: search note, category multi-select, currency (All / USD / KHR). Filter state in the URL
  search params (so it can be shared), not Zustand.
- Summary strip: total USD, total KHR, number of expenses.
- List: `Table` on `md+` (date, category, note, amount, "⋯" menu); card list grouped by day on phones
  with a daily subtotal.
- Add / edit in `ResponsiveDialog`; delete with `ConfirmDialog` and an "Undo" action in the toast.
- Empty state with illustration icon and "Add your first expense" button.

### Planning — `/[locale]/planning` and `/[locale]/planning/[goalId]`
- Goals grid (1 col phone, 2 col md, 3 col lg): `GoalCard` with title, status badge, due date, progress.
- Tabs: Active / Done / All.
- Create / edit goal dialog: title, description, target date, status.
- Goal detail: header with progress ring/bar, description, milestone checklist (check/uncheck updates
  progress optimistically), add milestone inline, reorder milestones with drag and drop.

### Boards — `/[locale]/boards` and `/[locale]/boards/[boardId]`
- Board list: cards with board name and task counts, "New board" button.
- Board page: columns side by side (horizontal scroll with `snap-x` on phones), each column shows name,
  card count, "⋯" menu (rename, delete), cards, and "+ Add card" inline input at the bottom.
- Drag and drop with dnd-kit: move cards inside and between columns; pointer, touch and keyboard sensors;
  a `DragOverlay` preview; position calculated with `calcPosition` (with unit tests).
- Card: title, label color bar, due date badge (red overdue, amber ≤ 2 days), description icon if set.
- Click card → `ResponsiveDialog` to edit title, description, due date, label; delete.
- "+ Add column" at the end of the board.

### Settings — `/[locale]/settings`
- Language (English / ខ្មែរ), theme (Light / Dark / System), default currency (USD / KHR) — stored in the
  persisted Zustand `preferences-store`. Default currency pre-fills the quick-add form.

### Auth screens (UI only) — `/[locale]/login`, `/[locale]/register`
- Centered card, app logo, form with validation (zod), language switcher in the corner.
- Submit waits 500 ms then goes to `/dashboard` (no real auth yet). Mark with `// TODO(api): real auth`.

## 6. Build order (checklist)

1. [ ] Setup: Next.js, shadcn init + components, Prettier, ESLint, scripts, `.env.example`
2. [ ] i18n: `next-intl` routing, `messages/en.json` + `km.json`, fonts (Inter + Kantumruy Pro), `LanguageSwitcher`
3. [ ] Providers: TanStack Query, `next-themes`, `Toaster`; Zustand `ui-store` + `preferences-store`
4. [ ] Theme tokens: add `--income`, `--expense`, label colors, chart colors (light + dark)
5. [ ] Types + mock layer: `features/*/types.ts`, `src/mocks/*`, `features/*/api.ts`, `features/*/hooks.ts`
6. [ ] Shared components: `Container`, `PageHeader`, `StatCard`, `MoneyText`, `MoneyInput`, `MonthPicker`,
       `EmptyState`, `ErrorState`, `ResponsiveDialog`, `ConfirmDialog`
7. [ ] App shell: sidebar, header, mobile nav, user menu, quick-add FAB
8. [ ] Dashboard with all widgets
9. [ ] Expenses page
10. [ ] Boards list + board page with drag and drop
11. [ ] Planning list + goal detail
12. [ ] Settings + auth screens
13. [ ] Polish: loading skeletons, empty/error states, Khmer check, dark mode check, 360/768/1280 check

Show the user a working result after steps 7 and 8 (shell + dashboard) before building the rest.

## 7. Acceptance criteria

- `pnpm dev` runs with no backend; every page shows realistic mock data.
- All create / edit / delete / move / toggle actions work in the session and update the dashboard
  (TanStack Query invalidation works the same as with a real API).
- Loading skeletons appear (mock delay), and error states + rollback work with `NEXT_PUBLIC_MOCK_ERRORS=true`.
- Works and looks good at 360px, 768px and 1280px, in English and Khmer, in light and dark mode.
- No hardcoded text or colors; `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm test` pass.
- No `fetch` calls to a backend; no component imports from `src/mocks` directly.

## 8. Later: connect the backend

When the Go API is ready:
1. Set `NEXT_PUBLIC_USE_MOCKS=false`.
2. Make the `apiClient` branch in each `features/*/api.ts` work; fix any type differences with zod.
3. Add real auth (session cookie), `middleware.ts` protection, 401 handling.
4. Keep `src/mocks` for tests and Storybook-like demos, or delete it.