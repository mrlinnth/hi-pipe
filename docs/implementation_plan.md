# hi-pipe — Implementation Plan

Target model: GLM-4.6 (treat every instruction as if written for a careful junior developer)

---

## What We Are Building

A sales pipeline web app called **hi-pipe**. It is a kanban board where each column is a deal stage (Lead, Progress, Won, Lost, Pause). You can drag deal cards between columns, filter by period/sector/tag, and see total USD values update in real time. All data lives in a Cockpit CMS instance. There is no login screen — Caddy handles authentication at the server level.

---

## Folder Structure

Create this folder structure before writing any code.

```
hi-pipe/
├── docker-compose.yml
├── .env.example
├── nginx.conf
└── src/
    ├── index.html
    ├── main.jsx
    ├── App.jsx
    ├── api/
    │   └── cockpit.js
    ├── components/
    │   ├── Board.jsx
    │   ├── Column.jsx
    │   ├── DealCard.jsx
    │   ├── DealModal.jsx
    │   ├── FilterBar.jsx
    │   ├── TotalsBar.jsx
    │   └── StageSettings.jsx
    ├── hooks/
    │   ├── useDeals.js
    │   └── useStages.js
    ├── constants/
    │   └── options.js
    └── styles/
        └── index.css
```

---

## Step 1 — Project Setup

### 1.1 Initialize the Vite + React project

Run these commands in your terminal inside the `hi-pipe/` folder:

```bash
npm create vite@latest . -- --template react
npm install
```

### 1.2 Install dependencies

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

- `@dnd-kit/core` — drag and drop engine
- `@dnd-kit/sortable` — makes cards sortable within and across columns

No CSS framework. We will write plain CSS using CSS variables for theming. This keeps the bundle small and the styles predictable.

### 1.3 Create the .env.example file

```
VITE_COCKPIT_API_URL=https://cms.hiyan.xyz/:hi-pipe/api
VITE_COCKPIT_API_KEY=your_api_key_here
```

Copy this to `.env` and fill in the real API key before running the app.

```bash
cp .env.example .env
```

---

## Step 2 — Constants

### 2.1 src/constants/options.js

This file holds the hardcoded values for periods and sectors. If these need to be configurable in the future, this is the only file you need to change.

```js
export const PERIODS = ['Q1', 'Q2', 'Q3', 'Q4'];

export const SECTORS = [
  'Banking',
  'Insurance / Healthcare',
  'Microfinance / Edu / Hotel',
  'Manufacture / Retail',
  'Telecom / Infra / Media',
];
```

---

## Step 3 — Cockpit API Layer

### 3.1 src/api/cockpit.js

This file is the only place in the app that talks to Cockpit CMS. Every API call goes through here. No other file should use `fetch` directly.

The Cockpit API key is read from the environment variable `VITE_COCKPIT_API_KEY`. In Vite, environment variables prefixed with `VITE_` are available in the browser via `import.meta.env`.

**Base setup:**

```js
const BASE_URL = import.meta.env.VITE_COCKPIT_API_URL;
const API_KEY = import.meta.env.VITE_COCKPIT_API_KEY;

const headers = {
  'Content-Type': 'application/json',
  'api-key': API_KEY,
};
```

**Functions to implement:**

```
fetchDeals()         GET  /content/items/deals
createDeal(data)     POST /content/item/deals
updateDeal(id, data) PUT  /content/item/deals/:id
deleteDeal(id)       DEL  /content/item/deals/:id

fetchStages()        GET  /content/items/stages?sort=sort_order:1
createStage(data)    POST /content/item/stages
updateStage(id,data) PUT  /content/item/stages/:id
deleteStage(id)      DEL  /content/item/stages/:id
```

Each function should:
1. Call `fetch` with the correct URL, method, and headers
2. Check `response.ok` — if false, throw an error with the status code
3. Return `response.json()`

**Example pattern for one function (write all others the same way):**

```js
export async function fetchDeals() {
  const res = await fetch(`${BASE_URL}/content/items/deals`, { headers });
  if (!res.ok) throw new Error(`Failed to fetch deals: ${res.status}`);
  return res.json();
}
```

For `createDeal` and `updateDeal`, pass `data` as `JSON.stringify(data)` in the request body.

**Important:** Cockpit returns items inside an object shaped like `{ items: [...], total: N }`. When you call `fetchDeals()`, the actual array is at `result.items`, not at the root. Always destructure accordingly.

---

## Step 4 — Custom Hooks

Hooks keep the data-fetching logic separate from the UI components. Components should not call the API directly — they use hooks instead.

### 4.1 src/hooks/useStages.js

This hook manages the stages collection.

