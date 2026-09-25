# CuratoCV Monorepo Platform

CuratoCV is a modular, multi-product professional career suite built on a strict platform-product architecture using pnpm workspaces, Turborepo, and React/Vite on the frontend with a Node.js/Express backend.

## Architecture

- **Platform (`platform/`):** Shared identity, billing, security, and communications.
- **Products (`resumebuilder/`, `memo/`):** Independent product domains (Memo formerly known as Notes).
- **Shared Packages (`packages/`):** `@curatocv/shared-utils`, `@curatocv/api-client`.
- **Dependency Direction:** Products may depend on Platform and shared packages. Product-to-product, Platform-to-product, and shared-package-to-product dependencies are forbidden.

## Workspace Packages

- `@curatocv/platform-backend`
- `@curatocv/platform-frontend`
- `@curatocv/resumebuilder-backend`
- `@curatocv/resumebuilder-frontend`
- `@curatocv/memo-backend`
- `@curatocv/memo-frontend`
- `@curatocv/shared-utils`
- `@curatocv/api-client`

## Architecture Status

Workspace ownership and dependency rules are documented in `docs/architecture/CODEBASE_MAP.md`. The API composition root is `backend/server.js`; domain backend routes remain owned by Platform, Resume Builder, and Memo. The Memo UI is currently a placeholder, while `/api/notes` remains its backend contract for compatibility. Architecture or security certification is made only after the relevant checks have been run.

For detailed architecture, refer to `docs/architecture/CODEBASE_MAP.md` and `docs/decisions/`.

## Getting Started

1. `pnpm install`
2. `pnpm test`
3. `pnpm build`

## Notes
- Zero AI attribution lines in any git commit or PR descriptions.
