# Malay translations to review

All strings in `ms.json` were machine-drafted when Bahasa Melayu was added and need a native speaker to review
wording and tone. Pay special attention to:

- `dashboard.greeting.*` — "Selamat petang" is used for evening; some prefer "Selamat malam" after dark.
- `nav.boards` — "Papan" (kanban boards); "Papan tugasan" may read better.
- Plural messages use only `other` (Malay nouns do not change for plurals).
- `category.form.nameKm*` — still about the optional Khmer name; categories have no Malay-name field.
- `errors.mock_error` — "mod olok-olok" for mock mode.
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

## Dashboard (real API)

Machine-drafted — please review `dashboard.tasks.comingSoon`.

## Password reset

Machine-drafted — please review `auth.reset.*`, `auth.validation.codeInvalid` and `auth.errors.INVALID_OTP`.
