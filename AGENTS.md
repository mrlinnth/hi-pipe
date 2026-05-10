# Repository Guidelines

## Project Structure & Module Organization

- `src/` holds the app source.
- `src/components/` contains UI components, `src/hooks/` shared React hooks, `src/lib/` API and sync helpers, `src/context/` providers, and `src/types.ts` shared domain types.
- `src/styles/` contains global CSS.
- `public/` is for static assets served as-is.
- `ai/` contains the phase docs and constraints. Treat the phase files as the implementation source of truth.

## Build, Test, and Development Commands

- `npm run dev` starts the Vite dev server.
- `npm run build` creates a production build in `dist/`.
- `npm run preview` serves the built app locally.
- `npm run test` runs Vitest.
- `npm run lint` runs ESLint over `src/`.

## Coding Style & Naming Conventions

- Use TypeScript, React function components, and plain CSS only.
- Keep names camelCase for variables/functions and PascalCase for components/types.
- Define `Props` types above components when props are needed.
- Use explicit React event types such as `React.ChangeEvent<HTMLInputElement>`.
- Follow the existing DM Sans / DM Mono visual language; avoid introducing new styling frameworks.

## Testing Guidelines

- Vitest is the test runner.
- Add tests near the code they cover when practical.
- Name tests by behavior, not implementation detail.
- Run `npm run test` before finishing logic changes; run `npm run build` before finalizing larger changes.

## Commit & Pull Request Guidelines

- Keep commits small and descriptive. Existing history uses prefixes like `feat:` and `docs:`.
- Make one logical commit per completed unit of work when possible.
- PRs should include a short summary, key implementation notes, and screenshots for UI changes.
- Link relevant phase docs or issues in the PR description.

## Security & Configuration Tips

- Do not commit real API keys, tenant IDs, or other secrets.
- Keep environment-specific settings in `.env` files.
- Older overview docs may be outdated; follow the `ai/phase-*.md` files and `ai/CONSTRAINTS.md`.
