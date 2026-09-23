# ADR 001: Monorepo Platform Architecture

## Status
Accepted

## Context
CuratoCV is expanding from a single Resume Builder application into a multi-product professional career suite (starting with Resume Builder, Notes, and future career tools). To support this growth without code duplication or messy coupling, we needed a scalable monorepo structure.

## Decision
We adopted a multi-package monorepo architecture using pnpm workspaces and Turborepo:
1. **Platform Core (`platform/`):** Encapsulates shared infrastructure (Identity, Billing, Security, Communications).
2. **Product Modules (`resumebuilder/`, `notes/`):** Independent domain applications consuming platform capabilities.
3. **Shared Packages (`packages/`):** Low-level shared utility libraries (`@curatocv/shared-utils`, `@curatocv/api-client`).

## Consequences
- Products are decoupled and can evolve independently.
- Platform capabilities are centralized and single-sourced.
- Cross-product dependencies are strictly prohibited.
