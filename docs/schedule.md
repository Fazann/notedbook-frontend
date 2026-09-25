# Feature spec — Schedule module (weekly activities)

Task brief for the coding agent. **This module replaces the Planning (goals) module** — `docs/plan.md` is
dropped; do not build goals or milestones. Read `AGENTS.md`, `STARTER.md` and `docs/expense-categories.md`
first — all their rules apply (shadcn/ui, TanStack Query, Zustand for UI state only, i18n en + km,
responsive, mock data in Phase 1, ESLint/Prettier).

## 1. Goal

A simple weekly calendar for daily life: **what am I doing, and when?**
Examples: *10:10 AM – 10:40 AM Team meeting*, *6:30 PM – 8:00 PM English class*, *6:00 AM Run*.

- `/[locale]/schedule` — **Week view** (default on desktop), **Day view** (default on phones),
  **Agenda view** (list of upcoming activities)
- Create, edit, move and delete activities; **repeating** activities (daily, weekdays, weekly on chosen days)
- Weekly summary: planned hours per type (how much time for learning, meetings, exercise…)
- Dashboard widget **"Today's schedule"** (replaces "Active goals")
- Phase 1: data from the mock layer (`src/mocks/handlers/schedule.ts`). No backend.

**Out of scope (later):** month view, all-day / multi-day / overnight activities, reminders and
notifications, inviting other people, Google Calendar sync, time zones other than the user's,
resizing activities by dragging (edit the times in the form instead), marking activities as done.

## 2. Step 0 — reuse before you build

Reuse the shared components from the Expense module. **Do not create new versions.**

| Need | Reuse |
|---|---|
| Page header, actions | `PageHeader`, `Container` |
| Create / edit form | `ResponsiveDialog`, `FormField`, `DatePicker` |
| Delete / scope questions | `ConfirmDialog` |
| Summary numbers | `StatCard` |
| Loading / empty / error | `LoadingSkeleton`, `EmptyState`, `ErrorState` |
| View switch | shadcn `Tabs` / `ToggleGroup` |
| Position math (not needed here) | — |

New shared pieces (generic, put in `components/shared/` or `lib/` — check first that nothing similar exists):

1. **`TimeInput`** — `components/shared/time-input.tsx`: time picker for `HH:mm` values with 5-minute steps.
   Phone: native `<input type="time" step="300">` (best mobile keyboard). Desktop: `Input` + `Popover`
   list of times every 15 min, typing allowed ("10:10", "1010", "10:10am" all parse). Displays in the
   locale's format (12h for `en`, 24h-style for `km` via `Intl`).
2. **`WeekdayPicker`** — `components/shared/weekday-picker.tsx`: 7 toggle buttons (Mon … Sun) using
   shadcn `ToggleGroup type="multiple"`; labels from `Intl` (`format.dateTime(d, { weekday: "short" })`).
3. **`lib/time.ts`** — pure helpers (unit-tested), no `Date` timezone surprises:
   - `toMinutes("10:10") → 610`, `fromMinutes(610) → "10:10"`
   - `durationMinutes(start, end)`, `addMinutes(time, n)`, `snapMinutes(m, 15)`
   - `startOfWeek(date: "YYYY-MM-DD") → Monday "YYYY-MM-DD"`, `addDays(date, n)`, `weekDays(monday) → 7 dates`
   - `todayInTz("Asia/Phnom_Penh") → "YYYY-MM-DD"`, `nowMinutesInTz(...)`
   - `toZonedDateTime(date, time)` → a `Date` only for **display** with next-intl formatting.

**Timezone rule:** activity dates and times are **wall-clock values in the user's timezone
(Asia/Phnom_Penh)**, stored as strings (`date: "2026-09-28"`, `startTime: "10:10"`). Do date math on
strings / minutes with `lib/time.ts`, never with raw `new Date()` arithmetic. Set
`timeZone: "Asia/Phnom_Penh"` in the next-intl request config so all formatting uses it.

**Week start:** Monday (common in Cambodia). Keep it in one constant `WEEK_STARTS_ON = 1`.

## 3. Data model

