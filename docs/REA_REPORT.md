# REA Report: Let's Mail

## Verdict

A browser-only React SPA that sends personalized bulk email for college events either through
the Gmail REST API (OAuth) or through a user-supplied Google Apps Script webhook, while also
generating Apps Script code to wire Google Form submissions to email. There is no backend in
this repo: auth is Firebase Auth, and all workspace data lives in `localStorage`.

## Stack

- React 19.0.1, TypeScript 7.0.2, Vite 8.3.0 (`package.json`)
- Tailwind CSS v4 through `@tailwindcss/vite` (`vite.config.ts:1-9`, `src/index.css:1`)
- Firebase JS SDK 13.1.0 — **Auth only** (`src/services/auth.ts:1-9`)
- SheetJS `xlsx` 0.18.5 for CSV/XLSX/XLS parsing (`src/services/fileParser.ts:1`)
- `lucide-react` icons; no router, no test runner, no formatter
- Unused deps: `@google/genai`, `express`, `dotenv`, `motion`, `autoprefixer`

## Entry points

| Entry | Purpose |
| --- | --- |
| `index.html:15` | Loads `/src/main.tsx` into `#root` |
| `src/main.tsx:5` | `createRoot(...).render(<App />)` — no providers |
| `src/App.tsx:31` | Root component; auth gate, tab switch, workspace bootstrap, dispatch |
| `src/App.tsx:292` | Signed-out branch -> `SignInView` |
| `src/App.tsx:336,353` | The only two reachable views: `bulk-email`, `form-automation` |

No server bootstrap, CLI, or API route exists in the repo despite `express` being listed.

## Architecture

Layers: entry (`main.tsx`) -> shell/state (`App.tsx`) -> UI (`src/components`) -> services
(`src/services`) -> types (`src/types`). Services never import components.

```
App -> TopHeader, SignInView, BulkEmailView, FormAutomationView, BulkSendingModal
BulkEmailView -> CreateCampaignWizard -> ConfirmationModal
FormAutomationView -> (services only)
```

The `NavigationTab` type declares nine tabs (`src/types/index.ts:20-29`); only `bulk-email`
and `form-automation` have a view. The other seven (`overview`, `campaigns`,
`create-campaign`, `scheduled`, `contacts`, `activity`, `settings`) are unreachable.

Thirteen previously unreferenced legacy components (dashboard, sidebar, history, settings,
scheduled, contacts, upload, composer, etc.) were pruned; see the baseline commit
`87d5835` to recover them.

## Critical flows

### A. Boot / auth
`App.tsx:73-91` calls `initAuth` -> `onAuthStateChanged` (`auth.ts:60`) ->
`organizer` set -> workspace load (`App.tsx:94-113`).
Google sign-in: `googleSignIn` popup (`auth.ts:83-117`) requests `gmail.send`
(`auth.ts:17-20`), caches locally + in `sessionStorage` (`auth.ts:96-98`).

### B. Bulk campaign (live)
TopHeader tab (`TopHeader.tsx:71-83`) -> `BulkEmailView.tsx:91` -> wizard step 1 parses
spreadsheet (`fileParser.ts:25-61`) -> step 2 renders templates
(`templateEngine.ts:245`) -> step 3 `onDispatchCampaign` (`CreateCampaignWizard.tsx:819`) ->
`App.handleStartBulkSending` (`App.tsx:192-289`) -> `executeBulkCampaignSending`
(`gmail.ts:229-386`) -> per-recipient `sendEmailViaGmailApi` (`gmail.ts:319`).
Transport order: webhook (`gmail.ts:105-146`) -> Gmail REST (`gmail.ts:166-224`).
Progress drives `BulkSendingModal` via `App.tsx:251-257`.

### C. Google Form automation
`FormAutomationView` creates/saves a `GoogleFormAutomation` (`FormAutomationView.tsx:140-182`)
-> `OrganizerStorage.saveFormAutomation` (`storage.ts:103`) -> "Apps Script Code" renders
`generateFormAppsScriptCode` (`appsScriptGenerator.ts:6`) -> clipboard
(`FormAutomationView.tsx:210-214`). The generated script, not this app, sends form emails.

### D. Quota
Initialized at 500/day (`storage.ts:24-47`), incremented after a batch (`storage.ts:54-63`,
called from `App.tsx:267`), displayed as `capLimit - sentCount` (`App.tsx:317`).
Advisory only: the send engine does not stop at the cap.

## Surfaces

