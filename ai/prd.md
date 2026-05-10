# PRD: Sales Pipeline App (hi-pipe)

## Overview

A lightweight, internal sales pipeline tool built as a single-page application. It uses a kanban board as the primary interface for tracking deals across configurable stages. Data is stored and served via an existing Cockpit CMS instance at `https://cms.hiyan.xyz/:hi-pipe/api`. Authentication is handled at the server level via Caddy basic auth. The app is containerized and deployed via Docker Compose on a single VPS managed with Dockge.

---

## Goals

- Replace ad-hoc deal tracking with a structured visual pipeline
- Keep the interface minimal and fast for a single daily user
- Build on existing infrastructure (Cockpit CMS, VPS, Dockge)
- Keep the architecture flexible enough to add features over time

---

## Non-Goals

- User accounts, login, or role-based access (Caddy handles this)
- Email notifications or integrations
- Reporting or analytics views (out of scope for now)

---

## Tech Stack

**Frontend:** React (Vite), served as a static build via Nginx in Docker

**Backend:** Cockpit CMS (existing instance at `https://cms.hiyan.xyz/:hi-pipe/api`)

**Auth:** Caddy basic authentication at the reverse proxy level

**Deployment:** Docker Compose, managed via Dockge on the same VPS as Cockpit

---

## Data Model (Cockpit Collections)

**Deals collection**

|Field|Type|Notes|
|---|---|---|
|name|Text|Deal name, required|
|value|Number|USD value, e.g. 5000|
|stage|Text|Stage slug, e.g. `lead`|
|period|Select|q1, q2, q3, q4|
|sector|Select|See sector list below|
|notes|Textarea|Free text|
|tags|Text|Comma-separated or Cockpit repeater|
|sort_order|Number|Card order within a column|

**Stages collection**

|Field|Type|Notes|
|---|---|---|
|name|Text|Display name|
|slug|Text|Unique identifier, e.g. `lead`|
|color|Text|Hex color for column header|
|sort_order|Number|Column order on the board|

---

## Initial Seed Data

**Stages**

|Name|Slug|Color|
|---|---|---|
|Lead|lead|`#F59E0B` (amber)|
|Progress|progress|`#3B82F6` (blue)|
|Won|won|`#10B981` (green)|
|Lost|lost|`#EF4444` (red)|
|Pause|pause|`#6B7280` (gray)|

**Sectors**

- Banking
- Insurance / Healthcare
- Microfinance / Edu / Hotel
- Manufacture / Retail
- Telecom / Infra / Media

**Periods:** Q1, Q2, Q3, Q4

Sectors and periods are hardcoded in the frontend as constants to start. They can be moved to a Cockpit collection later if they need to be user-configurable.

---

## Features

### Kanban Board

- Columns are dynamically rendered from the Stages collection via the Cockpit API
- Each column header shows the stage name, deal count, and total USD value of deals in that column
- Cards can be dragged between columns. On drop, the deal's `stage` field is updated via the Cockpit API
- Cards can also be moved via a stage dropdown inside the edit form, for mobile usability
- Column order respects `sort_order` on the Stages collection

### Deal Card

Each card displays:

- Deal name
- Value (formatted as USD, e.g. `$5,000`)
- Period badge (e.g. Q2)
- Sector badge
- Tags (if any)

Clicking a card opens a modal with the full edit form.

### Deal Form (Create / Edit)

Fields:

- Name (text, required)
- Value (number in USD, required)
- Stage (dropdown, required)
- Period (Q1 / Q2 / Q3 / Q4)
- Sector (dropdown from sector list)
- Notes (textarea)
- Tags (free multi-value input)

Actions: Save, Delete, Close

### Stage Management

Accessible via a gear icon or settings link in the top navigation.

- List all stages with name, color, and order
- Add a new stage
- Rename a stage
- Change a stage color
- Reorder stages via drag and drop or up/down controls
- Delete a stage (blocked or warned if deals are still assigned to it)

### Filtering

A filter bar sits above the board. All filters are combinable (e.g. Q2 + Banking).

- Period: All, Q1, Q2, Q3, Q4
- Sector: All, or any sector from the list
- Tag: All, or any tag present in the current dataset

When filters are active:

- Only matching cards are shown across all columns
- Column counts and USD totals update to reflect filtered deals
- The global totals bar updates reactively

Filters persist in the URL as query parameters so the view can be bookmarked.

### Totals Bar

Always visible. Shows:

- Total number of visible deals
- Total combined USD value of visible deals

Both update reactively as filters change or deals are moved.

---

## UI and Design

- Minimal and modern. Clean sans-serif typography, generous white space
- Column headers use the hex color defined in the Stage record
- Full-width kanban board, horizontal scroll on smaller screens
- Mobile responsive: board scrolls horizontally on small screens with a visible scroll affordance. Edit form opens as a bottom sheet on mobile
- No sidebars

---

## Deployment

The repo includes:

- `docker-compose.yml` with a single frontend service (Nginx serving the Vite build)
- `.env.example` documenting required variables
- Runtime environment variables:
    - `VITE_COCKPIT_API_URL=https://cms.hiyan.xyz/:hi-pipe/api`
    - `VITE_COCKPIT_API_KEY=your_key_here`

Caddy on the same VPS handles basic auth and HTTPS. No new backend container is needed. The Cockpit instance is accessed over the network from the frontend at build time via the env variable.

---

## Out of Scope (For Now, Possible Later)

- Assignee / owner per deal
- Activity log or history per deal
- Multiple pipelines
- Export to CSV
- List view toggle
- Dashboard / summary charts
- Configurable sectors and periods via UI

---

## Cockpit API Notes

Base URL: `https://cms.hiyan.xyz/:hi-pipe/api`

Key endpoints to use:

- `GET /content/items/deals` - fetch all deals, supports filter and sort params
- `POST /content/item/deals` - create a deal
- `PUT /content/item/deals/:id` - update a deal (stage change on drag, field edits)
- `DELETE /content/item/deals/:id` - delete a deal
- `GET /content/items/stages` - fetch all stages
- `POST /content/item/stages` - create a stage
- `PUT /content/item/stages/:id` - update a stage
- `DELETE /content/item/stages/:id` - delete a stage

API key is passed as `api-key` header on all requests.
