# CuratoCV

CuratoCV is a pnpm/Turborepo monorepo for a platform with two product domains: Resume Builder and Memo. The repository uses React/Vite on the frontend and Node.js/Express with MongoDB/Mongoose on the backend.

## Current Project Status

- **Application shell:** `frontend/` owns React startup, routing, Redux provider, global navigation composition, and mounts workspace pages.
- **Platform:** `platform/` owns authentication/account flows, shared identity, pricing, subscriptions, payments, health/security middleware, and common UI.
- **Resume Builder:** `resumebuilder/` owns resume editor and persistence, templates/customization, AI assistance, profile-image processing, PDF rendering, and public preview. The email-share helper is currently a frontend stub; it has no mounted backend route.
- **Memo:** `memo/backend/` owns the notes API, mounted at `/api/notes` for compatibility. Its responsive workspace landing page lists and creates documents through that API; folder hierarchy and editing are still upcoming. `/notes` and `/products/notes` redirect to the Memo route.
- **Shared packages:** `packages/api-client/` centralizes frontend HTTP access; `packages/shared-utils/` contains reusable utilities and validation helpers.
- **Backend composition:** `backend/server.js` connects infrastructure and mounts Platform, Resume Builder, and Memo routes. Domain logic remains in the product/platform packages.
- **Frontend domains:** Platform, Resume Builder, and Memo frontend workspaces are source packages consumed by the root Vite app, not separately runnable apps.

## Workspace Packages

The root pnpm workspace currently recognizes 10 packages:

| Workspace | Responsibility |
| --- | --- |
| `frontend` | Root web application shell |
| `backend` | API server and backend test orchestration |
| `@curatocv/platform-frontend` / `@curatocv/platform-backend` | Common platform UI and services |
| `@curatocv/resumebuilder-frontend` / `@curatocv/resumebuilder-backend` | Resume Builder product |
| `@curatocv/memo-frontend` / `@curatocv/memo-backend` | Memo product |
| `@curatocv/api-client` / `@curatocv/shared-utils` | Generic shared code |

## Dependency and Ownership Rules

Products may depend on Platform and shared packages. Product-to-product, Platform-to-product, and shared-package-to-product dependencies are forbidden. The root frontend and root backend compose the application; they should not duplicate domain business logic. The backend composition root may import domain packages to mount routers and lifecycle hooks.

## Development

Use Node.js compatible with the repository dependencies and pnpm `11.24.0`.

```bash
pnpm install
pnpm dev
pnpm build
pnpm test
pnpm test:all
pnpm --filter frontend lint
```

- `pnpm dev` starts configured persistent development tasks.
- `pnpm build` runs the Turbo build graph.
- `pnpm test` runs backend tests using `backend/vitest.config.js` and its setup.
- `pnpm test:all` runs configured test tasks across the workspace, including root frontend UI tests under `frontend/src`.
- `pnpm --filter frontend lint` checks the root app shell.
- `pnpm --filter backend start` starts the API and requires a working configured MongoDB connection (plus service configuration for flows that use external providers).

## Verification Snapshot

Latest recorded local checks from the migration cleanup work:

- `pnpm --recursive list --depth -1` — 10 root workspace packages recognized.
- `pnpm build` — completed successfully; Vite emitted a large-chunk advisory.
- `pnpm test:all` — completed successfully: 273 backend tests across 24 files; frontend had no test files.
- `pnpm --filter frontend lint` — currently fails on a pre-existing unused `navigate` error and a `useEffect` dependency warning in `frontend/src/App.jsx`.
- Runtime smoke check — root API and readiness returned HTTP 200 with an isolated test database; unauthenticated `/api/notes` returned HTTP 401, consistent with route authentication.

These are recorded checks, not a claim that every feature or production deployment has been certified. Re-run relevant checks after code changes. See [`docs/architecture/CODEBASE_MAP.md`](docs/architecture/CODEBASE_MAP.md), [`docs/decisions/`](docs/decisions/), and [`engineering-notes/`](engineering-notes/README.md) for architecture decisions and fundamentals-first explanations.
