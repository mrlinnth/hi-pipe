# Project Constraints

Generated: 2026-05-10
Confirmed by developer: yes

---

## Project

hi-pipe is a lightweight sales pipeline web app with a kanban board interface.
It runs in two modes: **personal** (BYO Cockpit API key, offline capable) and
**team** (pre-configured API, MS Entra ID login, role-based access, offline
with manual sync). The team deployment is at `leads.bimats.net` and shares a
Cockpit CMS backend with the BIM.visitplan internal app.

---

## App Modes

Controlled by `VITE_APP_MODE` environment variable.

| Mode | Value | Auth | API Config | Offline |
|---|---|---|---|---|
| Personal | `personal` | None | User-entered, localStorage | localStorage |
| Team | `team` | MS Entra ID (PKCE) | Env vars, never shown to user | IndexedDB + manual sync |

---

## Stack & Versions

| Package / Framework | Version | Notes |
|---|---|---|
| React | 18.x | Existing, do not upgrade |
| Vite | 5.x | Existing, do not upgrade |
| TypeScript | 5.x | Added in Phase 0 |
| @azure/msal-browser | 4.x | MS Entra ID PKCE auth, team mode only |
| idb | 8.0.3 | IndexedDB wrapper, Phase 3 offline |
| xlsx (SheetJS) | 0.20.3 | Install via CDN tarball, NOT from npm registry — see note below |
| TanStack Query | existing | Keep existing version |
| DnD Kit | existing | Keep existing version |
| axios | existing | Used by BIM.visitplan cockpit.ts; adopt same pattern in hi-pipe |

**SheetJS install note:** The `xlsx` package on npm is outdated (0.18.5) and
has known vulnerabilities. Install the current version via:
```
npm install https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz
```

---

## Backend & Infrastructure

| Component | Detail |
|---|---|
| CMS | Cockpit CMS (self-hosted at `cms.bimats.com`) |
| Cockpit API base | `https://cms.bimats.com/api` |
| Cockpit space | `:hi-pipe` for deals and stages; shared collections for users, clients, sectors, financialquarters |
| Personal deployment | `pipeline.hiyan.cloud` — open, no auth |
| Team deployment | `leads.bimats.net` — Caddy basic auth as outer gate |
| Server | Single VPS, Docker Compose via Dockge, Caddy reverse proxy, nginx static |
| Build | `npm run build` on host → nginx serves `dist/` folder |

---

## Cockpit Collections

| Collection | Used by | hi-pipe access |
|---|---|---|
| `deals` | hi-pipe | read, create, update, delete |
| `stages` | hi-pipe | read only |
| `users` | hi-pipe + BIM.visitplan | read, create (find-or-create on login) |
| `clients` | hi-pipe + BIM.visitplan | read only |
| `sectors` | hi-pipe + BIM.visitplan | read only |
| `financialquarters` | hi-pipe + BIM.visitplan | read only |

hi-pipe never creates or edits clients, sectors, or financialquarters.
Those are managed via BIM.visitplan.

---

## Cockpit API Patterns

Follow the patterns in `src/lib/cockpit.ts` from BIM.visitplan exactly.

- Use an axios instance with `Api-Key` header and `Content-Type: application/json`
- Use `buildParams()` helper for filter, sort, limit, populate params
- Filter syntax: `filter[field]=value` or `filter[field._id]=value` for linked fields
- Sort syntax: `sort[field]=1` (asc) or `sort[field]=-1` (desc)
- Create and update both use `POST /content/item/{collection}` with `{ data: {...} }`
- Include `_id` in the data body to update an existing record
- Delete uses `DELETE /content/item/{collection}/{id}`
- Linked fields are sent as `{ _id: '...', _model: 'collection_name' }`
- Always pass `populate: 1` when you need linked fields resolved

---

## Auth (Team Mode)

- Provider: Microsoft Entra ID (Azure AD)
- Flow: Authorization Code + PKCE — public client, no client secret in app
- Library: `@azure/msal-browser` v4.x — NOT expo-auth-session (that is React Native)
- Login method: `loginPopup` with scopes `['openid', 'profile', 'email']`
- Email extracted from id_token claims: `preferred_username` or `email`
- Domain restriction: only `@bimgoc.com` emails are allowed
- After MS login: find-or-create record in Cockpit `users` collection by `ms_email`
- New users created with `role: 'am'`, `approval_status: 'pending'`, `active: false`
- Users with `approval_status: pending/rejected` or `active: false` are blocked
- Session stored in localStorage under key `hi_pipe_auth` as `AuthState`
- Azure app registration: Single-page application platform, redirect URI `https://leads.bimats.net`

---

## User Roles

Roles come from the `users.role` field in Cockpit.