State it should hold:
- `stages` — array of stage objects from Cockpit
- `loading` — boolean, true while fetching
- `error` — null or error message string

Functions it should expose:
- `reload()` — re-fetch stages from the API
- `addStage(data)` — call `createStage`, then reload
- `editStage(id, data)` — call `updateStage`, then reload
- `removeStage(id)` — call `deleteStage`, then reload

On mount, fetch stages automatically using `useEffect`.

Sort stages by `sort_order` (ascending) after fetching.

### 4.2 src/hooks/useDeals.js

This hook manages the deals collection.

State it should hold:
- `deals` — array of deal objects from Cockpit
- `loading` — boolean
- `error` — null or error message string

Functions it should expose:
- `reload()` — re-fetch deals
- `addDeal(data)` — call `createDeal`, then reload
- `editDeal(id, data)` — call `updateDeal`, then reload
- `removeDeal(id)` — call `deleteDeal`, then reload
- `moveDeal(id, newStageSlug)` — call `updateDeal` with only `{ stage: newStageSlug }`, then reload

On mount, fetch deals automatically using `useEffect`.

---

## Step 5 — Global State and Filtering Logic

### 5.1 src/App.jsx

`App.jsx` is the top-level component. It owns:

- The `useDeals` and `useStages` hooks
- The active filter state: `{ period: null, sector: null, tag: null }`
- URL sync for filters (read from and write to `window.location.search` using `URLSearchParams`)
- The computed `filteredDeals` array (derived from `deals` + active filters)
- The `isSettingsOpen` boolean for showing the StageSettings modal

**Filter logic:**

`filteredDeals` is computed every render (no need for `useMemo` initially — keep it simple):

```
filteredDeals = deals
  .filter(d => !activePeriod   || d.period === activePeriod)
  .filter(d => !activeSector   || d.sector === activeSector)
  .filter(d => !activeTag      || d.tags includes activeTag)
```

Tags are stored as a comma-separated string in Cockpit. Split on comma and trim before checking.

**URL sync:**

On filter change, write the new filter values into the URL:
```
?period=Q2&sector=Banking
```

On page load, read the URL to restore the filter state. This is done once inside a `useEffect` with an empty dependency array.

**What App renders:**

```
<FilterBar />
<TotalsBar />
<Board />
<DealModal />       (conditionally, when a deal is selected)
<StageSettings />   (conditionally, when settings is open)
```

---

## Step 6 — Components

### 6.1 src/components/FilterBar.jsx

Props:
- `activePeriod`, `activeSector`, `activeTag`
- `onPeriodChange`, `onSectorChange`, `onTagChange`
- `availableTags` — array of unique tags derived from all deals

Renders three groups of pill/chip buttons:
- Period pills: All, Q1, Q2, Q3, Q4
- Sector pills: All + each sector from `SECTORS` constant
- Tag pills: All + each tag in `availableTags`

Active filter is visually highlighted. Clicking an already-active filter deactivates it (sets it back to null).

`availableTags` is computed in `App.jsx` by collecting all tags across all deals, splitting on comma, trimming, deduplicating, and sorting alphabetically.

### 6.2 src/components/TotalsBar.jsx

Props:
- `deals` — the already-filtered deals array

Renders:
- Total deal count: `{deals.length} deals`
- Total USD value: sum of `deal.value` across all deals, formatted as `$X,XXX`

Use `Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })` for formatting.

### 6.3 src/components/Board.jsx

Props:
- `stages` — array of stage objects
- `deals` — filtered deals array
- `onDealClick(deal)` — called when a card is clicked
- `onMoveDeal(dealId, newStageSlug)` — called when a card is dropped into a new column

This component sets up the DnD Kit drag-and-drop context.

Use `DndContext` from `@dnd-kit/core` wrapping all columns.

On `onDragEnd` event:
1. Get the `active.id` (deal id) and `over.id` (target column slug)
2. Find the deal in the deals array
3. If `deal.stage !== over.id`, call `onMoveDeal(deal._id, over.id)`

Renders one `<Column />` per stage, passing the deals that belong to that stage.

### 6.4 src/components/Column.jsx

Props:
- `stage` — stage object `{ name, slug, color, sort_order }`
- `deals` — deals filtered to this stage only
- `onDealClick(deal)`

This component is a DnD Kit `useDroppable` zone. Its `id` is the stage slug.

Column header shows:
- Stage name (text colored white, on a background using `stage.color`)
- Deal count badge
- Total USD value of deals in this column

Renders one `<DealCard />` per deal.

### 6.5 src/components/DealCard.jsx

Props:
- `deal` — deal object
- `onClick(deal)`

This component is a DnD Kit `useDraggable` item. Its `id` is `deal._id`.

