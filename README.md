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

## Phase Verification

All phases completed with zero regression:
- Phase 0: Baseline (268/268 tests, build pass)
- Phase 1: Monorepo Tooling (pnpm + Turbo)
- Phase 2: Directory Structure
- Phase 3: Platform Migration (3A-3F)
- Phase 4: Resume Builder Migration
- Phase 5: Notes Scaffold (`notes/`)
- Phase 6: Shared Packages (`packages/`)
- Phase 7: End-to-End Regression Gate
- Phase 8: Documentation & ADRs (001, 002)

## Getting Started

1. `pnpm install`
2. `pnpm test`
3. `pnpm build`

## Notes
- Zero AI attribution lines in any git commit or PR descriptions.
