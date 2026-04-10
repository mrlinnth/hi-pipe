# AGENTS.md — Hi Pipe

Agent collaboration guidelines for the Hi Pipe sales pipeline app.

## Project Overview

A single-page React (Vite) kanban board for tracking sales deals. Uses Cockpit CMS as the backend API with Caddy basic auth for authentication. Deployed via Docker Compose.

**Tech Stack:**
- Frontend: React 18+ with Vite
- Backend: Cockpit CMS (existing instance at `https://cms.hiyan.xyz/:hi-pipe/api`)
- Auth: Caddy basic auth (reverse proxy level — frontend has no login flow)
- Deployment: Docker Compose on VPS, managed via Dockge
- Styling: Plain CSS (`src/styles/index.css`) with CSS custom properties

**PWA:** Installable. App name = "Hi Pipe", short name = "HiPipe".

## Repository Structure

```
hi-pipe/
├── src/
│   ├── api/
│   │   └── cockpit.js          # All Cockpit API calls (fetch/create/update/delete)
│   ├── components/
│   │   ├── Board.jsx            # Kanban board with @dnd-kit drag-and-drop
│   │   ├── Column.jsx           # One column per stage; droppable target
│   │   ├── ConnectionSettings.jsx # Modal to configure API URL/key at runtime
│   │   ├── DealCard.jsx         # Individual deal card; draggable
│   │   ├── DealModal.jsx        # Create/edit/delete deal form
│   │   ├── FilterBar.jsx        # Period / sector / tag filters
│   │   ├── StageSettings.jsx    # Add/edit/delete/reorder stages
│   │   └── TotalsBar.jsx        # Aggregate deal count and value
│   ├── constants/
│   │   └── options.js           # PERIODS and SECTORS arrays
│   ├── hooks/
│   │   ├── useDeals.js          # Deal CRUD + offline fallback
│   │   └── useStages.js         # Stage CRUD + offline fallback
│   ├── styles/
│   │   └── index.css            # All CSS (variables, layout, components)
│   ├── storage.js               # localStorage: API config, deal/stage cache, local CRUD
│   ├── App.jsx                  # Root component — state, filters, modal orchestration
│   └── main.jsx                 # React entry point
├── public/
│   ├── icon-192.png
│   ├── icon-512.png
│   └── icon-maskable.png
├── docs/
│   ├── architecture.md          # Component tree, data flow, state management
│   └── implementation_plan.md
├── docker-compose.yml
├── nginx.conf
├── vite.config.js               # Vite + VitePWA config
└── index.html
```

## Agent Roles

### Frontend Agent
Responsible for:
- React component development and maintenance
- State management (useState in App.jsx; hooks for server state)
- API integration with Cockpit CMS via `src/api/cockpit.js`
- Drag-and-drop via @dnd-kit (Board → Column → DealCard)
- Responsive design and mobile optimisation
- Form handling in DealModal and StageSettings

**Key patterns:**
- All components are named exports in `src/components/`
- State lives in `App.jsx`; components receive props and callbacks
- Offline mode is handled in hooks — no changes needed in components

### Infrastructure Agent
Responsible for:
- Docker Compose configuration (`docker-compose.yml`)
- Nginx configuration for serving static build (`nginx.conf`)
- Environment variable management (`.env.example`)
- Deployment on Dockge/VPS

**Key files:**
- `docker-compose.yml` — serves on port **3200**
- `nginx.conf` — serves `dist/` as static files
- `.env.example` — template for required env vars
- `vite.config.js` — also controls PWA manifest and service worker

### Testing Agent
Responsible for:
- Unit tests with Vitest
- Component testing with React Testing Library
- Integration tests for API client

**Testing framework:** Vitest + React Testing Library (configured via `vite.config.js`).

## Collaboration Guidelines

### Before Starting Work
1. Read `docs/architecture.md` for component/data flow overview
2. Identify which agent role fits the task
3. Check for related TODOs in the codebase

