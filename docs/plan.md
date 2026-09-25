# Feature spec — Planning module (Goals + Milestones)

Task brief for the coding agent. This is the **next module after Expense**. Read `AGENTS.md`,
`STARTER.md` and `docs/expense-categories.md` first — all their rules apply (shadcn/ui, TanStack Query,
Zustand for UI state only, i18n en + km, responsive, mock data in Phase 1, ESLint/Prettier).

## 1. Goal

Let the user plan their life with **goals** broken into small **milestones** (steps), and see progress.

- `/[locale]/planning` — list of goals: stats, search, filter, sort, pagination
- `/[locale]/planning/[goalId]` — goal detail: progress, milestones checklist (add, edit, check, reorder, delete)
- Dashboard widget `ActiveGoals` uses the same hooks
- Phase 1: data from the mock layer (`src/mocks/handlers/planning.ts`). No backend.

**Out of scope (later):** linking a goal to savings/expenses, reminders/notifications, sharing goals,
recurring habits, file attachments.

## 2. Step 0 — reuse before you build

The Expense module already created the reusable list system. **Use it; do not create new versions.**

| Need | Reuse |
|---|---|
| Page layout, toolbar, search | `ListPage`, `ListToolbar` |
| List + states (loading / empty / no results / error) | `DataList<T>` |
| Paging | `Pagination`, `useListParams` (URL state) |
| Row / card menu | `DataListRowActions` |
| Forms | `ResponsiveDialog`, `FormField`, `ConfirmDialog` |
| Stats | `StatCard` |
| Progress | `ProgressBar` (wraps shadcn `Progress`) |
| Dates | `DatePicker`, next-intl `format.dateTime` / `format.relativeTime` |

Extensions needed (extend the existing components, keep them generic):

1. **`DataList` grid layout** — add `layout?: "table" | "grid"` and `renderGridItem?: (item: T) => ReactNode`.
   Grid is 1 column on phones, 2 on `md`, 3 on `lg`. Goals use grid by default.
2. **`useListParams` filters** — add typed extra params, e.g.
   `useListParams({ defaultSort: "targetDate", filters: { status: "active", area: [] } })`.
   Changing a filter resets page to 1 (same rule as search).
3. **Shared position helper** — `calcPosition(prev?, next?)` is needed by Board **and** Planning, so it must
   live in `src/lib/position.ts` (not in `features/board/utils.ts`). If it already exists in the board
   feature, move it and update imports. Keep its unit tests.
4. **`SortableList`** — new shared component `components/shared/sortable-list.tsx`: a vertical dnd-kit list
   (pointer, touch with delay, keyboard sensors, drag handle, `DragOverlay`) that calls
   `onMove(id, newPosition)`. Milestones use it now; other vertical lists can use it later.

If any of these already exist, reuse them as they are.

## 3. Data model

```ts
// features/planning/types.ts
export type GoalStatus = "not_started" | "in_progress" | "done";
export type GoalArea = "personal" | "career" | "health" | "finance" | "learning" | "family";
export type GoalPriority = "low" | "medium" | "high";

export type Milestone = {
  id: number;
  goalId: number;
  title: string;
  isDone: boolean;
  dueDate: string | null;   // YYYY-MM-DD, optional
  position: number;         // 1000, 2000, 3000...
  doneAt: string | null;    // RFC3339
};

export type GoalSummary = {              // used in lists and dashboard
  id: number;
  title: string;
  area: GoalArea;
  priority: GoalPriority;
  status: GoalStatus;
  targetDate: string | null;             // YYYY-MM-DD
  milestonesTotal: number;
  milestonesDone: number;
  progress: number;                      // 0–100, integer, computed by the API
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GoalDetail = GoalSummary & {
  description: string;                   // plain text, max 2000
  milestones: Milestone[];               // sorted by position
};

export type GoalStats = {
  active: number;          // not_started + in_progress
  doneThisYear: number;
  overdue: number;         // active and targetDate < today
  averageProgress: number; // of active goals, 0–100
};
```