```ts
// features/schedule/types.ts
export type ActivityType =
  | "meeting" | "learning" | "work" | "exercise" | "personal" | "family" | "other";

export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;   // ISO: 1 = Monday … 7 = Sunday

export type Recurrence =
  | { kind: "none" }
  | { kind: "daily"; until: string | null }                    // until: YYYY-MM-DD inclusive
  | { kind: "weekdays"; until: string | null }                 // Mon–Fri
  | { kind: "weekly"; days: Weekday[]; until: string | null }; // e.g. [2, 4] = Tue + Thu

/** The saved activity (a single event or a repeating series). */
export type Activity = {
  id: number;
  title: string;
  type: ActivityType;
  date: string;           // YYYY-MM-DD — the first (or only) day
  startTime: string;      // HH:mm, 24h
  endTime: string;        // HH:mm, 24h, same day, > startTime
  location: string;       // optional, "" if empty
  note: string;           // optional, max 500
  recurrence: Recurrence;
  exceptions: string[];   // dates (YYYY-MM-DD) removed from a series ("delete this one only")
  createdAt: string;
  updatedAt: string;
};

/** One concrete appearance on the calendar (what views render). */
export type Occurrence = {
  key: string;            // `${activityId}:${date}` — stable React key
  activityId: number;
  date: string;           // YYYY-MM-DD of this occurrence
  title: string;
  type: ActivityType;
  startTime: string;
  endTime: string;
  location: string;
  note: string;
  isRecurring: boolean;
};

export type WeekSummary = {
  totalMinutes: number;
  byType: Record<ActivityType, number>;  // minutes
  count: number;
};
```

Form schema (zod messages are **translation keys**):

```ts
export const activityFormSchema = z.object({
  title: z.string().trim().min(1, "required").max(100, "tooLong"),
  type: z.enum(ACTIVITY_TYPES),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  location: z.string().trim().max(100, "tooLong").default(""),
  note: z.string().trim().max(500, "tooLong").default(""),
  recurrence: recurrenceSchema,
})
.refine((v) => toMinutes(v.endTime) > toMinutes(v.startTime), { path: ["endTime"], message: "endAfterStart" })
.refine((v) => durationMinutes(v.startTime, v.endTime) >= 5, { path: ["endTime"], message: "tooShort" });
// weekly recurrence must have at least 1 day ("pickDay"); until must be >= date ("untilBeforeStart")
```

### Rules

- **Overlaps are allowed** (real life overlaps), but the form shows a warning:
  "Overlaps with “Team meeting” (10:10 AM – 10:40 AM)". Saving still works.
- **Editing / deleting a repeating activity** asks for the scope:
  - *This activity only* → edit: add the date to `exceptions` of the series and create a new single
    activity with the changes; delete: add the date to `exceptions`.
  - *All activities in the series* → edit/delete the series itself.
  (No "this and following" in Phase 1.)
- Moving an occurrence by drag and drop counts as an edit → same scope question for repeating activities.
- Default new activity: type `other`, date = selected day, start = clicked slot (or next full half hour),
  duration 60 min (30 min for `meeting`).
- Expanding a series into occurrences is a pure function `expandOccurrences(activities, from, to)` in
  `features/schedule/utils.ts`. The mock uses it now; the UI uses it for optimistic updates. Unit-test it
  (daily, weekdays, weekly multi-day, `until`, exceptions, week boundaries).

## 4. API contract (the mock implements it now)

```
GET    /schedule/occurrences?from=2026-09-28&to=2026-10-04   → Occurrence[]  (series already expanded, sorted by date + startTime)
GET    /schedule/summary?from=2026-09-28&to=2026-10-04       → WeekSummary
GET    /schedule/activities/:id                               → Activity
POST   /schedule/activities            ActivityFormValues     → Activity (201)
PUT    /schedule/activities/:id?scope=all                      ActivityFormValues → Activity
PUT    /schedule/activities/:id?scope=this&date=2026-09-30     ActivityFormValues → { series: Activity, created: Activity }
DELETE /schedule/activities/:id?scope=all                      → 204
DELETE /schedule/activities/:id?scope=this&date=2026-09-30     → 204
```

- `from`/`to` are inclusive dates; max range 42 days (enough for a future month view).
- Errors: `VALIDATION_ERROR` (422, `fields`), `NOT_FOUND` (404).

## 5. Mock layer — `src/mocks/handlers/schedule.ts`

Seed a realistic weekly routine (dates relative to the current week):

