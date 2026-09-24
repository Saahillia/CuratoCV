# CuratoCV Monorepo Platform

CuratoCV is a modular, multi-product professional career suite built on a strict platform-product architecture using pnpm workspaces, Turborepo, and React/Vite on the frontend with a Node.js/Express backend.

## Architecture

- **Platform (`platform/`):** Shared identity, billing, security, and communications.
- **Products (`resumebuilder/`, `notes/`):** Independent product domains.
- **Shared Packages (`packages/`):** `@curatocv/shared-utils`, `@curatocv/api-client`.
- **Dependency Direction:** Product → Platform → Packages. Products must never import from each other.

## Workspace Packages

- `@curatocv/platform-backend`
- `@curatocv/platform-frontend`
- `@curatocv/resumebuilder-backend`
- `@curatocv/resumebuilder-frontend`
- `@curatocv/notes-backend`
- `@curatocv/notes-frontend`
- `@curatocv/shared-utils`
- `@curatocv/api-client`

## Certified Architectural State

The CuratoCV monorepo architecture is certified compliant with the following standards:

- **Monorepo Structure**: pnpm workspaces + Turborepo.
- **Dependency Flow**: Product Domain → Platform Foundation → Shared Packages.
- **Ownership**: Explicit domain ownership established for `platform/`, `resumebuilder/`, `notes/`, and `packages/`.
- **Decoupling**: Fully decoupled lifecycle hooks for platform/product interactions.
- **Security Baseline**: Verified JWT/tokenVersion, constant-time auth, HMAC-SHA256 webhooks, and atomic credit transactions.
- **Migration Debt**: Explicitly tracked in `docs/decisions/ADR-006-migration-debt.md`.

For detailed architecture, refer to `docs/decisions/`.

## Getting Started

1. `pnpm install`
2. `pnpm test`
3. `pnpm build`

## Notes
- Zero AI attribution lines in any git commit or PR descriptions.