Form schemas (zod messages are **translation keys**):

```ts
export const goalFormSchema = z.object({
  title: z.string().trim().min(1, "required").max(100, "tooLong"),
  description: z.string().trim().max(2000, "tooLong").default(""),
  area: z.enum(GOAL_AREAS),
  priority: z.enum(GOAL_PRIORITIES),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  status: z.enum(GOAL_STATUSES),
});

export const milestoneFormSchema = z.object({
  title: z.string().trim().min(1, "required").max(150, "tooLong"),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
});
```

### Business rules (API is the source of truth; the mock implements them; the UI mirrors them optimistically)

- `progress = round(milestonesDone / milestonesTotal * 100)`; if no milestones → `0`, or `100` when status is `done`.
- Checking the first milestone of a `not_started` goal → status becomes `in_progress`.
- When the **last** milestone is checked → do **not** auto-complete. Show a toast with action
  "Mark goal as done" (the user decides).
- Setting status to `done` sets `completedAt`; it does not auto-check milestones.
- Unchecking a milestone on a `done` goal → status goes back to `in_progress`, `completedAt = null`.
- **Due states** (computed in the UI from `targetDate`, timezone Asia/Phnom_Penh, date-only compare):
  - `overdue` — active and `targetDate < today` → red badge "Overdue by X days"
  - `dueSoon` — active and within 7 days → amber badge "X days left"
  - `onTrack` — otherwise → muted text "Due 12 Dec 2026"
  - `done` goals show "Completed 3 Sep 2026" instead
  Put this in `features/planning/utils.ts` → `getDueState(goal, today)` with unit tests.
  Badges always include text, not color only.

## 4. API contract (the mock implements it now)

```
GET    /goals?page=1&pageSize=12&q=laptop&status=active&area=finance,health&sort=targetDate
                                                   → Paginated<GoalSummary>
GET    /goals/stats                                → GoalStats
GET    /goals/:id                                  → GoalDetail
POST   /goals                   GoalFormValues     → GoalDetail (201)
PUT    /goals/:id               GoalFormValues     → GoalDetail
PATCH  /goals/:id/status        { status }         → GoalSummary
DELETE /goals/:id                                  → 204 (milestones deleted too)

POST   /goals/:id/milestones    MilestoneFormValues → Milestone (201, added at the end)
PUT    /milestones/:id          MilestoneFormValues → Milestone
PATCH  /milestones/:id/toggle   { isDone }          → { milestone, goal: GoalSummary }
PATCH  /milestones/:id/move     { position }        → Milestone
DELETE /milestones/:id                              → { goal: GoalSummary }
```

- `status` filter values: `active` (not_started + in_progress), `done`, `all`. Default `active`.
- `sort` values: `targetDate` (soonest first, nulls last — default), `-createdAt`, `-progress`, `title`.
- Page size default **12** for the grid (options 12 / 24 / 48).
- Errors: `NOT_FOUND` (404) → goal detail shows a "Goal not found" state with a back link;
  `VALIDATION_ERROR` (422) with `fields` → shown under inputs.

## 5. Mock layer — `src/mocks/handlers/planning.ts`

- Seed ~16 goals (so the grid has 2 pages at size 12), dates relative to today, mixed areas and statuses.
  Include the 4 goals from `STARTER.md`, plus e.g. "Build an emergency fund of $1,000", "Read 12 books
  this year", "Learn basic Golang", "Get a driving licence", "Sleep before 11pm for 30 days",
  "Renovate parents' kitchen", "Get AWS certification", "Lose 5 kg", "Visit Kampot and Kep",
  "Start a side project", "Learn to cook 10 Khmer dishes", "Pay off phone installment".
- At least 2 active goals must be **overdue** and 2 **due within 7 days** so all badge states show.
- 0–8 milestones per goal; one goal with **no** milestones (tests the empty checklist state).
- Implement search (title, case-insensitive), filters, sort, paging, stats, all business rules in §3.
- Use `delay()` and the optional random error (`NEXT_PUBLIC_MOCK_ERRORS`).