Renders:
- Deal name (bold)
- USD value
- Period badge
- Sector badge
- Tags (each as a small chip)

On click, call `onClick(deal)`. Make sure click does not fire when the user is dragging — DnD Kit handles this automatically if you attach the drag listeners correctly.

### 6.6 src/components/DealModal.jsx

Props:
- `deal` — null when creating, deal object when editing
- `stages` — array of stages for the status dropdown
- `onSave(data)` — called with form data on submit
- `onDelete(id)` — called when delete is confirmed
- `onClose()`

This is a modal overlay. It covers the full screen with a semi-transparent backdrop. On mobile it should behave like a bottom sheet (fixed to the bottom, full width).

Form fields:
- Name — text input, required
- Value — number input, required, placeholder "0"
- Stage — select dropdown
- Period — select dropdown (Q1–Q4)
- Sector — select dropdown
- Notes — textarea
- Tags — text input where the user types a tag and presses Enter or comma to add it. Display added tags as chips with an X to remove. Store as comma-separated string on save.

Footer:
- Left: Delete button (only shown when editing an existing deal). Clicking shows a confirmation message inline before calling `onDelete`.
- Right: Cancel button and Save button.

On Save, validate that Name and Value are not empty. Show an inline error if they are. Do not close the modal on validation failure.

### 6.7 src/components/StageSettings.jsx

Props:
- `stages` — array of stage objects
- `onAdd(data)` — add new stage
- `onEdit(id, data)` — update stage
- `onDelete(id)` — delete stage
- `onReorder(id, direction)` — move stage up or down
- `onClose()`

This is a modal with a list of existing stages. Each row shows:
- A color swatch (the stage color)
- The stage name
- Up / Down buttons to reorder
- An edit button (turns the row into an inline edit form)
- A delete button (disabled if deals are assigned to this stage — pass a `dealCounts` prop computed in `App.jsx` as a `{ [stageSlug]: count }` object)

At the bottom: an "Add Stage" form with fields for Name and Color (color picker input, type="color").

---

## Step 7 — Styling

### 7.1 src/styles/index.css

Use CSS custom properties (variables) for all colors and spacing. Define them on `:root`.

**Design direction:** Industrial / utilitarian — tight spacing, monospaced accents for numbers and badges, neutral background, column header colors as the only strong color. The board should feel like a focused work tool, not a marketing page.

**Suggested variables:**

```css
:root {
  --bg: #F4F4F0;
  --surface: #FFFFFF;
  --border: #E0DED8;
  --text-primary: #1A1A18;
  --text-secondary: #6B6B65;
  --text-muted: #9E9E98;
  --accent: #1A1A18;
  --radius: 6px;
  --shadow: 0 1px 3px rgba(0,0,0,0.08);

  --font-body: 'DM Sans', sans-serif;
  --font-mono: 'DM Mono', monospace;
}
```

Load `DM Sans` and `DM Mono` from Google Fonts in `index.html`.

**Key style rules:**

- Board: horizontal flex, gap between columns, overflow-x auto, min-height 100vh
- Column: fixed width 280px, flex column, rounded top (matching stage color as header bg)
- Column header: padding 12px 16px, white text, font-weight 600
- Deal count and value in the header: use `var(--font-mono)`, smaller size, opacity 0.85
- DealCard: white background, border `var(--border)`, border-radius `var(--radius)`, padding 14px, margin-bottom 8px, box-shadow `var(--shadow)`, cursor grab
- DealCard on drag: opacity 0.5
- Badge/chip: inline-block, border `var(--border)`, border-radius 999px, padding 2px 8px, font-size 11px, font-family mono, text-transform uppercase, letter-spacing 0.04em
- FilterBar: horizontal flex, flex-wrap, gap 8px, padding 16px 0
- Filter pill active: background `var(--accent)`, color white
- Modal backdrop: fixed, full screen, background rgba(0,0,0,0.4)
- Modal box: centered, max-width 520px, background white, border-radius 10px, padding 28px
- On mobile (max-width 640px): modal is positioned fixed bottom 0, full width, border-radius top only, max-height 90vh, overflow-y auto

---

## Step 8 — Docker Setup

### 8.1 nginx.conf

```nginx
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

The `try_files` line is required so that React's client-side routing works when the user refreshes the page.

### 8.2 docker-compose.yml

```yaml
services:
  hi-pipe:
    image: node:20-alpine
    working_dir: /app
    volumes:
      - .:/app
    command: sh -c "npm install && npm run build && cp -r dist /output"
    environment:
      - VITE_COCKPIT_API_URL=${VITE_COCKPIT_API_URL}
      - VITE_COCKPIT_API_KEY=${VITE_COCKPIT_API_KEY}

  hi-pipe-web:
    image: nginx:alpine
    ports:
      - "3200:80"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
      - ./dist:/usr/share/nginx/html:ro
    depends_on:
      - hi-pipe
