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

**Live graph**
```
App -> TopHeader, SignInView, BulkEmailView, FormAutomationView, BulkSendingModal
BulkEmailView -> CreateCampaignWizard -> ConfirmationModal
```

**Dead graph (zero importers):** `Navbar`, `Sidebar`, `DashboardView`, `QuotaDashboardView`,
`ConnectedAccountView`, `CampaignsView`, `ScheduledView`, `SettingsView`, `HistoryView`,
`GoogleAuthCard`, `UploadView`, `ComposerView`, `ContactsView` — 13 components, ~140 KB.

The `NavigationTab` type declares nine tabs (`src/types/index.ts:20-29`); seven (`overview`,
`campaigns`, `create-campaign`, `scheduled`, `contacts`, `activity`, `settings`) are never set.

## Critical flows

### A. Boot / auth
`App.tsx:73-91` calls `initAuth` -> mock-user restore (`auth.ts:40-53`) or
`onAuthStateChanged` (`auth.ts:61`) -> `organizer` set -> workspace load (`App.tsx:94-153`).
Google sign-in: `googleSignIn` popup (`auth.ts:84-118`) requests `gmail.send`
(`auth.ts:17-20`), caches locally + in `sessionStorage` (`auth.ts:97-99`).

### B. Bulk campaign (live)
TopHeader tab (`TopHeader.tsx:71-83`) -> `BulkEmailView.tsx:95` -> wizard step 1 parses
spreadsheet (`fileParser.ts:25-61`) -> step 2 renders templates (`templateEngine.ts:245`) ->
step 3 `onDispatchCampaign` (`CreateCampaignWizard.tsx:787-834`) ->
`App.handleStartBulkSending` (`App.tsx:192-289`) -> `executeBulkCampaignSending`
(`gmail.ts:230-387`) -> per-recipient `sendEmailViaGmailApi` (`gmail.ts:320`).
Transport order: webhook (`gmail.ts:106-147`) -> simulated (`gmail.ts:150-165`) ->
Gmail REST (`gmail.ts:167-225`). Progress drives `BulkSendingModal` via `App.tsx:251-257`.

### C. Google Form automation
`FormAutomationView` creates/saves a `GoogleFormAutomation` (`FormAutomationView.tsx:140-182`)
-> `OrganizerStorage.saveFormAutomation` (`storage.ts:108-117`) -> "Apps Script Code" renders
`generateFormAppsScriptCode` (`appsScriptGenerator.ts:6-167`) -> clipboard
(`FormAutomationView.tsx:210-214`). The generated script, not this app, sends form emails.

### D. Quota
Seeded at 500/day (`storage.ts:24-47`), incremented after a batch (`storage.ts:54-63`,
called from `App.tsx:267`), displayed as `capLimit - sentCount` (`App.tsx:317`).
Advisory only: the send engine does not stop at the cap.

## Surfaces

**Internal service API**
- `auth`: `initAuth`, `googleSignIn`, `logout`, `switchMockOrganizer`, `GMAIL_SEND_SCOPE`
  (+ unused `reauthorizeGmail`, `getAccessToken`, `setManualAccessToken`, `auth`)
- `gmail`: `sendEmailViaGmailApi`, `executeBulkCampaignSending`
- `storage`: `OrganizerStorage` — quota, campaigns, form automations (+ unused scheduled-job
  methods, `getRemainingDailyQuota`, `clearAllData`)
- `fileParser`: `parseRecipientFile`, `reprocessWithEmailColumn`, `generateSampleCsvContent`
- `templateEngine`: `DEFAULT_TEMPLATES`, `renderTemplate`
- `appsScriptGenerator`: `generateFormAppsScriptCode` (live), `generateAppsScriptSchedulerCode`
  (dead-view only), `generatePersonalDispatcherScript` (unused)

