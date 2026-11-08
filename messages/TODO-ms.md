# Malay translations to review

All strings in `ms.json` were machine-drafted when Bahasa Melayu was added and need a native speaker to review
wording and tone. Pay special attention to:

- `dashboard.greeting.*` — "Selamat petang" is used for evening; some prefer "Selamat malam" after dark.
- `nav.boards` — "Papan" (kanban boards); "Papan tugasan" may read better.
- Plural messages use only `other` (Malay nouns do not change for plurals).
- `category.form.nameKm*` — still about the optional Khmer name; categories have no Malay-name field.
- `auth.*` — login, register and forgot-password pages ("Daftar" for sign up, "Kata laluan" for password).
- `auth.*` register keys — `registerDescription`, `fullname*`, `usernameHint`, `emailOptional` ("E-mel (pilihan)"),
  `passwordHint`, the new `auth.validation.*` messages and `auth.errors.USERNAME_TAKEN` / `EMAIL_TAKEN`.

## Settings (profile + change password)

Machine-drafted — please review `settings.*`, the new `auth.validation.*` keys (`fullnameTooShort`,
`usernameMinLength`, `profileUsernameFormat`, `emailCannotClear`, `passwordMismatch`, `passwordSame`), the new
`auth.errors.*` codes (`INCORRECT_PASSWORD`, `INVALID_*`) and `errors.VALIDATION_FAILED` / `FILE_TOO_LARGE` /
`INVALID_ATTACHMENT_TYPE` / `ATTACHMENT_IN_USE`.

## Planning (real API)

Machine-drafted — please review `planning.validation.tooShort`.

## Password reset

Machine-drafted — please review `auth.reset.*`, `auth.validation.codeInvalid` and `auth.errors.INVALID_OTP`.

## Offline page (public/offline.html)

The offline page is a static file (it is shown without network, so it cannot load `messages/*.json`).
Its three strings (title, message, "Try again") are written inline in its `<script>` — please review them there.

## Help center

Machine-drafted — please review `help.*` (the public help pages: about, how to use, install, one page per module)
and `user.help`. Check that the iPhone / Android menu names in `help.topics.install.sections.*` (Tambah ke Skrin
Utama, Pasang aplikasi…) match what Malay phones show.
- `help.figures.*` — descriptions of the install pictures and the iPhone / Chrome menu labels drawn inside them.

## Calendar

Machine-drafted — please review `nav.calendar` and `calendar.*`. `calendar.lunarMonths.*` and the "Kert" / "Roach"
moon phases are romanized Khmer on purpose; `calendar.holidayNames.*` for Cambodian holidays are translated loosely.

## Budget

Machine-drafted — please review `nav.budgets`, `budget.*` and `errors.BUDGET_EXISTS`.

## Calendar — schedule

Machine-drafted — please review `calendar.scheduleCount`, `calendar.scheduleMore` and `calendar.schedule.*`.

## Currencies setting

Machine-drafted — please review `settings.tabCurrencies`, `settings.description`, `settings.currencies.*`,
`budget.spending.*` and `errors.NO_CURRENCY_ENABLED` / `errors.DEFAULT_CURRENCY_NOT_ENABLED`.

## Calendar day panel

Machine-drafted — please review `calendar.schedule.empty`, `calendar.schedule.open`, `calendar.schedule.holidays` and
`calendar.schedule.activities`.

## Currency exchange

Machine-drafted — please review `nav.exchange` and every key in `exchange.*`.