## 6. Query keys and hooks

```ts
qk.goals.all                   // ["goals"]
qk.goals.list(params)          // ["goals", "list", params]
qk.goals.stats()               // ["goals", "stats"]
qk.goals.detail(id)            // ["goals", "detail", id]
```

| Hook | Notes |
|---|---|
| `useGoals(params)` | `placeholderData: keepPreviousData` |
| `useGoalStats()` | stats strip + dashboard |
| `useGoal(id)` | detail page |
| `useCreateGoal()` | success → toast, invalidate `goals.all`, **navigate to the new goal's detail page** |
| `useUpdateGoal()` | success → toast, update `detail(id)` cache, invalidate lists + stats |
| `useUpdateGoalStatus()` | optimistic on detail + lists; when set to `done` → celebration toast |
| `useDeleteGoal()` | confirm first; success → toast, remove `detail(id)`, invalidate lists + stats, navigate to `/planning` |
| `useAddMilestone(goalId)` | optimistic append (temp negative id), replace with server result |
| `useUpdateMilestone()` | optimistic title / due date edit |
| `useToggleMilestone()` | **optimistic**: flip `isDone`, recompute `milestonesDone`, `progress`, `status` in the detail cache; rollback on error; invalidate lists + stats on settle |
| `useMoveMilestone()` | **optimistic** reorder using `calcPosition`; rollback on error |
| `useDeleteMilestone()` | optimistic remove + recompute progress; toast with **Undo** (re-create with same title/position) |

Put the progress/status recompute in a pure function `applyMilestoneChange(goal, change)` in
`features/planning/utils.ts` so the optimistic update and the mock use the **same** logic (unit-tested).

## 7. UI

Files:
```
app/[locale]/(app)/planning/page.tsx                  # thin → <GoalsPage />
app/[locale]/(app)/planning/[goalId]/page.tsx         # thin → <GoalDetailPage id=… />
features/planning/components/goals-page.tsx
features/planning/components/goal-stats.tsx
features/planning/components/goal-card.tsx            # grid item (also used by dashboard)
features/planning/components/goal-list-item.tsx       # compact row (phone / dashboard)
features/planning/components/goal-form-dialog.tsx     # create + edit
features/planning/components/goal-status-select.tsx
features/planning/components/goal-due-badge.tsx
features/planning/components/goal-area-badge.tsx
features/planning/components/goal-detail-page.tsx
features/planning/components/milestone-list.tsx       # uses SortableList
features/planning/components/milestone-item.tsx
features/planning/components/milestone-add-input.tsx
features/planning/components/goal-delete-dialog.tsx
```

### 7.1 Goals list — `/planning`

```
Desktop (lg)
┌──────────────────────────────────────────────────────────────────────┐
│ Planning                                                  [+ New goal]│
│ Break big goals into small steps.                                     │
├─────────────────┬─────────────────┬─────────────────┬────────────────┤
│ Active goals  6 │ Done this year 3│ Overdue       2 │ Avg progress 48%│  ← StatCard x4
├─────────────────┴─────────────────┴─────────────────┴────────────────┤
│ [ Active | Done | All ]   [🔍 Search goals…]  [Area ▾]  [Sort: Due ▾] │
├──────────────────────┬──────────────────────┬────────────────────────┤
│ 💰 Finance   ● High  │ 📚 Learning  ● Med   │ ❤ Health    ● Low      │
│ Save $500 for laptop │ Pass IELTS 6.5       │ Run a 10K              │
│ ▓▓▓▓░░░░░░  40%      │ ▓▓░░░░░░░░  25%      │ ▓▓▓▓▓▓▓░░░  75%        │
│ 2 of 5 steps         │ 1 of 4 steps         │ 3 of 4 steps           │
│ [⚠ 6 days left]   ⋯  │ Due 20 Feb 2027   ⋯  │ [Overdue by 3 days] ⋯  │
├──────────────────────┴──────────────────────┴────────────────────────┤
│ Showing 1–12 of 16      Per page [12 ▾]         ‹ Prev  1 2  Next ›   │
└──────────────────────────────────────────────────────────────────────┘

Phone: stats as 2×2 grid → status tabs (full width) → search → [Area] [Sort] row → 1-column cards
→ "Page 1 of 2  ‹ ›". "+" button in the header (the floating "+" stays for quick-add expense).
```

