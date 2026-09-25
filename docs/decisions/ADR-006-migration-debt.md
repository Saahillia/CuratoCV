# ADR 006: Migration Baseline and Verification Limits

## Status

Accepted

## Context

The repository migration established Platform, Resume Builder, and Memo workspaces, a root frontend shell, and a backend composition package. The previous baseline had excluded `backend/` from the root workspace, used a root test command that bypassed the backend Vitest configuration, retained stale Notes test paths, and contained duplicate frontend state ownership.

## Decision

- `backend/` is a root workspace package and owns server composition and backend test orchestration.
- Backend tests run through `backend/vitest.config.js`; root `pnpm test` delegates to that package.
- Platform owns the canonical authentication slice. Resume Builder owns resume state and resume-specific local draft persistence.
- Products may depend on Platform and shared packages. Product-to-product, Platform-to-product, and shared-package-to-product dependencies are forbidden.
- The root backend may import domain packages to register routes and lifecycle hooks.
- Memo is the canonical product name. Its backend remains mounted at `/api/notes`, and the existing frontend Notes redirects remain compatibility routes. Its current frontend is a placeholder, not a completed product UI.

## Consequences

Workspace installation and test execution are represented in the root package graph. Test infrastructure or external-service failures must be reported as observed; they are not pre-certified host limitations. This ADR does not certify production security or runtime behavior. Those claims require explicit test, build, runtime, and security evidence.