**Internal service API**
- `auth`: `initAuth`, `googleSignIn`, `logout` (+ `auth` instance, `GMAIL_SEND_SCOPE`)
- `gmail`: `sendEmailViaGmailApi`, `executeBulkCampaignSending`
- `storage`: `OrganizerStorage` — quota, campaigns, form automations
- `fileParser`: `parseRecipientFile`, `reprocessWithEmailColumn`, `generateSampleCsvContent`
  (plus internal `isValidEmail`)
- `templateEngine`: `DEFAULT_TEMPLATES`, `renderTemplate`
- `appsScriptGenerator`: `generateFormAppsScriptCode`

**Browser storage**
- `letsmail_v1_<uid>_quota_<YYYY-MM-DD>`, `_campaigns`, `_form_automations` (`storage.ts:3-21`)
- `letsmail_gmail_oauth_token` (sessionStorage), `letsmail_webhook_<uid>` (localStorage)

**External:** Firebase Auth; Google OAuth `gmail.send`; Gmail REST
`/gmail/v1/users/me/messages/send`; arbitrary Apps Script webhook URL.
No Firestore, no Gemini, no env vars consumed by `src/`.

**Types:** `OrganizerUser`, `Recipient`, `NavigationTab`, `CampaignStatus`,
`RecipientDeliveryLog`, `Campaign` (`types/index.ts:43`), `GoogleFormAutomation` (`:61`),
`DailyQuotaUsage` (`:86`), `EmailTemplate` (`:97`).

## Hot spots

1. **`FormAutomationView.tsx` is a 51 KB / 1016-line god-component** with three tabs, an editor,
   and generated-code display in one file.
2. **Transport failure semantics diverge.** A webhook network error is reported as success
   (`gmail.ts:139-145`) and the HTTP status is never checked; the REST path does check status
   (`gmail.ts:186-210`). No 429/backoff handling.
3. **No server-side workspace state.** Campaigns, automations, and quota live only in browser
   `localStorage`, so data is not shared across devices or organizers.
4. **Firestore and Gemini are declared but not implemented**: `firestore.rules` has no caller;
   `@google/genai` and `GEMINI_API_KEY` are unused.
5. **Quota is advisory, not enforced.** `ConfirmationModal` promises pausing at the cap
   (`ConfirmationModal.tsx:89`); the engine never checks the remaining allowance.
6. **Real email delivery depends on a short-lived Gmail token or a user-supplied Apps Script
   webhook**; there is no backend token refresh or delivery retry.
7. **Dead transport path:** the `generateAppsScriptSchedulerCode` and personal-dispatcher
   generators were unused and have been removed; scheduling is consequently unimplemented.
8. **No tests, no error boundary, no CI config.** The only check is `tsc --noEmit`.
9. **`npm install` currently conflicts**: dev `esbuild@^0.25.0` vs Vite 8 peer
   `esbuild@^0.27||^0.28`; install requires `--legacy-peer-deps` (repo ships `bun.lock` instead).
10. **Bundled output is a single ~780 KB chunk** (Vite warns > 500 KB); no code splitting.

## Extension points

- **Add a tab:** extend `NavigationTab` (`types/index.ts:20`), render it in `App.tsx:336-370`,
  add the button in `TopHeader.tsx:71-97`.
- **Add a template:** push an `EmailTemplate` to `DEFAULT_TEMPLATES`
  (`templateEngine.ts:3-234`); the wizard is the only consumer.
- **Add a placeholder alias:** extend the alias branches in `renderTemplate`
  (`templateEngine.ts:269-277`).
- **Add a transport:** add a branch inside `sendEmailViaGmailApi` (`gmail.ts:91-224`) and a
  matching option on `SendEmailParams` (`gmail.ts:3-12`).
- **Switch persistence to Firestore:** reimplement the `OrganizerStorage` surface
  (`storage.ts:10-118`) behind the same API; `App.tsx` is the only consumer.
- **Enforce quota:** check the remaining quota before each send in
  `executeBulkCampaignSending` (`gmail.ts:275`) and mark the rest `skipped`.

## Verification performed

- Baseline committed first (`87d5835`), so the prune is fully reversible.
- `tsc --noEmit` (the repo's `lint`) passes with zero errors after the prune.
- `vite build` succeeds; CSS dropped 54.59 kB -> 36.22 kB after dead components were removed.
- Stale-reference grep for every deleted component and symbol returns no hits (only the
  unrelated `MailApp.getRemainingDailyQuota()` inside generated Apps Script strings).
- No test suite exists to run; the live flows were verified statically and by build, not in a browser.