- Status tabs = `status` filter (`Active` default). Area = multi-select `Popover` + `Command` with checkboxes.
- Whole card is a link to the detail page; the "⋯" menu (Edit, Mark as done / Reopen, Delete) must not
  trigger navigation. Card is keyboard focusable.
- Empty state: icon `target`, "No goals yet", "Set your first goal and break it into small steps.",
  button "New goal". Done tab empty: "No completed goals yet — you've got this!".

### 7.2 Goal detail — `/planning/[goalId]`

```
Desktop (lg): 2 columns (8 / 4)
┌──────────────────────────────────────────────────────────────────────┐
│ ‹ Planning                                                           │
│ Save $500 for a new laptop            [Status: In progress ▾] [Edit] ⋯│
│ 💰 Finance · ● High priority · [⚠ 6 days left] · Due 1 Oct 2026      │
├───────────────────────────────────────────────┬──────────────────────┤
│ Steps                              2 of 5 done │ Progress             │
│ ⋮⋮ ☑ Open a separate savings account         │      ◔ 40%           │
│ ⋮⋮ ☑ Save $100 in September                  │ ▓▓▓▓░░░░░░           │
│ ⋮⋮ ☐ Save $100 in October      Due 31 Oct  ⋯ │                      │
│ ⋮⋮ ☐ Compare laptop prices                ⋯ │ About this goal      │
│ ⋮⋮ ☐ Buy the laptop                       ⋯ │ I need a laptop for  │
│ [+ Add a step…                             ] │ my Golang course…    │
│                                               │ Created 2 Sep 2026   │
└───────────────────────────────────────────────┴──────────────────────┘

Phone: single column → header (title wraps, status select full width) → progress card →
description (collapsed to 3 lines, "Show more") → steps list → add-step input sticky above the bottom nav.
```

Milestone interactions:
- **Check / uncheck**: shadcn `Checkbox` with the title as its label (44px row). Done items: muted +
  line-through (plus the checked box, so not color only). Optimistic.
- **Add**: input at the bottom; `Enter` adds and **keeps focus** for fast entry; `Esc` clears; empty input
  does nothing. Optional due date via a small calendar button.
- **Edit title**: click title text (or `Enter` when focused) → inline input; `Enter` saves, `Esc` cancels,
  blur saves. Due date and delete in the "⋯" menu.
- **Reorder**: `SortableList` with drag handle `⋮⋮` (pointer, touch, keyboard: `Space` to pick up,
  arrows to move, `Space` to drop, announcements translated).
- **Delete**: from "⋯", no confirm; toast with **Undo**.
- All steps done → toast "All steps done! Mark this goal as done?" with action button.
- Goal with no steps → empty state inside the card: "No steps yet. Break this goal into small steps."
  with the add input focused.
- Status select change to `done` → celebration toast "Goal completed! 🎉" (no confetti library).

Goal form (`ResponsiveDialog`): Title (autofocus), Description (`Textarea`, counter), Area (`Select`
with icons), Priority (segmented `ToggleGroup`: Low / Medium / High), Target date (`DatePicker`, can
clear, past dates allowed with a warning hint), Status (edit only). Unsaved changes → "Discard changes?".

Delete goal: `ConfirmDialog` — "Delete “{title}”? All its steps will be deleted too. This can't be undone."

### 7.3 Dashboard integration

`features/dashboard/components/active-goals.tsx` uses `useGoals({ status: "active", sort: "targetDate",
pageSize: 4 })` and renders `GoalListItem`. "View all" → `/planning`. The dashboard must update after
any milestone toggle (invalidation of `goals.all`).