### Code Organisation Rules
- Components: small and focused, named exports, in `src/components/`
- API calls: only in `src/api/cockpit.js`
- Storage/cache/offline: only in `src/storage.js`
- State that spans the whole app: in `App.jsx`
- Constants: in `src/constants/options.js`

### API Integration
All API calls go through `src/api/cockpit.js`. The base URL and API key are read at call time from `src/storage.js` (localStorage first, env var fallback).

**Cockpit endpoints used:**
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/content/items/deals` | Fetch all deals |
| POST | `/content/item/deals` | Create a deal (body: `{ data: {...} }`) |
| POST | `/content/item/deals` | Update a deal (body: `{ data: { _id, ...fields } }`) |
| DELETE | `/content/item/deals/:id` | Delete a deal |
| GET | `/content/items/stages` | Fetch all stages |
| POST | `/content/item/stages` | Create a stage |
| POST | `/content/item/stages` | Update a stage |
| DELETE | `/content/item/stages/:id` | Delete a stage |

**Note:** Cockpit uses POST (not PUT) for both create and update — include `_id` in the body to update.

### Offline Mode
Both `useDeals` and `useStages` support full offline operation:
- On API failure, fall back to localStorage cache
- Local CRUD operations use `src/storage.js` helpers (`localCreateDeal`, etc.)
- `isOnline` flag is returned by each hook and surfaced in the UI as Online/Offline badge

### URL State
Active filters persist in URL query params (`?period=Q2&sector=Banking&tag=enterprise`). Parsed on mount, updated with `replaceState` on filter change — no router needed.

### Drag and Drop
Uses @dnd-kit. Flow: `Board` owns `DndContext` → `Column` is `useDroppable` → `DealCard` is `useDraggable`. On drop, `moveDeal(id, newStageSlug)` is called, which calls `editDeal` internally.

## Common Workflows

### Adding a New Component
1. Create `src/components/NewComponent.jsx` as a named export
2. Add CSS to `src/styles/index.css` using existing variable names
3. Wire into `App.jsx` or parent component

### Updating API Integration
1. Edit `src/api/cockpit.js` only
2. If the endpoint changes, update this file and the table in this document
3. Test with real API and verify offline fallback still works

### Adding a New Constant
Add to `src/constants/options.js` and update any component that renders it.

## Build and Deployment

### Local Development
```bash
npm install
npm run dev        # Vite dev server on http://localhost:5173
```

### Building for Production
```bash
npm run build      # Output in dist/
npm run preview    # Preview built app
```

### Running with Docker
```bash
docker-compose up --build
# Access at http://localhost:3200
```

### Environment Variables
Required in `.env`:
```
VITE_COCKPIT_API_URL=https://cms.hiyan.xyz/:hi-pipe/api
VITE_COCKPIT_API_KEY=your_key_here
```

The API URL and key can also be set at runtime via the **API** button in the app header (stored in localStorage), which overrides the env vars.

## Testing Commands

```bash
npm test                   # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
npm run lint               # ESLint
npm run build              # Production build (catches import errors)
```

## Design Decisions

- **No routing** — single page; URL used only for filter state
- **No auth in frontend** — Caddy handles it at the reverse proxy level
- **No React Context** — state is simple enough for prop-passing from App.jsx
- **Plain CSS** — one file with CSS custom properties; no CSS modules or styled-components
- **Offline first** — app works without API via localStorage cache and local CRUD

## Brand

- App name: **Hi Pipe**
- PWA installed name: **HiPipe**
- Brand color (navy): `#2d3a50` (`--brand` and `--accent` CSS variables)
- Navbar: icon (`/icon-192.png`) + two-tone "**Hi** Pipe" (Hi in navy, Pipe in default dark)

## Known Limitations (Out of Scope)

- No assignee/owner per deal
- No activity history
- No multiple pipelines
- No CSV export
- No list view or dashboard/charts
- Sectors and periods not configurable via UI

## References

- Architecture: `docs/architecture.md`
- Implementation plan: `docs/implementation_plan.md`
- Cockpit API docs: https://getcockpit.com/documentation/api/
- CMS instance: `https://cms.hiyan.xyz/:hi-pipe/api`