| Activity | Type | When | Repeat |
|---|---|---|---|
| Run by the riverside | exercise | 06:00–06:45 | weekly Mon, Wed, Fri |
| Office work | work | 08:00–12:00 | weekdays |
| Team stand-up meeting | meeting | 10:10–10:40 | weekdays (overlaps work on purpose) |
| Lunch break | personal | 12:00–13:30 | weekdays |
| Office work | work | 13:30–17:30 | weekdays |
| English class (IELTS) | learning | 18:30–20:00 | weekly Tue, Thu |
| Golang self-study | learning | 20:30–21:30 | weekly Mon, Wed |
| Golang weekend project | learning | 09:00–11:00 | weekly Sat |
| Gym | exercise | 16:00–17:00 | weekly Sat |
| Dinner with family | family | 17:30–19:00 | weekly Sun |
| Meeting with client | meeting | 10:10–11:00 | one-off, this Thursday, location "Coffee shop, BKK1" |
| Dentist appointment | personal | 14:00–14:30 | one-off, this Wednesday |
| Call parents | family | 20:00–20:20 | one-off, next Tuesday |

- One series has an exception (e.g. no English class next Thursday) so exceptions are visible.
- Implement the contract exactly (scope rules, summary, errors); use `delay()` and the optional
  random error (`NEXT_PUBLIC_MOCK_ERRORS`).

## 6. Query keys and hooks

```ts
qk.schedule.all                          // ["schedule"]
qk.schedule.occurrences(from, to)        // ["schedule", "occurrences", from, to]
qk.schedule.summary(from, to)            // ["schedule", "summary", from, to]
qk.schedule.activity(id)                 // ["schedule", "activity", id]
```

| Hook | Notes |
|---|---|
| `useOccurrences(from, to)` | `placeholderData: keepPreviousData` (no flash when changing week); **prefetch** previous + next week |
| `useWeekSummary(from, to)` | summary strip |
| `useActivity(id)` | load the full series when opening the edit form |
| `useCreateActivity()` | optimistic: add expanded occurrences to visible ranges; toast; invalidate `schedule.all` |
| `useUpdateActivity()` | takes `{ id, scope, date?, values }`; optimistic for scope `this` and for moves; invalidate `schedule.all` |
| `useDeleteActivity()` | takes `{ id, scope, date? }`; optimistic remove; toast with **Undo** for single / "this only" deletes |

Rollback on every optimistic update error, with an error toast.

## 7. UI

Files:
```
app/[locale]/(app)/schedule/page.tsx                    # thin → <SchedulePage />
features/schedule/components/schedule-page.tsx          # header, nav, view switch, summary, current view
features/schedule/components/schedule-toolbar.tsx       # ‹ Today › , date range label, view switch, + New
features/schedule/components/week-summary.tsx
features/schedule/components/week-view.tsx
features/schedule/components/day-view.tsx
features/schedule/components/agenda-view.tsx
features/schedule/components/time-grid.tsx              # shared by week + day view (hour lines, now line)
features/schedule/components/occurrence-block.tsx       # the colored block in the grid
features/schedule/components/activity-form-dialog.tsx   # create + edit
features/schedule/components/activity-details.tsx       # popover (desktop) / sheet (phone) on click
features/schedule/components/recurrence-fields.tsx
features/schedule/components/scope-dialog.tsx           # "This activity only / All in series"
features/schedule/components/today-schedule.tsx         # dashboard widget
```

### 7.1 Page and toolbar

- URL state: `?view=week|day|agenda&date=2026-09-30` (via `useListParams`-style hook or a small
  `useScheduleParams`). `date` = any day in the shown week/day; default today.
- Last chosen view saved in `preferences-store` (`scheduleView`); the URL wins if present. On phones
  `week` falls back to `day` (the week grid is too narrow).
- Toolbar: `‹` `Today` `›` buttons, range label ("28 Sep – 4 Oct 2026" / "Wednesday, 30 Sep"),
  view `ToggleGroup` (Week / Day / Agenda), `+ New activity` button.
- Keyboard shortcuts (desktop, ignored while typing): `←`/`→` previous/next, `T` today, `N` new,
  `W`/`D`/`A` switch view. Shown in a tooltip on the buttons.