### 7.4 States

| State | UI |
|---|---|
| List first load | 6 skeleton cards + skeleton stats |
| Page / filter change | old cards dimmed, pagination disabled |
| No goals | empty state with "New goal" |
| No results | "No results for “{query}”" + "Clear filters" |
| Detail loading | skeleton header + 4 skeleton rows |
| Detail not found | "Goal not found" + "Back to Planning" |
| Error | `ErrorState` + "Try again" |

### 7.5 UI state

- List filters/search/sort/page → URL (`useListParams`), not Zustand.
- Goal form dialog open/edit target → local `useState` in the page.
- Optional: remember the last status tab in `preferences-store` (`planningTab`) — only if simple.

### 7.6 Theme tokens

Add to `globals.css` (light + dark): `--area-personal`, `--area-career`, `--area-health`, `--area-finance`,
`--area-learning`, `--area-family`, and reuse `--destructive` (overdue) and a new `--warning` (due soon)
if it doesn't exist yet. Area icons (lucide): `user`, `briefcase`, `heart-pulse`, `wallet`,
`graduation-cap`, `users`.

## 8. Translations (en + km)

Add to **both** files in the same change; list every Khmer key in `messages/TODO-km.md` for review.
Reuse existing `common.*` and `list.*` keys (save, cancel, delete, search, pagination…) — do not duplicate them.

```json
// en.json
"planning": {
  "title": "Planning",
  "description": "Break big goals into small steps.",
  "newGoal": "New goal",
  "editGoal": "Edit goal",
  "backToList": "Back to Planning",
  "searchPlaceholder": "Search goals…",
  "tabs": { "active": "Active", "done": "Done", "all": "All" },
  "filters": { "area": "Area", "allAreas": "All areas", "clear": "Clear filters" },
  "sort": { "dueSoonest": "Due soonest", "newest": "Newest", "mostProgress": "Most progress", "title": "Title (A–Z)" },
  "stats": {
    "active": "Active goals",
    "doneThisYear": "Done this year",
    "overdue": "Overdue",
    "averageProgress": "Average progress"
  },
  "status": { "not_started": "Not started", "in_progress": "In progress", "done": "Done" },
  "area": {
    "personal": "Personal", "career": "Career", "health": "Health",
    "finance": "Finance", "learning": "Learning", "family": "Family"
  },
  "priority": { "label": "{priority} priority", "low": "Low", "medium": "Medium", "high": "High" },
  "progress": "{percent}% done",
  "stepsDone": "{done} of {total} steps",
  "due": {
    "overdue": "{days, plural, one {Overdue by # day} other {Overdue by # days}}",
    "dueToday": "Due today",
    "daysLeft": "{days, plural, one {# day left} other {# days left}}",
    "dueOn": "Due {date}",
    "noDate": "No target date",
    "completedOn": "Completed {date}"
  },
  "actions": { "markDone": "Mark as done", "reopen": "Reopen", "edit": "Edit", "delete": "Delete" },
  "form": {
    "title": "Title",
    "titlePlaceholder": "e.g. Save $500 for a new laptop",
    "description": "Description",
    "descriptionPlaceholder": "Why does this goal matter to you?",
    "area": "Area",
    "priority": "Priority",
    "targetDate": "Target date",
    "targetDatePast": "This date is in the past",
    "status": "Status",
    "discardTitle": "Discard changes?",
    "discardConfirm": "Discard"
  },
  "validation": {
    "required": "Please fill in this field",
    "tooLong": "Too long (max {max} characters)"
  },
  "milestones": {
    "title": "Steps",
    "doneCount": "{done} of {total} done",
    "addPlaceholder": "Add a step…",
    "add": "Add step",
    "setDueDate": "Set due date",
    "removeDueDate": "Remove due date",
    "editTitle": "Edit step",
    "delete": "Delete step",
    "dragHandle": "Drag to reorder",
    "emptyTitle": "No steps yet",
    "emptyDescription": "Break this goal into small steps.",
    "deleted": "Step deleted",
    "undo": "Undo",
    "allDonePrompt": "All steps done! Mark this goal as done?",
    "dnd": {
      "picked": "Picked up step {title}. Position {position} of {total}.",
      "moved": "Step {title} moved to position {position} of {total}.",
      "dropped": "Step {title} dropped at position {position} of {total}.",
      "cancelled": "Reordering cancelled."
    }
  },
  "detail": {
    "about": "About this goal",
    "created": "Created {date}",
    "showMore": "Show more",
    "showLess": "Show less",
    "notFoundTitle": "Goal not found",
    "notFoundDescription": "It may have been deleted."
  },
  "deleteDialog": {
    "title": "Delete “{title}”?",
    "description": "All its steps will be deleted too. This can't be undone.",
    "confirm": "Delete goal"
  },
  "toast": {
    "created": "Goal created",
    "updated": "Changes saved",
    "deleted": "Goal deleted",
    "completed": "Goal completed! 🎉",
    "reopened": "Goal reopened",
    "error": "Something went wrong. Please try again."
  },
  "empty": {
    "title": "No goals yet",
    "description": "Set your first goal and break it into small steps.",
    "doneTitle": "No completed goals yet",
    "doneDescription": "Keep going — you've got this!"
  },
  "loadError": "Could not load goals",
  "dashboard": { "title": "Active goals", "viewAll": "View all" }
}
```

