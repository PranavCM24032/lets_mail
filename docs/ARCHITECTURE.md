# Architecture — Let's Mail

> Generated from the tree on disk. Every claim is traceable to a file. Only two of the
> nine declared navigation tabs are reachable in the running app (`src/App.tsx:336-370`).

## Stack

| Concern | Choice | Source |
| --- | --- | --- |
| UI | React 19 + TypeScript 7 | `package.json:22-23,35` |
| Build | Vite 8 + `@vitejs/plugin-react` | `vite.config.ts:1-9` |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite` (CSS-first, no config file) | `vite.config.ts:1,8`, `src/index.css:1` |
| Icons | `lucide-react` | `package.json:20` |
| Spreadsheets | SheetJS `xlsx` | `package.json:25` |
| Auth | Firebase Auth (`firebase/auth`) | `src/services/auth.ts:2-9` |
| Sending | Gmail REST API or a user Apps Script webhook | `src/services/gmail.ts:105,177` |
| Lint/typecheck | `tsc --noEmit` | `package.json:11` |

Declared but unused at runtime: `@google/genai`, `express`, `dotenv`, `motion`, `autoprefixer`
(`package.json:14-21,31`). No React Router, no state library, no test runner.

## Directory map

```
index.html                     Vite HTML shell, mounts #root
firebase-applet-config.json    Committed Firebase web config (public client keys)
firestore.rules                Intended per-UID rules — NOT used (no Firestore SDK call)
metadata.json / README.md      AI Studio applet metadata / template readme
src/
  main.tsx                     createRoot(App) — no providers, no StrictMode
  index.css                    Tailwind entry + base body styles + scrollbar
  App.tsx                      Auth lifecycle, tab switch, workspace load, bulk dispatch
  types/index.ts               Shared domain types
  services/
    auth.ts                    Firebase init, Google popup sign-in, mock organizers, token cache
    gmail.ts                   MIME build + single send + sequential bulk loop
    storage.ts                 Per-organizer localStorage store (quota/campaigns/automations)
    fileParser.ts              CSV/XLSX/XLS -> Recipient[] with column detection
    templateEngine.ts          4 default templates + {placeholder} renderer
    appsScriptGenerator.ts     Generates Google Form Apps Script code
  components/
    TopHeader.tsx              App header: 2 tabs, quota, webhook modal, auth actions
    SignInView.tsx             Signed-out page + mock-organizer sandbox
    BulkEmailView.tsx          "Upload & Bulk Email" tab: wizard + past-campaign table
    CreateCampaignWizard.tsx   3-step wizard (file -> compose -> review)
    ConfirmationModal.tsx      Dispatch confirmation dialog
    BulkSendingModal.tsx       Live-progress overlay during dispatch
    FormAutomationView.tsx     Google Form tab: triggers, template editor, generated Apps Script
