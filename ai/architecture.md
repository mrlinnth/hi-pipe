# Architecture — Hi Pipe

## Component Tree

```
App.jsx
├── FilterBar          — period / sector / tag filter pills
├── TotalsBar          — aggregate deal count and total value
├── Board              — DndContext wrapper, renders columns
│   └── Column[]       — one per stage (useDroppable)
│       └── DealCard[] — one per deal (useDraggable)
├── DealModal          — create / edit / delete deal (conditional)
├── StageSettings      — manage stages modal (conditional)
└── ConnectionSettings — API URL + key config modal (conditional)
```

All modal components are mounted conditionally from `App.jsx` based on boolean state flags.

## Data Flow

```
Cockpit CMS API
      │
      ▼
src/api/cockpit.js        ← pure fetch functions, no state
      │
      ▼
src/hooks/useDeals.js     ← deals[], loading, error, isOnline, CRUD actions
src/hooks/useStages.js    ← stages[], loading, error, isOnline, CRUD actions
      │
      ▼
App.jsx                   ← combines hook output with filter/modal state
      │
      ├── filteredDeals   ← derived from deals[] + activeFilters
      ├── availableTags   ← derived from all deals' tags
      └── props/callbacks → child components
```

## State in App.jsx

| State | Type | Purpose |
|-------|------|---------|
| `deals` | array | From `useDeals` — full unfiltered deal list |
| `stages` | array | From `useStages` — ordered stage list |
| `activeFilters` | `{ period, sector, tag }` | Current filter selections (nullable) |
| `selectedDeal` | deal object or null | Deal open in edit modal |
| `isAddModalOpen` | boolean | New deal modal open |
| `isSettingsOpen` | boolean | Stage settings modal open |
| `isConnectionOpen` | boolean | Connection settings modal open |

Derived state (computed inline, not stored):
- `filteredDeals` — `deals` filtered by `activeFilters`
- `availableTags` — unique sorted tags across all deals
- `dealCounts` — map of `stage.slug → count` for column headers

## Custom Hooks

### `useDeals` (`src/hooks/useDeals.js`)

Returns:
```js
{
  deals,    // Deal[]
  loading,  // boolean
  error,    // Error | null
  isOnline, // boolean — true if last API call succeeded
  reload,   // () => Promise<void>
  addDeal,  // (data) => Promise<void>
  editDeal, // (id, data) => Promise<void>
  removeDeal, // (id) => Promise<void>
  moveDeal,   // (id, newStageSlug) => Promise<void>
}
```

Offline behaviour: if API is not configured or call fails, falls back to localStorage cache via `src/storage.js`.

### `useStages` (`src/hooks/useStages.js`)

Returns:
```js
{
  stages,      // Stage[] — sorted by sort_order
  loading,     // boolean
  error,       // Error | null
  isOnline,    // boolean
  reload,      // () => Promise<void>
  addStage,    // (data) => Promise<void>
  editStage,   // (id, data) => Promise<void>
  removeStage, // (id) => Promise<void>
}
```

## Storage Layer (`src/storage.js`)

Handles three concerns:

1. **API config** — `getApiConfig()`, `saveApiConfig()`, `clearApiConfig()`, `isApiConfigured()`  
   Reads from localStorage first, falls back to `VITE_COCKPIT_*` env vars.

2. **Cache** — `getCachedDeals()`, `setCachedDeals()`, `getCachedStages()`, `setCachedStages()`  
   JSON-serialised in localStorage under keys `hipipe_deals` / `hipipe_stages`.

3. **Local CRUD** — `localCreateDeal/Stage`, `localUpdateDeal/Stage`, `localDeleteDeal/Stage`  
   Used by hooks when offline. IDs are `local_<uuid>`.

Default stages (used when no cache exists):
- Lead, Qualified, Proposal, Closed Won

## API Client (`src/api/cockpit.js`)

Pure async functions — no state, no side effects beyond the fetch.

Cockpit quirks handled here:
- `GET /content/items/*` returns either an array or `{ items: [...] }` — normalised by `getItems()`
- Create and update both use `POST /content/item/*` — update includes `_id` in the body

## Drag and Drop

Uses **@dnd-kit** (`@dnd-kit/core`, `@dnd-kit/sortable`).

Flow:
1. `Board` wraps everything in `<DndContext>` with `onDragStart` / `onDragEnd` handlers
2. Each `Column` is a `useDroppable` with `id = stage.slug`
3. Each `DealCard` is a `useDraggable` with `id = deal._id`
4. On `onDragEnd`: if the drop target stage differs from the deal's current stage, `moveDeal(dealId, newStageSlug)` is called

## URL State

Filters sync to query params via `window.history.replaceState` (no router):
- `?period=Q2&sector=Banking&tag=enterprise`
- Parsed on mount from `window.location.search`
- Cleared from URL when filter is deactivated

## CSS Variables (`:root`)

| Variable | Value | Usage |
|----------|-------|-------|
| `--bg` | `#F4F4F0` | Page background |
| `--surface` | `#FFFFFF` | Cards, modals, header |
| `--border` | `#E0DED8` | Borders, dividers |
| `--text-primary` | `#1A1A18` | Main text |
| `--text-secondary` | `#6B6B65` | Secondary text |
| `--text-muted` | `#9E9E98` | Placeholder, hints |
| `--brand` | `#2d3a50` | Brand navy (used for "Hi" in logo) |
| `--accent` | `#2d3a50` | Primary buttons, active states |
| `--radius` | `6px` | Default border radius |
| `--shadow` | `0 1px 3px ...` | Subtle elevation |
| `--shadow-lg` | `0 4px 12px ...` | Modal / FAB elevation |

Fonts: **DM Sans** (body) and **DM Mono** (mono) loaded from Google Fonts.

## Data Models

### Deal
```js
{
  _id: string,         // Cockpit ID or local_<uuid>
  name: string,        // Deal name (required)
  value: number,       // Deal value in USD (required)
  stage: string,       // Stage slug (e.g. "lead")
  period: string,      // "Q1" | "Q2" | "Q3" | "Q4"
  sector: string,      // From SECTORS constant
  notes: string,       // Free text
  tags: string,        // Comma-separated string (e.g. "enterprise,renewal")
}
```

### Stage
```js
{
  _id: string,         // Cockpit ID or local_<uuid>
  name: string,        // Display name (e.g. "Closed Won")
  slug: string,        // URL-safe identifier (e.g. "closed-won")
  color: string,       // Hex color for column header
  sort_order: number,  // Display order (ascending)
}
```

## Constants (`src/constants/options.js`)

```js
PERIODS = ['Q1', 'Q2', 'Q3', 'Q4']

SECTORS = [
  'Banking',
  'Insurance / Healthcare',
  'Microfinance / Edu / Hotel',
  'Manufacture / Retail',
  'Telecom / Infra / Media',
]
```

These are hardcoded. To make them configurable, they would need to be stored in Cockpit and fetched like stages.