```json
// km.json
"planning": {
  "title": "ផែនការ",
  "description": "បំបែកគោលដៅធំៗ ជាជំហានតូចៗ។",
  "newGoal": "គោលដៅថ្មី",
  "editGoal": "កែគោលដៅ",
  "backToList": "ត្រឡប់ទៅផែនការ",
  "searchPlaceholder": "ស្វែងរកគោលដៅ…",
  "tabs": { "active": "កំពុងធ្វើ", "done": "រួចរាល់", "all": "ទាំងអស់" },
  "filters": { "area": "វិស័យ", "allAreas": "គ្រប់វិស័យ", "clear": "សម្អាតតម្រង" },
  "sort": { "dueSoonest": "ជិតដល់កំណត់មុន", "newest": "ថ្មីបំផុត", "mostProgress": "វឌ្ឍនភាពខ្ពស់បំផុត", "title": "ចំណងជើង (ក–អ)" },
  "stats": {
    "active": "គោលដៅកំពុងធ្វើ",
    "doneThisYear": "សម្រេចបានឆ្នាំនេះ",
    "overdue": "ហួសកំណត់",
    "averageProgress": "វឌ្ឍនភាពមធ្យម"
  },
  "status": { "not_started": "មិនទាន់ចាប់ផ្ដើម", "in_progress": "កំពុងដំណើរការ", "done": "រួចរាល់" },
  "area": {
    "personal": "ផ្ទាល់ខ្លួន", "career": "ការងារ", "health": "សុខភាព",
    "finance": "ហិរញ្ញវត្ថុ", "learning": "ការសិក្សា", "family": "គ្រួសារ"
  },
  "priority": { "label": "អាទិភាព{priority}", "low": "ទាប", "medium": "មធ្យម", "high": "ខ្ពស់" },
  "progress": "រួចរាល់ {percent}%",
  "stepsDone": "{done} នៃ {total} ជំហាន",
  "due": {
    "overdue": "ហួសកំណត់ {days} ថ្ងៃ",
    "dueToday": "ដល់កំណត់ថ្ងៃនេះ",
    "daysLeft": "នៅសល់ {days} ថ្ងៃ",
    "dueOn": "កំណត់ {date}",
    "noDate": "គ្មានកាលបរិច្ឆេទគោលដៅ",
    "completedOn": "បានសម្រេច {date}"
  },
  "actions": { "markDone": "សម្គាល់ថារួចរាល់", "reopen": "បើកឡើងវិញ", "edit": "កែ", "delete": "លុប" },
  "form": {
    "title": "ចំណងជើង",
    "titlePlaceholder": "ឧ. សន្សំ $500 ទិញកុំព្យូទ័រថ្មី",
    "description": "ការពិពណ៌នា",
    "descriptionPlaceholder": "ហេតុអ្វីគោលដៅនេះសំខាន់សម្រាប់អ្នក?",
    "area": "វិស័យ",
    "priority": "អាទិភាព",
    "targetDate": "កាលបរិច្ឆេទគោលដៅ",
    "targetDatePast": "កាលបរិច្ឆេទនេះបានកន្លងផុតហើយ",
    "status": "ស្ថានភាព",
    "discardTitle": "បោះបង់ការកែប្រែ?",
    "discardConfirm": "បោះបង់"
  },
  "validation": {
    "required": "សូមបំពេញចន្លោះនេះ",
    "tooLong": "វែងពេក (អតិបរមា {max} តួអក្សរ)"
  },
  "milestones": {
    "title": "ជំហាន",
    "doneCount": "រួចរាល់ {done} នៃ {total}",
    "addPlaceholder": "បន្ថែមជំហាន…",
    "add": "បន្ថែមជំហាន",
    "setDueDate": "កំណត់ថ្ងៃផុតកំណត់",
    "removeDueDate": "ដកថ្ងៃផុតកំណត់ចេញ",
    "editTitle": "កែជំហាន",
    "delete": "លុបជំហាន",
    "dragHandle": "អូសដើម្បីរៀបលំដាប់",
    "emptyTitle": "មិនទាន់មានជំហាននៅឡើយ",
    "emptyDescription": "បំបែកគោលដៅនេះជាជំហានតូចៗ។",
    "deleted": "បានលុបជំហាន",
    "undo": "ត្រឡប់វិញ",
    "allDonePrompt": "ជំហានទាំងអស់រួចរាល់! សម្គាល់គោលដៅនេះថារួចរាល់?",
    "dnd": {
      "picked": "បានលើកជំហាន {title}។ ទីតាំង {position} នៃ {total}។",
      "moved": "ជំហាន {title} ផ្លាស់ទៅទីតាំង {position} នៃ {total}។",
      "dropped": "ជំហាន {title} ដាក់នៅទីតាំង {position} នៃ {total}។",
      "cancelled": "បានបោះបង់ការរៀបលំដាប់។"
    }
  },
  "detail": {
    "about": "អំពីគោលដៅនេះ",
    "created": "បានបង្កើត {date}",
    "showMore": "បង្ហាញបន្ថែម",
    "showLess": "បង្ហាញតិច",
    "notFoundTitle": "រកមិនឃើញគោលដៅ",
    "notFoundDescription": "វាប្រហែលជាត្រូវបានលុបហើយ។"
  },
  "deleteDialog": {
    "title": "លុប «{title}»?",
    "description": "ជំហានទាំងអស់របស់វាក៏នឹងត្រូវលុបដែរ។ សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។",
    "confirm": "លុបគោលដៅ"
  },
  "toast": {
    "created": "បានបង្កើតគោលដៅ",
    "updated": "បានរក្សាទុកការកែប្រែ",
    "deleted": "បានលុបគោលដៅ",
    "completed": "អបអរសាទរ! អ្នកបានសម្រេចគោលដៅ 🎉",
    "reopened": "បានបើកគោលដៅឡើងវិញ",
    "error": "មានបញ្ហាកើតឡើង។ សូមព្យាយាមម្ដងទៀត។"
  },
  "empty": {
    "title": "មិនទាន់មានគោលដៅនៅឡើយ",
    "description": "កំណត់គោលដៅដំបូងរបស់អ្នក ហើយបំបែកវាជាជំហានតូចៗ។",
    "doneTitle": "មិនទាន់មានគោលដៅដែលសម្រេចបាន",
    "doneDescription": "បន្តទៅមុខទៀត — អ្នកធ្វើបាន!"
  },
  "loadError": "មិនអាចផ្ទុកគោលដៅបានទេ",
  "dashboard": { "title": "គោលដៅកំពុងធ្វើ", "viewAll": "មើលទាំងអស់" }
}
```

