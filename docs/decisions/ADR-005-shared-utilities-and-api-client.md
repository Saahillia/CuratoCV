# ADR 005: Shared Utilities & API Client Extraction

## Status
Accepted

## Context
Multiple workspace modules required identical helper logic (ObjectId validation, input sanitization) and standard HTTP client configurations without creating direct package interdependencies.

## Decision
Extracted generic, non-domain-specific utilities into `@curatocv/shared-utils` (`packages/shared-utils`) and front-end HTTP request abstraction into `@curatocv/api-client` (`packages/api-client`).

## Consequences
- Prevents duplication of basic utility logic across frontend and backend packages.
- Unifies Axios request configuration and error handling.
- Keeps domain packages clean and focused purely on business logic.