| Role | Access |
|---|---|
| `management`, `admin` | See all deals (read); edit/delete own deals only |
| `am`, `sales`, `solution` | See own deals only; full edit/delete on own deals |

**canEdit rule:** `currentUser._id === deal.owner._id` — applies in team mode only.
In personal mode, all deals are always editable.

---

## Data Sync Strategy

| Collection | Sync trigger |
|---|---|
| `deals` | Every app load (when online) |
| `clients` | Every app load (when online) |
| `stages` | Once per day or manual sync |
| `sectors` | Once per day or manual sync |
| `financialquarters` | Once per day or manual sync |

- Offline local store: IndexedDB via `idb`, database name `hi_pipe_db`
- Sync queue: `sync_queue` object store in IndexedDB, processes in order
- Mutations while offline: written to IndexedDB immediately (optimistic) + enqueued
- Manual sync: user-triggered; processes queue then refreshes deals and clients
- Last sync timestamp: stored in localStorage as `hi_pipe_last_sync`
- Conflict strategy: none needed — each deal has one owner, no shared editing

---

## Deal Schema (Cockpit)

Existing fields: `name`, `value`, `stage`, `period`, `sector`, `notes`, `tags`, `sort_order`

Fields to add:
- `owner` — linked to `users` collection (`{ _id, _model: 'users' }`)
- `client` — linked to `clients` collection (`{ _id, _model: 'clients' }`)

`period` stays as a plain string (e.g. `"Q1 FY2026"`) populated from
`financialquarters.name` — it is not a linked field.

---

## TypeScript Standards

- Strict mode: yes (`"strict": true` in tsconfig)
- `any`: avoid — use `unknown` and narrow, or proper types
- Explicit return types: on exported functions only; inferred elsewhere is fine
- All Cockpit entity types defined in `src/types.ts`
- Reuse types from BIM.visitplan where they match (CockpitUser, CockpitClient,
  CockpitSector, CockpitFinancialQuarter are already correct)
- Component props: define a `Props` type above each component
- React event types: use `React.ChangeEvent<HTMLInputElement>`, `React.MouseEvent<HTMLButtonElement>` etc.

---

## Coding Conventions

- **Styling:** Plain CSS only. CSS custom properties for theming. No Tailwind, no CSS-in-JS, no new CSS frameworks.
- **Fonts:** DM Sans + DM Mono (industrial/utilitarian aesthetic — preserve this)
- **Components:** Functional components only. No class components.
- **State:** React state and context. No Zustand, no Redux.
- **Data fetching:** TanStack Query for server state. Custom hooks wrapping query logic.
- **File structure:** Follow existing `src/components`, `src/hooks`, `src/lib`, `src/context` layout
- **Abstractions:** Only when there is clear reuse or complexity justification. No speculative abstraction.
- **Naming:** camelCase for functions and variables, PascalCase for components and types
- **No new dependencies** without a clear justification and listing in this file

---

## Explicit Exclusions

- No SSR / TanStack Start — pure SPA only
- No Zustand or any global state library
- No CSS frameworks (Tailwind, Bootstrap, etc.)
- No expo-auth-session — that is React Native only
- No `xlsx` from the npm registry — use SheetJS CDN tarball
- No Cockpit Identi module — MS auth is handled in the frontend via msal-browser
- No backend proxy layer — Cockpit API called directly from frontend
- No row-level security enforcement — owner filtering is UI-level only (accepted tradeoff for internal tool)
- No auto background sync — manual sync only

---

## Environment Variables

```
# Both modes
VITE_APP_MODE=personal|team

# Team mode only
VITE_ENTRA_CLIENT_ID=
VITE_ENTRA_TENANT_ID=
VITE_ALLOWED_DOMAIN=bimgoc.com
VITE_COCKPIT_API_URL=
VITE_COCKPIT_API_KEY=
```

In personal mode, API URL and token are entered by the user and stored in localStorage.
In team mode, they come from env vars and are never shown to the user.

---

## Implementation Phases

| Phase | Scope |
|---|---|
| 0 | TypeScript migration (mechanical rename, tsconfig, fix type errors) |
| 1 | MS auth, domain restriction, find-or-create user, AuthContext, LoginScreen |
| 2 | Deal enhancements (owner, client fields), live reference data, role-based access |
| 3 | Offline support, IndexedDB cache, sync queue, manual sync UI, service worker |
| 4 | CSV/Excel export of filtered deals |

Each phase is implemented and verified before starting the next.

---

## Handoff Instruction for Implementation Agent

Read this file before starting any task.
Apply every constraint to every file you create or modify.
If a task requires deviating from any constraint, stop and ask before proceeding.
Do not assume any version, pattern, or convention not listed here.
Match the existing plain CSS style and component structure exactly.
Reference `src/lib/cockpit.ts` from BIM.visitplan for all Cockpit API patterns.
