# ADR 002: Domain Boundaries & Dependency Rules

## Status
Accepted

## Context
In a multi-product monorepo, uncontrolled imports between products lead to tight coupling, circular dependencies, and brittle architectures.

## Decision
We enforce strict unidirectional dependency ordering:
- `Product Domain` → `Platform Foundation` → `Shared Packages`
- `resumebuilder` MUST NOT import directly from `notes` (and vice-versa).
- Products access common user identity and billing via the `@curatocv/platform-*` packages.

## Consequences
- Clean separation of concerns.
- Easy isolation of product logic for deployment or testing.
