# PranaDin app contracts
Owner: Developer 1 · 2026-11-17. For Developer 2, Content and Design. If code and this file disagree, the code wins and this file gets fixed. Content's format is defined in `content/SCHEMA.md` (`pranadin-content/1.0`); this file only records how the code uses it.

## Ownership
| Path | Owner |
|---|---|
| `src/lib/**`, `src/i18n/**`, `src/content/**`, `src/components/**`, `src/app/**` (shell, Today, Calendar, info pages), `scripts/**`, `legal/**` (generated), config, CI | Dev-1 |
| `src/features/**` (practice, journal, onboarding, settings, reminder, analytics, shared), `src/app/[locale]/(tabs)/practice/**`, journal and onboarding pages | Dev-2 |
| `content/**` | Content (Dev never edits; read only) |
| `src/styles/tokens.css`, `tailwind-theme.css`, `brand/` | copies of `13_Design/` (Design owns the source) |

**Unassigned:** the 3-step plan generator (FR-3.2) on Today. `TodayView` leaves a slot below the panchang card. Proposal: Dev-2 builds it in `src/features/plan/` and exports a `<TodayPlan/>` client component that Dev-1 places.

## Routes (`src/lib/routes.ts`)
All URLs have a trailing slash. `routes.today(l)`, `.practice(l)`, `.calendar(l)`, `.journal(l)`, `.onboarding(l)`, `.settings(l)`, `.trust(l, page)` → `/<l>/info/<page>/`. `/` picks a language. Tabs: `TABS`. Trust pages: `TRUST_PAGES` = about, privacy, terms, disclaimer, help, sources, ai-use, corrections.

## Types (`src/lib/types.ts`)
`Locale`, `LocalDateKey` (`YYYY-MM-DD` in the city's zone), `Prefs` (v1), `JournalEntry` (v1, max 1,000 chars), `PracticeLog` (v1, completed at ≥ 80 %), `PanchangDay` (always `indicative: true`), `GOALS`, `PLAN_MINUTES`, `TIME_SLOTS`, `MOODS`, `PRACTICE_KINDS`. Change a stored shape only with a new `v` and a migration in `src/lib/storage/repos.ts`.

## Storage (`src/lib/storage`)
`getStorage(): Promise<AppStorage>` gives `journal` and `practice` as `Repo<T>` (`list({from,to,limit,order})`, `get`, `put`, `delete`, `clear`, `count`). IndexedDB first, then localStorage, then memory (`backend` says which). `getPrefs()` is synchronous (`read()`, `write(patch)`, `reset()`, `persistent`). Also `clearAllData()`, `serializeJournal(entries, "json"|"txt")`, `requestPersistence()`, `newId()`. All keys start `pranadin.`. Client-only.

## i18n (`src/i18n`)
- Client: `const { t, locale } = useI18n(); t("today.panchang.tithi", { tithi })`. Keys are typed from `content/en/ui.json`, so a missing key fails `tsc`.
- Formatter: `formatMessage(template, params, locale)` in `src/i18n/format.ts` (ICU subset: `{x}`, `plural` with `#`/`=N`, `select`). **Dev-2:** `src/features/shared/format-message.ts` duplicates this; please switch to the shared one when convenient.
- Dates: `localDateKey(ms, tz)`, `formatDateKey`, `formatTime`, `addDays`, `weekday`. Default zone `Asia/Kolkata`; digits are Latin in all locales.
- Fallback: HI/MR text is used only when the item says `reviewed: true`; otherwise English for that key. `FallbackNote` tells the user.

## Content loaders (`src/content/load.ts`, server/build only)
`loadMessages(locale)`, `loadObservances(locale)` (hides `hold`; maps flags to `cal.flag.*` keys), `loadTrustPage(locale, file)`. Dev-2's `src/features/shared/content.server.ts` loads practices, plan cards and journal text. zod schemas in `src/content/schema.ts` fail the build on invalid content.

**Differences from SCHEMA.md / how gaps are handled:**
1. `privacy`, `terms` and `help` come from **Legal's finals** (`20_Legal_Compliance/final/`), copied to `legal/en/` by `node scripts/sync-legal.mjs` (strips Legal's internal header; `help` = section B of the Health & Content Disclaimer). The loader checks `content/<lang>/pages/` first, then `legal/<lang>/`. English only, as the notices say English prevails.
2. `{{feedbackLink}}`: `FEEDBACK_LINK` in `load.ts` is `null` until the PMO supplies it (D-022), so those links render as plain text. Legal's ⟦contact email⟧ fill-ins stay visible.
3. **Observance notes (D-008):** HI/MR `observances.json` is validated by `observancesTranslationSchema`: only `name` is required. A missing or blank `note`, or `noteLang: "en"`, shows the English note for that item, never a build error. `Observance` has `lang` (name) and `noteLang` (note); render each with its own `lang` attribute. Content can drop the duplicated English notes.
4. `TRADITIONS` in `types.ts` predates Content's list; observances use `OBSERVANCE_TRADITIONS` from `schema.ts` (includes `jewish`).

## Observances and panchang
- `src/lib/observances.ts`: `observancesOn(items, date)`, `upcoming(items, today, 7)`, `inWindow(window, date)`.
- `src/lib/panchang`: `panchangForDay(date, cityOrId)` → `PanchangDay` (tithi and nakshatra at local sunrise, with end times; amanta masa with Adhik). Memoised, < 30 ms. Names via `tithiKey`, `nakshatraKey`, `masaKey` in `src/i18n/keys.ts`. No festival rules are computed; festivals come only from `content/data/observances.json`.
- Cities: `src/lib/cities.ts`, default `new-delhi`.

## Security constraints for all code
No third-party scripts, fonts or fetches (CSP `connect-src 'self'`); no inline event handlers (the build fails). Analytics needs its origin added to the CSP after Legal approval (`docs/security.md`).

## Requests
- **Content:** a `me.terms` UI key (Dev-2's Settings uses `trust.*` keys); golden panchang cases in `tests/golden/panchang-reference.json` (PR-9); glossary keys for Adhik masa.
- **Dev-2:** at 17 Nov 00:30, `npm run lint` fails only in `src/features/**` (React Compiler rules `set-state-in-effect` and `refs` in BreathPlayer, StillnessTimer, SessionComplete, ReminderPanel). `tsc`, tests and build pass. CI will be red until those are fixed. Dev-1 has not edited them.
- **Build note:** `scripts/flatten-rsc.mjs` runs after `next build` so link prefetches don't 404 on static hosting (Next 16 writes nested segment files but requests dot-joined names).