```

**Note for the developer:** The build step runs inside a Node container and outputs to `./dist`. The Nginx container then serves that `dist` folder. You need to run `docker compose up` once to build, and again when you make code changes. Alternatively, you can build locally with `npm run build` and let Nginx serve the result.

In production, Caddy sits in front of the Nginx container and handles HTTPS and basic auth. You do not need to configure auth inside this app.

---

## Step 9 — Cockpit CMS Setup

Before running the app, you need to create the two collections in your Cockpit instance at `https://cms.hiyan.xyz/:hi-pipe/api`.

### 9.1 Create the Stages collection

Collection name: `stages`

Fields:
- `name` — Text
- `slug` — Text
- `color` — Text
- `sort_order` — Number

After creating the collection, add the five initial stage records:

| name | slug | color | sort_order |
|---|---|---|---|
| Lead | lead | #F59E0B | 1 |
| Progress | progress | #3B82F6 | 2 |
| Won | won | #10B981 | 3 |
| Lost | lost | #EF4444 | 4 |
| Pause | pause | #6B7280 | 5 |

### 9.2 Create the Deals collection

Collection name: `deals`

Fields:
- `name` — Text
- `value` — Number
- `stage` — Text
- `period` — Text
- `sector` — Text
- `notes` — Textarea
- `tags` — Text
- `sort_order` — Number

### 9.3 API Key

In Cockpit, generate an API key for the `hi-pipe` space. Make sure it has read and write access to both collections. Copy it into your `.env` file.

### 9.4 CORS

In Cockpit settings, add the domain where hi-pipe will be hosted to the allowed origins list. Without this, the browser will block all API requests.

---

## Step 10 — Build Order

Implement in this exact order. Each step should work before you move to the next.

1. Set up the project with Vite, install dependencies, confirm `npm run dev` works
2. Create `constants/options.js`
3. Create `api/cockpit.js` — test each function in the browser console before continuing
4. Create `useStages` hook — confirm stages load from Cockpit
5. Create `useDeals` hook — confirm deals load from Cockpit
6. Create `TotalsBar` — hardcode fake deals data to confirm rendering
7. Create `DealCard` — confirm it renders a deal correctly
8. Create `Column` — render a list of DealCards, confirm layout
9. Create `Board` — render all columns, no drag yet, confirm layout
10. Add DnD Kit drag and drop to Board and Column — confirm drag between columns works and calls `moveDeal`
11. Create `DealModal` — confirm create and edit work end to end
12. Create `FilterBar` — confirm filters change `filteredDeals` and totals update
13. Add URL sync for filters
14. Create `StageSettings` — confirm add, edit, delete, reorder work
15. Write CSS — apply all styles
16. Test on mobile — verify bottom sheet modal and horizontal board scroll
17. Build with `npm run build` and confirm the `dist` folder is generated
18. Test with Docker Compose locally

---

## Step 11 — Edge Cases to Handle

These are situations that will cause bugs if not handled. Address each one explicitly.

| Situation | How to handle |
|---|---|
| Cockpit returns `{ items: [], total: 0 }` on empty collection | Always read `result.items`, never treat the root as an array |
| Deal has no tags | `deal.tags` will be null or empty string — guard before splitting |
| User drags a card to the same column it is already in | Check `deal.stage !== newStageSlug` before calling the API |
| User deletes a stage that still has deals | Disable the delete button in StageSettings when `dealCounts[stage.slug] > 0` |
| API request fails | Show an inline error message near the relevant UI. Do not crash silently |
| Value field is left empty or set to 0 | Treat 0 as valid. Only block empty string |
| Tags input — user pastes a comma-separated string | Split on comma on paste, add each as a separate tag |
| Board on mobile — too many columns | CSS horizontal scroll on the board container, with `-webkit-overflow-scrolling: touch` |

---

## Glossary

- **Cockpit CMS** — the headless CMS that stores all data. We talk to it via HTTP requests.
- **DnD Kit** — the drag and drop library. `useDraggable` makes a card draggable. `useDroppable` makes a column a valid drop target.
- **Stage** — a column on the board (Lead, Progress, Won, Lost, Pause).
- **Deal** — a card on the board representing one sales opportunity.
- **Slug** — a lowercase, hyphenated identifier used as a stable key for a stage (e.g. `in-progress`). Unlike the name, it does not change when the stage is renamed.
- **Vite** — the build tool. `npm run dev` starts a local server. `npm run build` creates the production `dist` folder.
- **CORS** — a browser security rule that blocks requests to a different domain unless that domain explicitly allows it. Must be configured in Cockpit.
