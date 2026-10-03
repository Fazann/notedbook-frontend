# Khmer translations to review

All strings in `km.json` were machine-drafted during the Phase 1 prototype and need a native speaker
to review wording and tone. Pay special attention to:

- `dashboard.greeting.*` — formal greetings; a more casual tone may fit the app better.
- `dashboard.stats.*` and `dashboard.goals.*` — plural messages (Khmer uses only `other`).
- `currency.USD` / `currency.KHR` / `currency.MYR` — "ដុល្លារ" / "រៀល" / "រីងហ្គីត" vs. keeping the ISO codes.
- `dashboard.stats.spentMyr` / `expense.summary.spentMyr` — Malaysian ringgit totals.
- `nav.boards` — "ក្ដារកិច្ចការ" (from AGENTS.md example).

## Expense categories (docs/category-exspense.md)

Draft Khmer from the spec — please review every key in these namespaces:

- `list.*` — shared list / pagination text (search, sort, "Showing {from}–{to} of {total}", "Page {page} of {totalPages}").
- `category.*` — title, tabs, columns, sort options, form, validation, delete dialog, toasts, empty state.
- `category.defaults.*` — default category names (moved here from the old top-level `category.<key>`;
  "shopping" now uses the spec's "ការទិញទំនិញ").
- `category.icons.*` — labels for the 24 icons in the icon picker (not in the spec; added for screen readers).
- `category.colors.*` — color names for the color swatches.
- `category.manage` — "Manage categories" item in the expense form's category picker (not in the spec).
- `category.deleteDialog.descriptionInUse` — the English version uses plurals; the Khmer draft does not.

## Expenses list (`/expenses`)

Draft Khmer — please review these new keys in the `expense` namespace:

- `expense.title`, `expense.description`, `expense.searchPlaceholder`, `expense.noNote`, `expense.loadError`
- `expense.deleted`, `expense.undo` ("មិនធ្វើវិញ" — maybe "ត្រឡប់វិញ" reads better), `expense.restored`
- `expense.columns.*`, `expense.sort.*`, `expense.filters.*`
- `expense.summary.*` — `countHint` uses only the `other` plural form.
- `expense.deleteDialog.*`, `expense.empty.*`

## Planning (docs/plan.md)

Draft Khmer from the spec — please review every key in the `planning` namespace. In particular:

- `planning.due.*`, `planning.milestones.doneCount`, `planning.stepsDone` — plural messages; the Khmer drafts have
  no plural forms (`due.overdue` / `due.daysLeft` use `{days}` directly).
- `planning.priority.label` — "អាទិភាព{priority}" (e.g. "អាទិភាពខ្ពស់"); check word order.
- `planning.tabs.*` vs `planning.status.*` — "កំពុងធ្វើ" (active tab) and "កំពុងដំណើរការ" (in progress status).
- Not in the spec, added for the UI: `planning.filters.areaCount`, `planning.filters.noArea`,
  `planning.milestones.dnd.instructions` (keyboard drag help read by screen readers), `planning.milestones.dueOn`,
  `planning.milestones.saving`, `planning.form.clearDate`, `planning.form.pickDate`, `planning.detail.progress`,
  `planning.filters.noMatch`, `planning.filters.status`, `list.clearSelection`,
  `planning.detail.documentTitle` (browser tab title; no words to translate).
- Removed `dashboard.goals.title|steps|percent|daysLeft|overdue` — the dashboard widget now uses `planning.*`.

## Schedule (docs/schedule.md)

Draft Khmer from the spec — please review every key in the `schedule` namespace, and `nav.schedule`
("កាលវិភាគ", next to `nav.planning`). In particular:

- `schedule.summary.meetings`, `schedule.grid.earlier|later` — no plural forms in the Khmer drafts.
- `schedule.duration.*` — "{hours} ម៉ោង {minutes} នាទី".
- `schedule.repeatDescription.weekly` — "រៀងរាល់ {days}", where `{days}` is a list of weekday names from Intl.
- Not in the spec, added for the UI: `schedule.views.label`, `schedule.form.pickDate`, `schedule.form.clearUntil`,
  `schedule.dnd.instructions` (keyboard move help read by screen readers), `schedule.shortcuts.hint`,
  `schedule.weekStrip`, `schedule.details.close`, `schedule.grid.hiddenTitle`.
- `app.description` — now mentions both goals and the weekly schedule; please check the wording.
- Weekday / month names, times and date ranges come from Intl — nothing to translate there.

## Language switcher

- `language.km` — now "ភាសាខ្មែរ" (shown in Khmer in both languages, like "English" is always English).
- `language.current` — "ភាសា៖ {name}", the switcher button's screen-reader label.

## Category Khmer name

- `category.form.nameKm`, `category.form.nameKmPlaceholder`, `category.form.nameKmHint` — the new optional
  "Khmer name" field in the category form.
- Seed data (mock only): Khmer names of the sample user categories in `src/mocks/seed.ts`.

## Login (`/login`, `/register`, `/forgot-password`)

Draft Khmer — please review every key in the `auth` namespace, especially `auth.noAccount` / `auth.hasAccount`
(the `<link>` tag wraps the clickable part) and `auth.errors.invalidCredentials`.

## Register (`/register`)

Draft Khmer — please review the new register keys in `auth`: `registerDescription`, `fullname*`, `usernameHint`,
`emailOptional`, `passwordHint`, `registerSubmit`, the new `auth.validation.*` messages and
`auth.errors.USERNAME_TAKEN` / `auth.errors.EMAIL_TAKEN`.

## Settings (profile + change password)

Machine-drafted — please review:

- `settings.*` — page title, tabs, profile photo, profile form, change password form, toasts.
- `auth.validation.fullnameTooShort` / `usernameMinLength` / `profileUsernameFormat` / `emailCannotClear` /
  `passwordMismatch` / `passwordSame`.
- `auth.errors.INCORRECT_PASSWORD` / `INVALID_USERNAME` / `INVALID_EMAIL` / `INVALID_FULLNAME`.
- `errors.VALIDATION_FAILED` / `FILE_TOO_LARGE` / `INVALID_ATTACHMENT_TYPE` / `ATTACHMENT_IN_USE`.

## Planning (real API)

Machine-drafted — please review `planning.validation.tooShort`.

## Dashboard (real API)

Machine-drafted — please review `dashboard.tasks.comingSoon`.
