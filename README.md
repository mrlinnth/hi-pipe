# hi-pipe

A lightweight, internal sales pipeline tool built as a single-page React application with a kanban board interface. Uses Cockpit CMS as the backend API and is deployed via Docker Compose.

## Overview

hi-pipe provides a structured visual pipeline for tracking sales deals across configurable stages. It's designed as a single-user application with minimal friction for daily use.

## Features

- **Kanban Board**: Visual drag-and-drop interface for managing deals across stages
- **Dynamic Stages**: Stages are configurable via the backend API
- **Deal Management**: Create, edit, and delete deals with rich metadata
- **Filtering**: Filter deals by period, sector, and tags
- **Real-time Totals**: See total value and count of deals at a glance
- **Mobile Responsive**: Horizontal scroll and bottom-sheet forms on mobile
- **URL State**: Filters persist in URL for bookmarkable views

## Tech Stack

- **Frontend**: React 18+ with Vite
- **Backend**: Cockpit CMS (existing instance)
- **Auth**: Caddy basic authentication (reverse proxy level)
- **Deployment**: Docker Compose, managed via Dockge

## Setup

### Prerequisites

- Node.js 18+
- Docker & Docker Compose (for local development)

### Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env` file:
   ```bash
   cp .env.example .env
   ```
4. Add your Cockpit API key to `.env`
5. Start the dev server:
   ```bash
   npm run dev
   ```

### Building for Production

```bash
npm run build
```

Output will be in the `dist/` directory.

### Running with Docker

```bash
docker-compose up --build
```

Access at `http://localhost:3200`

## Environment Variables

Required in `.env`:

```env
VITE_COCKPIT_API_URL=https://cms.hiyan.xyz/:hi-pipe/api
VITE_COCKPIT_API_KEY=your_key_here
```

## Project Structure

```
hi-pipe/
├── src/
│   ├── components/    # React components (FilterBar, Board, etc.)
│   ├── hooks/         # Custom hooks (useDeals, useStages)
│   ├── api/           # Cockpit API client
│   ├── constants/     # Hardcoded values (PERIODS, SECTORS)
│   ├── styles/        # CSS with variables
│   ├── App.jsx        # Main application component
│   └── main.jsx      # React entry point
├── docs/
│   ├── PROGRESS.md    # Implementation progress tracking
│   └── implementation_plan.md  # Detailed implementation steps
├── AGENTS.md          # Agent collaboration guidelines
├── docker-compose.yml
└── nginx.conf
```

## Key Concepts

### Stages
Stages define the columns in your kanban board (e.g., Lead, Progress, Won, Lost). Each stage has a color and sort order.

### Deals
Deals are the cards in your pipeline. Each deal has:
- Name and value (USD)
- Stage assignment
- Period (Q1-Q4)
- Sector
- Notes and tags

### Filters
Combine filters to narrow your view:
- Period: Q1, Q2, Q3, Q4
- Sector: Banking, Insurance, etc.
- Tags: Any tag present in your deals

## Development Workflow

See `AGENTS.md` for detailed agent collaboration guidelines and workflows.

### Common Commands

```bash
# Development
npm run dev

# Build
npm run build

# Preview production build
npm run preview

# Run tests
npm test

# Lint code
npm run lint

# Type check (if TypeScript)
npm run typecheck
```

## Deployment

The application is deployed via Docker Compose on a VPS managed with Dockge. Caddy handles HTTPS and basic authentication at the reverse proxy level.

See `AGENTS.md` for infrastructure agent responsibilities and deployment procedures.

## Documentation

- [Implementation Plan](docs/implementation_plan.md) - Detailed implementation steps
- [Progress](docs/PROGRESS.md) - Current implementation status
- [AGENTS.md](AGENTS.md) - Agent collaboration guidelines

## Implementation Status

**Completed (Steps 1-8):**
- ✅ Project setup with Vite + React
- ✅ Constants for periods and sectors
- ✅ Cockpit API layer with all CRUD operations
- ✅ Custom hooks (useDeals, useStages)
- ✅ Global state and filtering logic
- ✅ All 7 components (FilterBar, TotalsBar, Board, Column, DealCard, DealModal, StageSettings)
- ✅ Comprehensive CSS styling with mobile responsiveness
- ✅ Docker setup with nginx and docker-compose

**Remaining (Steps 9-10):**
- ⏳ Cockpit CMS configuration (collections, API key, CORS)
- ⏳ End-to-end build verification

## API

The application uses Cockpit CMS as the backend. Key endpoints:

- `GET /content/items/deals` - Fetch all deals
- `POST /content/item/deals` - Create a deal
- `PUT /content/item/deals/:id` - Update a deal
- `DELETE /content/item/deals/:id` - Delete a deal
- `GET /content/items/stages` - Fetch all stages

All requests require an `api-key` header.

## License

Internal use only.