### 7.2 Week view (md+)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Schedule                                                     [+ New activity] │
│ ‹  Today  ›   28 Sep – 4 Oct 2026                  [ Week | Day | Agenda ]   │
├──────────────┬──────────────┬──────────────┬─────────────────────────────────┤
│ Planned 38h  │ Learning 6h  │ Meetings 6   │ ▇▇▇▇ work ▇▇ learning ▇ exercise │  ← summary
├──────┬───────┴──┬──────────┬──────────┬────┴─────┬──────────┬───────┬───────┤
│      │ Mon 28   │ Tue 29   │ Wed 30 ● │ Thu 1    │ Fri 2    │ Sat 3 │ Sun 4 │
├──────┼──────────┼──────────┼──────────┼──────────┼──────────┼───────┼───────┤
│ 6 AM │ Run      │          │ Run      │          │ Run      │       │       │
│ 7 AM │          │          │          │          │          │       │       │
│ 8 AM │ Office   │ Office   │ Office   │ Office   │ Office   │       │       │
│ 9 AM │ work     │ work     │ work     │ work     │ work     │ Golang│       │
│10 AM │ ┊Stand-up│ ┊Stand-up│ ┊Stand-up│┊Client┊Su│ ┊Stand-up│project│       │
│11 AM │          │          │ ─── now ─│──────────│          │       │       │
│  …   │          │          │          │          │          │       │       │
│ 6 PM │          │ English  │          │ English  │          │       │       │
└──────┴──────────┴──────────┴──────────┴──────────┴──────────┴───────┴───────┘
```

- Visible hours **06:00–23:00** (constant), 1 hour = 48px, 15-minute snap; grid scrolls vertically,
  header row with day names stays sticky. On open, scroll so "now" (or 08:00 on other weeks) is near the top.
- Today's column header highlighted; a **now line** (red, with a dot) on today, updated every minute.
- Activities earlier than 06:00 or later than 23:00: show a small "+2 earlier" / "+1 later" chip at the
  top/bottom of the column that expands the range (don't hide data).
- **Overlapping activities** are placed side by side: pure function `layoutDay(occurrences)` →
  `{ key, column, columns }` for left/width (unit-tested). Max 3 visible columns; more → "+N" chip.
- `OccurrenceBlock`: type color (left border + light background token), title (bold), time range, location
  icon if set, repeat icon if recurring. Short blocks (< 30 min) show only title + start time on one line.
- **Click empty slot** → form opens with that day + time (snapped to 15 min).
- **Click block** → `ActivityDetails` popover: title, type badge, date + time, duration, location, note,
  repeat description ("Every Tue and Thu until 31 Dec"), buttons Edit / Delete.
- **Drag a block to move** (dnd-kit, pointer + keyboard; 15-min snap; shows a ghost with the new time).
  Drop → optimistic update; repeating → `ScopeDialog` first. Keyboard: focus block, `Space` to pick,
  arrows (↑↓ 15 min, ←→ one day), `Space` to drop, `Esc` cancel; announcements translated.

### 7.3 Day view (phones default, also on desktop)

```
┌───────────────────────────────┐
│ ☰  Schedule              (S)  │
│ ‹  Wed, 30 Sep 2026  ›  Today │
│ [M][T][W●][T][F][S][S]        │  ← week strip, dots show days with activities; tap to switch day
│ Planned today 7h 45m          │
├───────────────────────────────┤
│ 6 AM ┃ Run by the riverside   │
│      ┃ 6:00 – 6:45 AM         │
│ 8 AM ┃ Office work            │
│ 10AM ┃┊ Stand-up 10:10–10:40  │
│ 11AM ─────── now ──────────── │
│  …                            │
│                          (+)  │  ← floating button opens "New activity" (on this page instead of quick-add expense)
├───────────────────────────────┤
│  ▣    ◎    ▦    ▤             │  ← bottom nav
└───────────────────────────────┘
```

- Same `TimeGrid` with one column. Swipe left/right on the grid changes the day (with buttons as the
  accessible alternative). Tap a block → details in a bottom `Drawer`.
- Drag to move is **off on touch** in Phase 1 (long-press conflicts with scrolling) — use Edit.

### 7.4 Agenda view

- List of the next **14 days** from the selected date, grouped by day header ("Today", "Tomorrow",
  "Thursday, 1 Oct"). Each row: time range, color dot + type, title, location. Empty days are skipped;
  a "Load next 14 days" button at the end.
- Agenda is the simplest view for phones and screen readers. The grid views must still be accessible:
  every block is a real button with a full label ("Team stand-up meeting, Wednesday 30 September,
  10:10 to 10:40 AM, repeats").

### 7.5 Activity form (`ResponsiveDialog`)

Fields, in this order (fast to fill on a phone):
1. **Title** (autofocus) — below it, quick type chips: Meeting · Learning · Work · Exercise · Personal ·
   Family · Other (single select, icon + text).
2. **Date** (`DatePicker`) · **Start** (`TimeInput`) · **End** (`TimeInput`). Changing Start keeps the
   same duration (moves End). Shows duration live: "1 h 30 min".
3. **Repeat** (`Select`): Does not repeat · Every day · Every weekday (Mon–Fri) · Every week on… →
   `WeekdayPicker` (pre-selects the chosen date's weekday) · **Until** (`DatePicker`, optional, "No end date").
4. **Location** (optional) · **Note** (optional `Textarea`).
- Overlap warning (amber `Alert`, text + icon) under the times when it overlaps another occurrence.
- Edit of a repeating activity: on Save → `ScopeDialog` ("This activity only" / "All activities in the
  series"). If only the title/type/location/note changed, the default choice is "All".
- Unsaved changes + close → "Discard changes?".

### 7.6 Dashboard — "Today's schedule" widget

Replaces `ActiveGoals` in the dashboard grid (same slot):
- **Now / Next** card at top: current activity with time left ("Ends in 25 min") or next one ("Starts in
  40 min — English class"), or "Nothing else today 🎉".
- List of today's remaining activities (max 5) + "View schedule" link → `/schedule?view=day`.
- Uses `useOccurrences(today, today)`; the "now" state updates every minute.

### 7.7 States

| State | UI |
|---|---|
| First load | skeleton grid (hour lines + a few gray blocks) / skeleton rows in agenda |
| Changing week/day | keep old blocks dimmed (`keepPreviousData`), toolbar still usable |
| Empty week | grid still shows; centered hint "No activities this week — click a time slot to add one" (phone: "Tap + to add one") |
| Error | `ErrorState` "Could not load your schedule" + "Try again" |

### 7.8 Theme tokens

Add to `globals.css` for light + dark, register in Tailwind theme:
`--activity-meeting`, `--activity-learning`, `--activity-work`, `--activity-exercise`,
`--activity-personal`, `--activity-family`, `--activity-other` (each with a `-foreground` and a soft
`-muted` background variant). Reuse `--destructive` for the now line. Icons (lucide): `users`,
`graduation-cap`, `briefcase`, `dumbbell`, `user`, `heart`, `circle-dot`. Blocks show the type **icon +
text** somewhere (details / label) so color is not the only signal.

## 8. Translations (en + km)

Add to **both** files in the same change; list every Khmer key in `messages/TODO-km.md`. Reuse
`common.*` keys (save, cancel, delete, edit…). **Weekday and month names, times and date ranges come from
`Intl` via next-intl** (`format.dateTime`, `format.dateTimeRange`) — do not add them as keys.
Also change `nav.planning` → `nav.schedule` ("Schedule" / "កាលវិភាគ").

```json
// en.json
"schedule": {
  "title": "Schedule",
  "description": "Plan your week, one activity at a time.",
  "newActivity": "New activity",
  "editActivity": "Edit activity",
  "today": "Today",
  "tomorrow": "Tomorrow",
  "previousWeek": "Previous week",
  "nextWeek": "Next week",
  "previousDay": "Previous day",
  "nextDay": "Next day",
  "now": "Now",
  "views": { "week": "Week", "day": "Day", "agenda": "Agenda" },
  "types": {
    "meeting": "Meeting", "learning": "Learning", "work": "Work", "exercise": "Exercise",
    "personal": "Personal", "family": "Family", "other": "Other"
  },
  "summary": {
    "planned": "Planned",
    "plannedToday": "Planned today",
    "learning": "Learning",
    "meetings": "{count, plural, one {# meeting} other {# meetings}}",
    "byType": "Time by type"
  },
  "duration": {
    "hoursMinutes": "{hours} h {minutes} min",
    "hours": "{hours} h",
    "minutes": "{minutes} min"
  },
  "form": {
    "title": "Title",
    "titlePlaceholder": "e.g. Team meeting",
    "type": "Type",
    "date": "Date",
    "start": "Start",
    "end": "End",
    "duration": "Duration",
    "location": "Location",
    "locationPlaceholder": "e.g. Office, Zoom, Coffee shop",
    "note": "Note",
    "repeat": "Repeat",
    "repeatNone": "Does not repeat",
    "repeatDaily": "Every day",
    "repeatWeekdays": "Every weekday (Mon–Fri)",
    "repeatWeekly": "Every week on…",
    "repeatOn": "Repeat on",
    "until": "Until",
    "untilNever": "No end date",
    "overlap": "Overlaps with “{title}” ({time})",
    "discardTitle": "Discard changes?",
    "discardConfirm": "Discard"
  },
  "repeatDescription": {
    "daily": "Every day",
    "weekdays": "Every weekday",
    "weekly": "Every {days}",
    "until": "{rule} until {date}"
  },
  "validation": {
    "required": "Please fill in this field",
    "tooLong": "Too long (max {max} characters)",
    "endAfterStart": "End time must be after start time",
    "tooShort": "An activity must be at least {min} minutes",
    "pickDay": "Choose at least one day",
    "untilBeforeStart": "End date must be after the start date"
  },
  "scope": {
    "editTitle": "Edit repeating activity",
    "deleteTitle": "Delete repeating activity",
    "moveTitle": "Move repeating activity",
    "thisOnly": "This activity only",
    "all": "All activities in the series"
  },
  "details": {
    "repeats": "Repeats",
    "blockLabel": "{title}, {date}, {time}",
    "blockLabelRecurring": "{title}, {date}, {time}, repeats"
  },
  "grid": {
    "earlier": "{count, plural, one {+# earlier} other {+# earlier}}",
    "later": "{count, plural, one {+# later} other {+# later}}",
    "more": "+{count} more",
    "addAt": "Add activity on {date} at {time}"
  },
  "dnd": {
    "picked": "Picked up {title}.",
    "moved": "{title} moved to {date} at {time}.",
    "dropped": "{title} dropped on {date} at {time}.",
    "cancelled": "Move cancelled."
  },
  "agenda": { "loadMore": "Load next 14 days", "noMore": "No more activities" },
  "deleteDialog": {
    "title": "Delete “{title}”?",
    "description": "This can't be undone.",
    "confirm": "Delete"
  },
  "toast": {
    "created": "Activity added",
    "updated": "Changes saved",
    "moved": "Activity moved",
    "deleted": "Activity deleted",
    "undo": "Undo",
    "error": "Something went wrong. Please try again."
  },
  "empty": {
    "week": "No activities this week — click a time slot to add one",
    "weekTouch": "No activities this week — tap + to add one",
    "day": "Nothing planned for this day"
  },
  "loadError": "Could not load your schedule",
  "shortcuts": { "title": "Keyboard shortcuts" },
  "dashboard": {
    "title": "Today's schedule",
    "now": "Now",
    "next": "Next",
    "endsIn": "Ends in {time}",
    "startsIn": "Starts in {time}",
    "nothingLeft": "Nothing else today 🎉",
    "viewAll": "View schedule"
  }
}
```

```json
// km.json
"schedule": {
  "title": "កាលវិភាគ",
  "description": "រៀបចំសប្ដាហ៍របស់អ្នក ម្ដងមួយសកម្មភាព។",
  "newActivity": "សកម្មភាពថ្មី",
  "editActivity": "កែសកម្មភាព",
  "today": "ថ្ងៃនេះ",
  "tomorrow": "ថ្ងៃស្អែក",
  "previousWeek": "សប្ដាហ៍មុន",
  "nextWeek": "សប្ដាហ៍ក្រោយ",
  "previousDay": "ថ្ងៃមុន",
  "nextDay": "ថ្ងៃបន្ទាប់",
  "now": "ឥឡូវ",
  "views": { "week": "សប្ដាហ៍", "day": "ថ្ងៃ", "agenda": "បញ្ជី" },
  "types": {
    "meeting": "ប្រជុំ", "learning": "ការសិក្សា", "work": "ការងារ", "exercise": "ហាត់ប្រាណ",
    "personal": "ផ្ទាល់ខ្លួន", "family": "គ្រួសារ", "other": "ផ្សេងៗ"
  },
  "summary": {
    "planned": "បានគ្រោងទុក",
    "plannedToday": "បានគ្រោងទុកថ្ងៃនេះ",
    "learning": "ការសិក្សា",
    "meetings": "ប្រជុំ {count} ដង",
    "byType": "ពេលវេលាតាមប្រភេទ"
  },
  "duration": {
    "hoursMinutes": "{hours} ម៉ោង {minutes} នាទី",
    "hours": "{hours} ម៉ោង",
    "minutes": "{minutes} នាទី"
  },
  "form": {
    "title": "ចំណងជើង",
    "titlePlaceholder": "ឧ. ប្រជុំក្រុម",
    "type": "ប្រភេទ",
    "date": "កាលបរិច្ឆេទ",
    "start": "ចាប់ផ្ដើម",
    "end": "បញ្ចប់",
    "duration": "រយៈពេល",
    "location": "ទីកន្លែង",
    "locationPlaceholder": "ឧ. ការិយាល័យ, Zoom, ហាងកាហ្វេ",
    "note": "កំណត់ចំណាំ",
    "repeat": "ធ្វើម្ដងទៀត",
    "repeatNone": "មិនធ្វើម្ដងទៀត",
    "repeatDaily": "រៀងរាល់ថ្ងៃ",
    "repeatWeekdays": "រៀងរាល់ថ្ងៃធ្វើការ (ច័ន្ទ–សុក្រ)",
    "repeatWeekly": "រៀងរាល់សប្ដាហ៍នៅថ្ងៃ…",
    "repeatOn": "ធ្វើម្ដងទៀតនៅថ្ងៃ",
    "until": "រហូតដល់",
    "untilNever": "គ្មានថ្ងៃបញ្ចប់",
    "overlap": "ជាន់ម៉ោងជាមួយ «{title}» ({time})",
    "discardTitle": "បោះបង់ការកែប្រែ?",
    "discardConfirm": "បោះបង់"
  },
  "repeatDescription": {
    "daily": "រៀងរាល់ថ្ងៃ",
    "weekdays": "រៀងរាល់ថ្ងៃធ្វើការ",
    "weekly": "រៀងរាល់ {days}",
    "until": "{rule} រហូតដល់ {date}"
  },
  "validation": {
    "required": "សូមបំពេញចន្លោះនេះ",
    "tooLong": "វែងពេក (អតិបរមា {max} តួអក្សរ)",
    "endAfterStart": "ម៉ោងបញ្ចប់ត្រូវនៅក្រោយម៉ោងចាប់ផ្ដើម",
    "tooShort": "សកម្មភាពត្រូវមានរយៈពេលយ៉ាងហោចណាស់ {min} នាទី",
    "pickDay": "សូមជ្រើសរើសយ៉ាងហោចណាស់មួយថ្ងៃ",
    "untilBeforeStart": "ថ្ងៃបញ្ចប់ត្រូវនៅក្រោយថ្ងៃចាប់ផ្ដើម"
  },
  "scope": {
    "editTitle": "កែសកម្មភាពដែលធ្វើម្ដងទៀត",
    "deleteTitle": "លុបសកម្មភាពដែលធ្វើម្ដងទៀត",
    "moveTitle": "ផ្លាស់ទីសកម្មភាពដែលធ្វើម្ដងទៀត",
    "thisOnly": "តែសកម្មភាពនេះប៉ុណ្ណោះ",
    "all": "សកម្មភាពទាំងអស់ក្នុងស៊េរីនេះ"
  },
  "details": {
    "repeats": "ធ្វើម្ដងទៀត",
    "blockLabel": "{title}, {date}, {time}",
    "blockLabelRecurring": "{title}, {date}, {time}, ធ្វើម្ដងទៀត"
  },
  "grid": {
    "earlier": "+{count} មុននេះ",
    "later": "+{count} ក្រោយនេះ",
    "more": "+{count} ទៀត",
    "addAt": "បន្ថែមសកម្មភាពនៅ {date} ម៉ោង {time}"
  },
  "dnd": {
    "picked": "បានលើក {title}។",
    "moved": "{title} ផ្លាស់ទៅ {date} ម៉ោង {time}។",
    "dropped": "{title} ដាក់នៅ {date} ម៉ោង {time}។",
    "cancelled": "បានបោះបង់ការផ្លាស់ទី។"
  },
  "agenda": { "loadMore": "ផ្ទុក ១៤ ថ្ងៃបន្ទាប់", "noMore": "គ្មានសកម្មភាពទៀតទេ" },
  "deleteDialog": {
    "title": "លុប «{title}»?",
    "description": "សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។",
    "confirm": "លុប"
  },
  "toast": {
    "created": "បានបន្ថែមសកម្មភាព",
    "updated": "បានរក្សាទុកការកែប្រែ",
    "moved": "បានផ្លាស់ទីសកម្មភាព",
    "deleted": "បានលុបសកម្មភាព",
    "undo": "ត្រឡប់វិញ",
    "error": "មានបញ្ហាកើតឡើង។ សូមព្យាយាមម្ដងទៀត។"
  },
  "empty": {
    "week": "សប្ដាហ៍នេះមិនទាន់មានសកម្មភាព — ចុចលើម៉ោងទំនេរ ដើម្បីបន្ថែម",
    "weekTouch": "សប្ដាហ៍នេះមិនទាន់មានសកម្មភាព — ចុច + ដើម្បីបន្ថែម",
    "day": "មិនមានអ្វីគ្រោងទុកសម្រាប់ថ្ងៃនេះទេ"
  },
  "loadError": "មិនអាចផ្ទុកកាលវិភាគរបស់អ្នកបានទេ",
  "shortcuts": { "title": "ផ្លូវកាត់ក្ដារចុច" },
  "dashboard": {
    "title": "កាលវិភាគថ្ងៃនេះ",
    "now": "ឥឡូវ",
    "next": "បន្ទាប់",
    "endsIn": "បញ្ចប់ក្នុងរយៈពេល {time}",
    "startsIn": "ចាប់ផ្ដើមក្នុងរយៈពេល {time}",
    "nothingLeft": "គ្មានអ្វីទៀតទេថ្ងៃនេះ 🎉",
    "viewAll": "មើលកាលវិភាគ"
  }
}
```

i18n rules for this module:
- Activity titles, locations and notes are user data — **never translated**.
- Times: `format.dateTime(toZonedDateTime(date, time), { hour: "numeric", minute: "2-digit" })` →
  `en` "10:10 AM", `km` uses the Khmer locale format. Ranges: `format.dateTimeRange(start, end, …)`.
- Weekday list in `repeatDescription.weekly` built with `Intl.ListFormat` in the current locale
  ("Tue and Thu" / Khmer equivalent) — never joined with `", "` by hand.
- Numbers (hours, counts) through ICU / `format.number`.
- Check in `km` at 360px: day strip labels fit, short blocks don't overflow (truncate with full label in
  `aria-label` and details), type chips wrap, form time fields stay on one row or stack cleanly.

## 9. Tests

- `lib/time.ts`: minutes conversion, add/snap, `startOfWeek` (Monday), week across month/year end,
  `todayInTz` near midnight UTC (e.g. 23:30 UTC = next day in Phnom Penh).
- `expandOccurrences`: none / daily / weekdays / weekly multi-day / `until` / exceptions / range edges.
- `layoutDay`: no overlap, 2 overlapping, 3+ overlapping ("+N"), touching times (10:00–11:00 and
  11:00–12:00 do **not** overlap).
- Scope logic in the mock: edit/delete "this only" creates exception (+ new activity for edit); "all" edits the series.
- `ActivityFormDialog`: end after start, min 5 min, weekly needs a day, until ≥ date, keeps duration when
  start changes, overlap warning, translated messages, scope dialog for repeating activities.
- Week view: renders blocks at the right position, click empty slot opens form with that time, keyboard move.
- Translation key test: `en.json` and `km.json` have identical keys.
- Playwright (with mocks): add "Team meeting" Mon 10:10–10:40 repeating weekdays → appears Mon–Fri →
  delete Wednesday only → Wednesday empty, others remain; run in `en` and `km`.

## 10. Build order

1. [ ] `lib/time.ts` + tests; `TimeInput`, `WeekdayPicker`; next-intl `timeZone` config
2. [ ] Types, zod schema, `expandOccurrences`, `layoutDay` + tests
3. [ ] Mock handler + seed; `api.ts`; query keys; hooks (incl. prefetch)
4. [ ] Theme tokens `--activity-*`; `OccurrenceBlock`; `TimeGrid` (hours, now line, sticky header)
5. [ ] Schedule page: toolbar, URL state, **Week view**, week summary
6. [ ] Activity form (create / edit, repeat, overlap warning) + details popover + scope dialog + delete with Undo
7. [ ] **Day view** with week strip (phone default) + **Agenda view**
8. [ ] Drag to move (desktop pointer + keyboard) with scope handling
9. [ ] Dashboard "Today's schedule" widget (replace Active goals)
10. [ ] Translations en + km, `TODO-km.md`; responsive / dark mode / keyboard / Khmer pass

Show the user the result after step 5 (week view with mock data) and after step 7 (all views + form).

## 11. Acceptance criteria

- [ ] No goals/milestones code; nav shows **Schedule**; shared components reused, new shared pieces
      (`TimeInput`, `WeekdayPicker`, `lib/time.ts`) are generic.
- [ ] Week view (desktop), Day view (phone default) and Agenda view show the seeded routine correctly,
      including overlaps side by side and the now line.
- [ ] Create, edit, move (drag on desktop) and delete activities; repeating activities with
      "This activity only / All" work for edit, move and delete; Undo after delete.
- [ ] Times are correct in Asia/Phnom_Penh, including around midnight; week starts Monday.
- [ ] Optimistic changes roll back on error (test with `NEXT_PUBLIC_MOCK_ERRORS=true`).
- [ ] Weekly summary and dashboard "Today's schedule" update after changes.
- [ ] All text in `en` and `km`; weekday/month/time names from `Intl`; user data never translated.
- [ ] Works at 360 / 768 / 1280px, light and dark mode, keyboard only.
- [ ] `pnpm lint && pnpm format:check && pnpm typecheck && pnpm test` pass.