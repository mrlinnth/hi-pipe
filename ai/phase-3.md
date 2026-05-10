"Read ai/CONSTRAINTS.md before starting. Apply all constraints without exception."

You are adding offline support and manual sync to hi-pipe.
Read all instructions before writing any code.

---

CONTEXT

Users may lose internet on mobile. When offline, they should be able to:
  - View all previously cached deals
  - Create new deals (queued locally)
  - Edit and delete their own deals (queued locally)

When back online, they press a sync button to:
  - Push all queued changes to Cockpit
  - Refresh deals and clients from Cockpit
  - Update the local cache

Reference data (stages, sectors, financialquarters) syncs once per day
or on manual sync — not on every load.

---

PACKAGES TO INSTALL

  npm install idb

idb is a small TypeScript-friendly wrapper around IndexedDB.
Do not use localStorage for structured data in this phase.

---

DATABASE SCHEMA

Create src/lib/db.ts using idb.

Database name: 'hi_pipe_db'
Version: 1

Object stores:
  'deals'              — keyPath: '_id'
  'clients'            — keyPath: '_id'
  'stages'             — keyPath: '_id'
  'sectors'            — keyPath: '_id'
  'quarters'           — keyPath: '_id'
  'sync_queue'         — keyPath: 'id', autoIncrement: true

sync_queue record shape:
  {
    id?: number;           — auto assigned
    action: 'create' | 'update' | 'delete';
    collection: 'deals';   — only deals are mutated by hi-pipe
    payload: Partial<Deal>;
    tempId?: string;       — for creates, a temporary local _id
    timestamp: number;
  }

Export these functions from db.ts:
  openDb(): Promise<DB>
  getAll<T>(store: string): Promise<T[]>
  putAll<T>(store: string, items: T[]): Promise<void>
  put<T>(store: string, item: T): Promise<void>
  remove(store: string, id: string): Promise<void>
  enqueue(entry: Omit<SyncQueueEntry, 'id'>): Promise<void>
  getQueue(): Promise<SyncQueueEntry[]>
  clearQueue(): Promise<void>

---

STEP 1 — Create src/lib/db.ts

Implement the database schema and functions above using idb.
Use a single openDb() call and reuse the connection.

---

STEP 2 — Create src/hooks/useOnlineStatus.ts

A simple hook that returns:
  { isOnline: boolean }

Use window.addEventListener('online') and window.addEventListener('offline')
to detect changes. Set initial value from navigator.onLine.

---

STEP 3 — Create src/lib/sync.ts

This file handles all sync logic.

Export:

1. seedCache(): Promise<void>
   Called on first load when online.
   Fetches deals, clients, stages, sectors, quarters from Cockpit.
   Stores each in IndexedDB using putAll.
   Stores a timestamp in localStorage: 'hi_pipe_last_sync' = Date.now()

2. syncNow(userId?: string): Promise<SyncResult>
   Called when user presses the sync button.

   SyncResult:
     { success: boolean; pushed: number; errors: string[] }

   Process:
     a. Get all entries from sync_queue
     b. For each entry in order:
          - 'create' → call createDeal from cockpit.ts, remove from queue
          - 'update' → call updateDeal, remove from queue
          - 'delete' → call deleteDeal, remove from queue
          - On error, add error message to errors array, keep in queue
     c. After processing queue, re-fetch deals (filtered by userId if provided)
        and clients, update IndexedDB
     d. For reference data (stages, sectors, quarters):
          - Only refresh if last sync was more than 24 hours ago
     e. Update 'hi_pipe_last_sync' timestamp
     f. Return SyncResult

3. shouldRefreshReferenceData(): boolean
   Read 'hi_pipe_last_sync' from localStorage.
   Return true if missing or older than 24 hours.

---

STEP 4 — Update src/hooks/useDeals.ts

Change the hook to read from IndexedDB instead of directly from Cockpit.

On mount:
  - Load deals from IndexedDB immediately (fast, works offline)
  - If online and no local data exists yet, call seedCache() first

For mutations (create, update, delete):
  - If online: call Cockpit API directly, then update IndexedDB
  - If offline: update IndexedDB immediately (optimistic), enqueue to sync_queue
    For creates offline: generate a temporary _id using crypto.randomUUID()
    and store in the deal record with a flag like _pending: true

Expose { deals, isLoading, createDeal, updateDeal, deleteDeal }
Same interface as before — components should not need to change.

---

STEP 5 — Update src/hooks/useReferenceData.ts

Change to read from IndexedDB instead of localStorage cache.

On mount:
  - Load from IndexedDB immediately
  - If IndexedDB is empty and online, call seedCache()

On manual sync (triggered externally):
  - Re-read from IndexedDB after syncNow completes

---

STEP 6 — Add sync UI

Add a sync status bar to the app. Place it below the top header,
above the filter bar.

It shows:
  - When online + no pending queue: nothing (hidden)
  - When online + pending queue items: "X changes pending — Sync now" button
  - When offline: "You are offline — changes will sync when reconnected"
    with a disabled sync button

When sync button is pressed:
  - Show "Syncing..." state
  - Call syncNow()
  - On success: show "Synced" briefly then hide
  - On error: show "Sync failed — X errors" with a retry option

Match existing plain CSS style. No new CSS frameworks.

---

STEP 7 — Service Worker for asset caching

Create public/sw.js — a simple service worker that caches the app shell
so the page loads when offline.

Cache strategy:
  - On install: cache index.html and all built JS/CSS assets
  - On fetch: serve from cache first, fall back to network

Register the service worker in src/main.tsx:
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
    })
  }

Note: Vite's build hashes asset filenames. The service worker must use
a cache-busting strategy. Use a cache name with a version string and
update it when deploying. For now, use 'hi-pipe-v1' as the cache name
and cache '/', '/index.html', and all files matching /assets/.

---

STEP 8 — Verify

Simulate offline by using browser devtools Network tab → set to Offline.

  - Board loads from IndexedDB cache
  - Creating a deal while offline adds it to the board immediately
    with a visual indicator (e.g. subtle dashed border or "pending" badge)
  - Going back online and pressing sync pushes the queued deal to Cockpit
  - After sync, the pending indicator disappears
