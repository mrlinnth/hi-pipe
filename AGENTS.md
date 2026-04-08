# AGENTS.md - Sales Pipeline App (hi-pipe)

## Project Overview

A single-page React (Vite) kanban board for tracking sales deals. Uses Cockpit CMS as the backend API with Caddy basic auth for authentication. Deployed via Docker Compose on a single VPS.

**Tech Stack:**
- Frontend: React 18+ with Vite
- Backend: Cockpit CMS (existing instance)
- Auth: Caddy basic auth (reverse proxy level)
- Deployment: Docker Compose, managed via Dockge
- Styling: CSS/SCSS (not specified in PRD, assume standard CSS modules or styled-components)

## Agent Roles

### Frontend Agent
Responsible for:
- React component development
- State management (likely React Context or simple useState/useReducer)
- API integration with Cockpit CMS
- Drag-and-drop implementation (kanban board)
- Responsive design and mobile optimization
- Form handling and validation

**Key Directories:**
- `src/components/` - React components
- `src/hooks/` - Custom hooks (especially API hooks)
- `src/lib/` - Utility functions, API client
- `src/constants/` - Hardcoded values (sectors, periods)
- `src/styles/` - CSS/SCSS files

### Infrastructure Agent
Responsible for:
- Docker Compose configuration
- Nginx configuration for serving static build
- Environment variable management
- Deployment scripts
- CI/CD pipeline setup (if needed)

**Key Files:**
- `docker-compose.yml`
- `nginx.conf`
- `.env.example`
- `Dockerfile`

### Testing Agent
Responsible for:
- Unit tests for React components
- Integration tests for API client
- End-to-end tests for key workflows
- Test coverage reporting

**Testing Framework:**
- Use Vite's native test runner (Vitest)
- Component testing: React Testing Library
- E2E: Playwright or Cypress (to be decided)

## Collaboration Guidelines

### Before Starting Work
1. Read the PRD in `docs/prd.md`
2. Check this file for role-specific instructions
3. Identify which agent role best fits the task
4. Check for related issues or TODOs in the codebase

### Code Organization
- Components should be small and focused
- Keep API logic in `src/lib/api.js` or similar
- Use custom hooks for complex state logic
- Constants (sectors, periods) go in `src/constants/index.js`

### API Integration
All API calls go through Cockpit CMS:
- Base URL: `https://cms.hiyan.xyz/:hi-pipe/api`
- API key via `VITE_COCKPIT_API_KEY` env variable
- Use `api-key` header for authentication

**Key Endpoints:**
- `GET /content/items/deals` - fetch deals
- `POST /content/item/deals` - create deal
- `PUT /content/item/deals/:id` - update deal
- `DELETE /content/item/deals/:id` - delete deal
- `GET /content/items/stages` - fetch stages
- `POST/PUT/DELETE /content/item/stages` - stage management

### State Management
- Use React Context for app-wide state (deals, stages, filters)
- Use useState for local component state
- Consider React Query or similar for server state caching if needed

### Drag and Drop
- Use @hello-pangea/dnd or react-beautiful-dnd
- On drop: Update deal's `stage` field via Cockpit API
- Include mobile-friendly stage dropdown in edit form

### URL State
Filters persist in URL query parameters:
- `?period=q2&sector=Banking&tag=enterprise`
- Parse query params on mount
- Update URL when filters change

## Common Workflows

### Adding a New Feature
1. Create feature branch: `git checkout -b feature/feature-name`
2. Implement changes
3. Run tests: `npm test`
4. Run build: `npm run build`
5. Commit with descriptive message
6. Push and create PR (or ask for approval to merge)

### Fixing a Bug
1. Branch: `git checkout -b fix/bug-description`
2. Add test that reproduces bug (if possible)
3. Fix bug
4. Verify tests pass
5. Commit and create PR

### Updating API Integration
1. Check Cockpit API docs or PRD
2. Update API client in `src/lib/api.js`
3. Update types/interfaces if using TypeScript
4. Test with mock data first, then real API
5. Handle errors gracefully

## Build and Deployment

### Local Development
```bash
npm install
npm run dev
```

### Building for Production
```bash
npm run build
```
Output in `dist/` directory

### Running Locally with Docker
```bash
docker-compose up --build
```
Access at `http://localhost:8080`

### Environment Variables
Required in `.env`:
```
VITE_COCKPIT_API_URL=https://cms.hiyan.xyz/:hi-pipe/api
VITE_COCKPIT_API_KEY=your_key_here
```

## Testing Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Type check (if TypeScript)
npm run typecheck
```

## Important Design Decisions

### Architecture Decisions
- **Single-page app** - No routing needed except for URL state management
- **Client-side auth** - Caddy handles auth, frontend doesn't need login flow
- **No user accounts** - Single-user app, no RBAC needed
- **Kanban as primary view** - No list view or dashboard (out of scope)

### Data Model
- **Deals**: name, value, stage, period, sector, notes, tags, sort_order
- **Stages**: name, slug, color, sort_order
- **Sectors & Periods**: Hardcoded constants (move to CMS if needed later)

### UI/UX
- **Minimal design** - Clean, modern sans-serif, generous whitespace
- **Mobile responsive** - Horizontal scroll on mobile, bottom sheet for forms
- **No sidebars** - Full-width kanban board
- **Color-coded columns** - Uses hex color from Stage record

## Handoff Checklist

When handing off between agents:

- [ ] All tests passing
- [ ] Build succeeds without warnings
- [ ] Code is commented (only when necessary)
- [ ] New components follow existing patterns
- [ ] API changes documented
- [ ] Environment variables updated (if needed)
- [ ] Deployment tested locally with Docker

## Known Limitations (Out of Scope)

- No assignee/owner per deal
- No activity history
- No multiple pipelines
- No CSV export
- No list view
- No dashboard/charts
- Sectors and periods not configurable via UI

## References

- PRD: `docs/prd.md`
- Cockpit API Docs: https://getcockpit.com/documentation/api/
- Deployment: Dockge on VPS
- CMS Instance: `https://cms.hiyan.xyz/:hi-pipe/api`
