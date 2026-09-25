# CuratoCV Codebase Map

## Architecture and Ownership

CuratoCV is a pnpm workspace monorepo orchestrated by Turborepo.

- `frontend/` is the Vite application shell. It owns bootstrap, global routing, providers, and application composition. Platform, Resume Builder, and Memo frontend directories are source packages consumed by this shell, not standalone applications.
- `backend/server.js` is the Express composition root. It initializes shared middleware and the database, mounts domain routers, and handles process shutdown. Domain behavior belongs in the owning backend package.
- `platform/backend` and `platform/frontend` own identity, authentication, billing, subscriptions, security, and shared platform UI/services.
- `resumebuilder/backend` and `resumebuilder/frontend` own resume APIs, editor behavior, AI/PDF work, and resume persistence.
- `memo/backend` and `memo/frontend` own Memo APIs and UI. The UI is currently a placeholder. The backend route remains mounted at `/api/notes` for API compatibility; `/notes` and `/products/notes` frontend redirects are intentional.
- `packages/api-client` and `packages/shared-utils` contain cross-domain shared code.

## Dependency Direction

Allowed:

```text
Product ──> Platform
   └──────> Shared packages
```

Forbidden:

```text
Product ──X──> Product
Platform ─X──> Product
Shared package ─X──> Product
```

Product packages should use declared workspace dependencies and public package exports for Platform and shared capabilities. The root backend composition package may depend on each domain package to register its router and lifecycle hooks. Packages must not reach upward into application or product code.

## Startup and Tests

- Frontend: `frontend/src/main.jsx` mounts `frontend/src/app/store.js` and `frontend/src/App.jsx`; the root shell imports pages through workspace package exports.
- Backend: `backend/server.js` connects to MongoDB and mounts Platform (`/api/users`, `/api/payments`, `/api/subscriptions`, `/api/health`), Resume Builder (`/api/resumes`, `/api/ai`), and Memo (`/api/notes`) routers.
- Backend tests live in `backend/Tests` and the configured repository-level test directories. Run them through the backend package so `backend/vitest.config.js` and its setup files are applied.

## Adding Features

Place product behavior in its owning domain. Add frontend routes in `frontend/src/App.jsx`, implement API routes within the owning backend package, and mount them in `backend/server.js`. Extract code to `packages/` only when it is genuinely product-agnostic.