i18n rules for this module:
- Goal titles, descriptions and step titles are user data — **never translated**.
- Dates via `format.dateTime(date, { dateStyle: "medium" })`; percentages via `format.number(p / 100, { style: "percent" })`
  or the ICU keys above — never string concatenation.
- The drag-and-drop screen-reader announcements (`milestones.dnd.*`) are passed to dnd-kit's
  `accessibility.announcements`.
- Page titles via `generateMetadata` (`planning.title`; detail page uses the goal title).
- Check in `km` at 360px: long Khmer titles wrap on cards (`break-words`, no fixed card height), badges
  grow, tabs fit (make tabs scrollable if needed), the step input stays usable above the keyboard.

## 9. Tests

- `getDueState`: overdue / due today / due soon / on track / done / no date, with a fixed "today".
- `applyMilestoneChange`: toggle, add, delete → correct `milestonesDone`, `progress`, `status`,
  `completedAt` (incl. first check → in_progress, uncheck on done → in_progress).
- `calcPosition` (moved to `lib/position.ts`) still passes.
- Mock planning handler: filters, search, sort (nulls last), paging, stats, not found.
- `GoalFormDialog`: translated validation, create vs edit, discard confirm.
- `MilestoneList`: add with Enter keeps focus, toggle calls mutation, keyboard reorder, Undo after delete.
- `DataList` grid layout renders cards and keeps loading / empty / error behavior.
- Translation key test: `en.json` and `km.json` have identical keys.
- Playwright (later with API, now with mocks): create goal → add 3 steps → check all → mark done → it
  appears in the Done tab; run in `en` and `km`.

