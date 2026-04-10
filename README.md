# Hi Pipe

A lightweight, internal sales pipeline tool built as a single-page React application with a kanban board interface. Uses Cockpit CMS as the backend API and is deployed via Docker Compose.

## Overview

Hi Pipe provides a structured visual pipeline for tracking sales deals across configurable stages. It's designed as a single-user application with minimal friction for daily use.

## Features

- **Kanban Board**: Visual drag-and-drop interface for managing deals across stages
- **Dynamic Stages**: Stages are configurable via the backend API
- **Deal Management**: Create, edit, and delete deals with rich metadata
- **Filtering**: Filter deals by period, sector, and tags
- **Real-time Totals**: See total value and count of deals at a glance
- **Mobile Responsive**: Horizontal scroll and bottom-sheet forms on mobile
- **URL State**: Filters persist in URL for bookmarkable views
- **PWA**: Installable as a progressive web app ("HiPipe")

## Tech Stack

- **Frontend**: React 18+ with Vite
- **Backend**: Cockpit CMS (existing instance)
- **Auth**: Caddy basic authentication (reverse proxy level)
- **Deployment**: Docker Compose, managed via Dockge
- **Styling**: Plain CSS with CSS custom properties

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
│   ├── components/    # React components (FilterBar, Board, DealModal, etc.)
│   ├── hooks/         # Custom hooks (useDeals, useStages)
│   ├── api/           # Cockpit API client (cockpit.js)
│   ├── constants/     # Hardcoded values (PERIODS, SECTORS)
│   ├── styles/        # CSS (index.css)
│   ├── App.jsx        # Main application component
│   └── main.jsx       # React entry point
├── docs/
│   ├── architecture.md       # Component tree, data flow, state management
│   └── implementation_plan.md
├── AGENTS.md          # Agent collaboration guidelines
├── docker-compose.yml
└── nginx.conf
```

## Key Concepts

### Stages
Stages define the columns in your kanban board (e.g., Lead, Progress, Won, Lost). Each stage has a color and sort order, configurable from within the app.

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

## Development

See `AGENTS.md` for detailed agent collaboration guidelines and `docs/architecture.md` for component and data flow documentation.

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
```

## Deployment

The application is deployed via Docker Compose on a VPS managed with Dockge. Caddy handles HTTPS and basic authentication at the reverse proxy level.

## API

The application uses Cockpit CMS as the backend. Key endpoints:

- `GET /content/items/deals` - Fetch all deals
- `POST /content/item/deals` - Create a deal
- `PUT /content/item/deals/:id` - Update a deal
- `DELETE /content/item/deals/:id` - Delete a deal
- `GET /content/items/stages` - Fetch all stages

All requests require an `api-key` header.

## Inspiration

Hi Pipe is inspired by [Scrumboy](https://github.com/markrai/scrumboy) by [@markrai](https://github.com/markrai) — a lightweight, no-nonsense project board that proved simplicity wins.

## Built With

Vibe coded using **GLM-4.6** on [OpenCode](https://github.com/sst/opencode) CLI and **Claude Sonnet 4.6** on [Claude Code](https://claude.ai/code).

## License

Internal use only.