```

## Layers

| Layer | Files | Responsibility | May depend on |
| --- | --- | --- | --- |
| Entry | `src/main.tsx`, `index.html` | Mount React, load CSS | — |
| Shell / state | `src/App.tsx` | Auth, active tab, workspace data, dispatch orchestration | services, UI |
| UI | `src/components/*` | Rendering, local form state, user events | types, services, other components |
| Services | `src/services/*` | Auth, persistence, parsing, rendering, sending | types, browser APIs, Firebase |
| Types | `src/types/index.ts` | Domain contracts | — |

Dependency direction is one-way: UI -> services -> types. No service imports a component.
`App.tsx` is the only place where auth side effects, storage, and the send engine are wired
together (`src/App.tsx:73-289`).

**Component graph**

```
main.tsx -> App.tsx
App.tsx -> TopHeader | SignInView (signed out) | BulkEmailView | FormAutomationView | BulkSendingModal
BulkEmailView -> CreateCampaignWizard -> ConfirmationModal
FormAutomationView -> (services only)
```

## Data flow

### 1. Boot and authentication
1. `initAuth` restores a mock organizer from `localStorage['letsmail_mock_active_user']`
   (`src/services/auth.ts:39-52`), otherwise restores the session token
   (`src/services/auth.ts:55-58`) and subscribes to `onAuthStateChanged` (`:60`).
2. `App` turns the Firebase user into `OrganizerUser`, reads
   `localStorage['letsmail_webhook_<uid>']`, and stores the access token in state
   (`src/App.tsx:74-86`).
3. When `organizer` changes, `App` builds an `OrganizerStorage` and loads today's quota,
   campaigns, and automations; it seeds a demo automation if none exist
   (`src/App.tsx:94-153`).
4. Signed-out users see `SignInView` (`src/App.tsx:292-305`). Google sign-in uses a popup
   with the single scope `gmail.send` (`src/services/auth.ts:17-23,83-117`). The access token
   is cached in memory and `sessionStorage` (`:96-98`).

### 2. Bulk campaign (the main live journey)
1. `TopHeader` switches to the `bulk-email` tab (`src/components/TopHeader.tsx:71-83`).
2. `BulkEmailView` renders `CreateCampaignWizard` (`src/components/BulkEmailView.tsx:95-102`).
3. Step 1: `parseRecipientFile` reads the first sheet with `XLSX.read`, detects the email and
   name columns, de-duplicates, and returns `Recipient[]` (`src/services/fileParser.ts:25-61,73-143`).
4. Step 2: template pills + `{name}` / `{event}` / `{participant_id}` / `{login_link}` merge tags;
   preview is `renderTemplate(...)` (`src/services/templateEngine.ts:245-282`).
5. Step 3: optional re-auth, then `onDispatchCampaign` (`src/components/CreateCampaignWizard.tsx:787-834`).
6. `App.handleStartBulkSending` resolves a token (OAuth, webhook, or simulated), opens the
   modal, and calls `executeBulkCampaignSending` (`src/App.tsx:192-261`).
7. The engine loops sequentially, renders per-recipient content, calls
   `sendEmailViaGmailApi`, polls pause/cancel, throttles 650 ms, and reports progress
   (`src/services/gmail.ts:229-386`).
8. Each send picks one of three transports: Apps Script webhook (`gmail.ts:105-146`),
   simulated mode for demo accounts (`gmail.ts:149-164`), or the Gmail REST API
   (`gmail.ts:166-224`).
9. On completion `App` records quota, writes a `Campaign`, and refreshes the list
   (`src/App.tsx:263-288`).

### 3. Google Form automation
1. `FormAutomationView` creates/edits a `GoogleFormAutomation` and saves it through
   `App` -> `OrganizerStorage.saveFormAutomation` (`src/components/FormAutomationView.tsx:140-182`,
   `src/App.tsx:357-362`, `src/services/storage.ts:103`).
2. The "Apps Script Code" tab shows `generateFormAppsScriptCode(automation)`, an
   `onFormSubmit(e)` handler with a lock, duplicate guard, participant-ID generation,
   quota check, and `GmailApp.sendEmail` (`src/services/appsScriptGenerator.ts:6-167`).
3. Copy uses `navigator.clipboard.writeText` (`src/components/FormAutomationView.tsx:210-214`).
   The app never executes the script — the organizer pastes it into their own form's script editor.

### 4. Quota
`OrganizerStorage.getTodayQuota` seeds a 500/day cap per organizer
(`src/services/storage.ts:24-47`). `recordSentEmails` increments sent/failed counts and the
current-hour bucket (`:54-63`). `App` derives `remainingAllowance` for the header and wizard
(`src/App.tsx:317`). Nothing is server-side, and the send engine does not enforce the cap.

## External integrations

| Integration | Where | Notes |
| --- | --- | --- |
| Firebase Auth | `src/services/auth.ts:10-15` | Config from `firebase-applet-config.json`; project `gen-lang-client-0425831537` |
| Google OAuth | `src/services/auth.ts:17-23` | Scope `https://www.googleapis.com/auth/gmail.send`, `prompt: select_account` |
| Gmail REST API | `src/services/gmail.ts:177` | `POST /gmail/v1/users/me/messages/send` with a base64url MIME body |
| Apps Script webhook | `src/services/gmail.ts:107` | Arbitrary user URL stored at `localStorage['letsmail_webhook_<uid>']` |
| Google Form / Sheets | `src/services/appsScriptGenerator.ts` | Only as generated code for the user to paste; no runtime call |

**Environment variables:** no `import.meta.env` / `process.env` reference exists in `src/`.
`.env.example` declares `GEMINI_API_KEY` and `APP_URL`, but neither is read by the app.
`vite.config.ts:17-19` reads build-time `DISABLE_HMR` only.

**Firestore:** `firestore.rules` describes `/organizers/{userId}/{...}` isolation, but the app
never imports `firebase/firestore`. All persistence is browser `localStorage`/`sessionStorage`.

## Conventions

- **Components:** function components with a local, non-exported `XxxProps` interface;
  named exports except `App` (`src/App.tsx:31`). Most use `React.FC`.
- **State:** `useState` + `useRef` only; no reducer/context/state library. Cross-cutting
  state lives in `App`; leaf components are prop-driven.
- **Navigation:** a single `NavigationTab` state (`src/App.tsx:38`) with `&&` branches;
  no router. Tabs other than `bulk-email` and `form-automation` have no view.
- **Persistence:** `OrganizerStorage` namespaces keys as
  `letsmail_v1_<uid>_<category>` (`src/services/storage.ts:3,19-21`). Webhook URL uses
  `letsmail_webhook_<uid>`; session token uses `letsmail_gmail_oauth_token`.
- **Styling:** Tailwind utility classes inline; design tokens are raw slate/indigo/rose values.
  `src/index.css` defines only base body styles and a scrollbar.
- **Templating:** single-brace `{variable}` placeholders, case-insensitive, with alias groups
  for `participant_id`, `event`, and `login_link` (`src/services/templateEngine.ts:248-281`).
