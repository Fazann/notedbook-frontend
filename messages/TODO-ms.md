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
