# Progress

- Phase 0 - TypeScript migration: done
  - Renamed JS entrypoints/hooks/components to TS/TSX, added `tsconfig.json`, shared types, and compile/runtime verification passed.
- Phase 1 - Microsoft Entra auth: done
  - Added MSAL login flow, auth context, team-mode login screen, and hid connection settings in team mode; build, lint, and personal-mode dev startup passed.
- Phase 2 - Cockpit reference data and access control: done
  - Added live Cockpit reference-data loading, owner-aware deal editing, read-only modal/card behavior, and verified build, lint, and personal-mode dev startup.
- Phase 3 - Offline support and manual sync: done
  - Added IndexedDB-backed deals/reference data caches, offline queueing, sync UI, pending deal indicators, and a manual service worker cache shell; build and lint passed.