**Browser storage**
- `letsmail_v1_<uid>_quota_<YYYY-MM-DD>`, `_campaigns`, `_form_automations` (`storage.ts:3-21`)
- `letsmail_gmail_oauth_token` (sessionStorage), `letsmail_mock_active_user`,
  `letsmail_webhook_<uid>` (localStorage)

**External:** Firebase Auth; Google OAuth `gmail.send`; Gmail REST
`/gmail/v1/users/me/messages/send`; arbitrary Apps Script webhook URL.
No Firestore, no Gemini, no env vars consumed by `src/`.

## Hot spots

1. **`FormAutomationView.tsx` is a 51 KB / 1016-line god-component** with three tabs, an editor,
   a simulator, and generated-code display in one file.
2. **Dead mass is larger than the live app.** 13 of 20 components are unreferenced; dead
   `SettingsView`/`ConnectedAccountView` duplicate the Firestore rules and dispatcher script
   as string literals.
3. **Transport failure semantics diverge.** A webhook network error is reported as success
   (`gmail.ts:140-146`) and the HTTP status is never checked; the REST path does check status
   (`gmail.ts:187-211`). No 429/backoff handling.
4. **Auth state claims are inaccurate.** UI text says the token is never persisted in browser
   storage (`ConnectedAccountView.tsx:124`, `SettingsView.tsx:111`), but it is written to
   `sessionStorage` (`auth.ts:99`). Both files are dead today.
5. **Duplicated predicates/helpers:** simulated-account detection in four variants
   (`App.tsx:202-206`, `TopHeader.tsx:32-36`, `CreateCampaignWizard.tsx:87-91`,
   `gmail.ts:150-156`); CSV-log export in three copies (`BulkEmailView.tsx:44-63`,
   `CampaignsView.tsx:39-59`, `HistoryView.tsx:37-57`); dispatcher script in three copies.
6. **Firestore and Gemini are declared but not implemented**: `firestore.rules` has no caller;
   `@google/genai` and `GEMINI_API_KEY` are unused.
7. **Quota is advisory, not enforced.** `ConfirmationModal` promises pausing at the cap
   (`ConfirmationModal.tsx:89`); the engine never checks `remainingAllowance`.
8. **Demo data is injected into every new workspace** (`App.tsx:112-149`), including two fake
   student delivery rows.
9. **No tests, no error boundary, no CI config.** The only check is `tsc --noEmit`.
10. **`npm install` currently conflicts**: dev `esbuild@^0.25.0` vs Vite 8 peer
    `esbuild@^0.27||^0.28`; install requires `--legacy-peer-deps` (repo ships `bun.lock` instead).

## Extension points

- **Add a tab:** extend `NavigationTab` (`types/index.ts:20`), render it in `App.tsx:336-370`,
  add the button in `TopHeader.tsx:71-97`.
- **Add a template:** push an `EmailTemplate` to `DEFAULT_TEMPLATES`
  (`templateEngine.ts:3-234`); both wizard and (dead) composer read it.
- **Add a placeholder alias:** extend the alias branches in `renderTemplate`
  (`templateEngine.ts:269-277`).
- **Add a transport:** add a branch inside `sendEmailViaGmailApi` (`gmail.ts:92-225`) and a
  matching option on `SendEmailParams` (`gmail.ts:3-12`).
- **Switch persistence to Firestore:** implement the `OrganizerStorage` method surface
  (`storage.ts:10-161`) behind the same API; `App.tsx` is the only consumer.
- **Enforce quota:** check `getRemainingDailyQuota()` before each send in
  `executeBulkCampaignSending` (`gmail.ts:276`) and mark the rest `skipped`.

## Verification performed

- `tsc --noEmit` (the repo's `lint`) passes with zero errors before any edit.
- Install required `npm install --legacy-peer-deps --no-package-lock` due to the Vite/esbuild
  peer conflict above.
- No test suite exists to run; `vite build` was attempted after install and its result is
  reported separately.