## 10. Build order

1. [ ] Move `calcPosition` to `lib/position.ts`; add `DataList` grid layout; add filters to `useListParams`; create `SortableList`
2. [ ] Types, zod schemas, `utils.ts` (`getDueState`, `applyMilestoneChange`) + tests
3. [ ] Mock handler + seed; `api.ts`; query keys; hooks
4. [ ] Theme tokens (`--area-*`, `--warning`); badges (`GoalAreaBadge`, `GoalDueBadge`); `GoalCard`, `GoalListItem`
5. [ ] Goals list page (stats, tabs, search, area filter, sort, grid, pagination, states)
6. [ ] Goal form dialog (create / edit) + delete dialog
7. [ ] Goal detail page (header, status select, progress card, description)
8. [ ] Milestones: list, toggle, add, inline edit, due date, reorder, delete + undo, all-done prompt
9. [ ] Dashboard `ActiveGoals` widget wired to real hooks
10. [ ] Translations en + km, `TODO-km.md`; responsive / dark mode / keyboard / Khmer pass

Show the user the result after step 5 (list page) and after step 8 (detail page).

## 11. Acceptance criteria

- [ ] No duplicated list / pagination / dialog components — the Expense module's shared components are
      reused and only extended generically (grid layout, filters, `SortableList`, `lib/position.ts`).
- [ ] Goals list: stats, status tabs, search, area filter, sort and pagination work; state is in the URL.
- [ ] Create, edit, change status and delete goals; create goes to the detail page; delete returns to the list.
- [ ] Milestones: add (fast, Enter keeps focus), edit, check/uncheck, reorder (mouse, touch, keyboard),
      delete with Undo; progress and status update instantly and roll back on error
      (test with `NEXT_PUBLIC_MOCK_ERRORS=true`).
- [ ] Overdue / due soon / on track / completed shown with text + color, correct in Asia/Phnom_Penh time.
- [ ] Dashboard "Active goals" updates after changes.
- [ ] All text in `en` and `km`; no hardcoded strings; user data never translated.
- [ ] Works at 360 / 768 / 1280px, light and dark mode, keyboard only.
- [ ] `pnpm lint && pnpm format:check && pnpm typecheck && pnpm test` pass.